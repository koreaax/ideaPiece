/**
 * 구독 자동 갱신(재청구) 크론 API
 * GET /api/cron/renew-subscriptions
 *
 * Vercel Cron이 매일 1회(UTC 자정) 호출하는 배치 엔드포인트.
 * - subscription_status === 'active' 이고 subscription_end_at이 만료된 사용자를
 *   저장된 toss_billing_key로 재청구 시도
 * - 재청구 성공: subscription_end_at +30일 연장, subscription_status 'active' 유지
 * - 재청구 실패: subscription_status를 'past_due'로 변경 (유예 기간 부여, 즉시 강등 안 함)
 * - toss_billing_key가 없는 경우: 재청구 불가하므로 즉시 plan 'free' + status 'past_due'
 * - subscription_status === 'canceled'인 사용자는 대상에서 자동 제외 (status = 'active' 조건에 안 걸림)
 * - subscription_status === 'past_due'이고 만료일로부터 3일 이상 경과한 사용자는 plan을 'free'로 다운그레이드
 */
import { NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase-server';
import { executeBilling } from '../../../../lib/toss';
import { logServerError } from '../../../../lib/error-log';

const GRACE_PERIOD_DAYS = 3;
const RENEWAL_DAYS = 30;
const PREMIUM_AMOUNT = 5900;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const errors: string[] = [];
  let renewed = 0;
  let downgraded = 0;
  let processed = 0;

  try {
    const supabase = await createServiceClient();
    const now = new Date();

    // 1. 만료된(또는 만료 임박) active 구독자 조회 — canceled/free/admin은 자동 제외됨
    const { data: expiredProfiles, error: expiredError } = await supabase
      .from('profiles')
      .select('id, plan, toss_customer_key, toss_billing_key, subscription_status, subscription_end_at')
      .eq('subscription_status', 'active')
      .lte('subscription_end_at', now.toISOString());

    if (expiredError) {
      throw new Error(`만료 구독 조회 실패: ${expiredError.message}`);
    }

    processed = expiredProfiles?.length ?? 0;

    for (const profile of expiredProfiles ?? []) {
      try {
        if (!profile.toss_billing_key || !profile.toss_customer_key) {
          // 재청구 불가 — 즉시 무료 다운그레이드
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ plan: 'free', subscription_status: 'past_due' })
            .eq('id', profile.id);
          if (updateError) {
            errors.push(`[${profile.id}] 빌링키 없음 다운그레이드 업데이트 실패: ${updateError.message}`);
          }
          continue;
        }

        const orderId = `renew_${profile.id.slice(0, 8)}_${Date.now()}`;

        try {
          await executeBilling({
            billingKey: profile.toss_billing_key,
            customerKey: profile.toss_customer_key,
            amount: PREMIUM_AMOUNT,
            orderId,
            orderName: 'Fairytale IdeaPiece 프리미엄 1개월 자동갱신',
          });

          const nextEndAt = new Date();
          nextEndAt.setDate(nextEndAt.getDate() + RENEWAL_DAYS);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              plan: 'premium',
              subscription_status: 'active',
              subscription_end_at: nextEndAt.toISOString(),
            })
            .eq('id', profile.id);

          if (updateError) {
            errors.push(`[${profile.id}] 갱신 성공 후 DB 업데이트 실패: ${updateError.message}`);
          } else {
            renewed += 1;
          }
        } catch (billingError) {
          // 재청구 실패 — 유예 기간 부여, plan은 유지하고 상태만 past_due로 변경
          const message = billingError instanceof Error ? billingError.message : String(billingError);
          errors.push(`[${profile.id}] 재청구 실패: ${message}`);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);

          if (updateError) {
            errors.push(`[${profile.id}] past_due 상태 업데이트 실패: ${updateError.message}`);
          }
        }
      } catch (perUserError) {
        const message = perUserError instanceof Error ? perUserError.message : String(perUserError);
        errors.push(`[${profile.id}] 처리 중 알 수 없는 오류: ${message}`);
      }
    }

    // 2. 유예기간(3일) 만료된 past_due 사용자 -> free 다운그레이드
    const graceDeadline = new Date();
    graceDeadline.setDate(graceDeadline.getDate() - GRACE_PERIOD_DAYS);

    const { data: pastDueProfiles, error: pastDueError } = await supabase
      .from('profiles')
      .select('id, subscription_end_at')
      .eq('subscription_status', 'past_due')
      .lte('subscription_end_at', graceDeadline.toISOString());

    if (pastDueError) {
      errors.push(`유예기간 만료 대상 조회 실패: ${pastDueError.message}`);
    } else {
      for (const profile of pastDueProfiles ?? []) {
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', profile.id);

          if (updateError) {
            errors.push(`[${profile.id}] 유예기간 만료 다운그레이드 실패: ${updateError.message}`);
          } else {
            downgraded += 1;
          }
        } catch (perUserError) {
          const message = perUserError instanceof Error ? perUserError.message : String(perUserError);
          errors.push(`[${profile.id}] 유예기간 만료 처리 중 오류: ${message}`);
        }
      }
    }

    return NextResponse.json({ processed, renewed, downgraded, errors });
  } catch (error) {
    console.error('[Cron Renew Subscriptions Error]', error);
    await logServerError('/api/cron/renew-subscriptions', error, { processed, renewed, downgraded });
    const message = error instanceof Error ? error.message : '구독 갱신 크론 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message, processed, renewed, downgraded, errors }, { status: 500 });
  }
}
