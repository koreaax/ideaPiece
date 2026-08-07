/**
 * 프리미엄 구독 해지 API
 * POST /api/toss/cancel-subscription
 *
 * 토스페이먼츠에는 빌링키 자체를 삭제하는 별도 API가 없어(자동결제 재승인 없이는
 * 카드 재청구가 불가능한 구조), 우리 서비스 DB의 subscription_status만 'canceled'로
 * 변경한다. plan과 subscription_end_at은 건드리지 않아 이미 결제한 기간까지는
 * 프리미엄 혜택이 유지되고, 이후 갱신 크론이 'active' 상태만 갱신하도록 하면
 * 실질적으로 해지된다.
 */
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '../../../../lib/supabase-server';
import { getMyProfile } from '../../../../lib/plan';
import { logServerError } from '../../../../lib/error-log';

export async function POST() {
  try {
    const supabase = await createClient();
    const profile = await getMyProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: '해지할 구독이 없습니다.' }, { status: 400 });
    }

    if (profile.role === 'admin') {
      return NextResponse.json({ error: '관리자는 별도 구독이 없습니다.' }, { status: 400 });
    }

    if (profile.plan !== 'premium') {
      return NextResponse.json({ error: '해지할 구독이 없습니다.' }, { status: 400 });
    }

    if (profile.subscription_status === 'canceled') {
      return NextResponse.json({ error: '이미 해지된 구독입니다.' }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[Toss Cancel Subscription DB Update Error]', updateError);
      return NextResponse.json({ error: '구독 해지 처리에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '구독이 해지되었습니다. 현재 결제 기간이 끝나는 날짜까지는 계속 이용하실 수 있어요.',
      endsAt: profile.subscription_end_at,
    });
  } catch (error) {
    console.error('[Toss Cancel Subscription Error]', error);
    await logServerError('/api/toss/cancel-subscription', error);
    const message = error instanceof Error ? error.message : '구독 해지 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
