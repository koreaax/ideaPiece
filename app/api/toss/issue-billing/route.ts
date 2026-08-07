/**
 * 토스페이먼츠 빌링키 발급 및 결제 승인 API
 * POST /api/toss/issue-billing
 */
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '../../../../lib/supabase-server';
import { issueBillingKey, executeBilling } from '../../../../lib/toss';
import { getMyProfile } from '../../../../lib/plan';
import { logServerError } from '../../../../lib/error-log';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getMyProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { authKey, customerKey } = body;

    if (!authKey || !customerKey) {
      return NextResponse.json({ error: 'authKey와 customerKey가 필요합니다.' }, { status: 400 });
    }

    // 1. 빌링키 발급
    const billingResult = await issueBillingKey(authKey, customerKey);

    // 2. 첫달 구독료 (5,900원) 결제 실행
    const orderId = `sub_${profile.id.slice(0, 8)}_${Date.now()}`;
    const paymentResult = await executeBilling({
      billingKey: billingResult.billingKey,
      customerKey: billingResult.customerKey,
      amount: 5900,
      orderId,
      orderName: 'Fairytale IdeaPiece 프리미엄 1개월 구독',
    });

    // 3. 서비스 롤 클라이언트로 DB 업데이트 (유료 플랜 전환 + 30일 만료일 설정)
    const serviceSupabase = await createServiceClient();
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        plan: 'premium',
        toss_customer_key: billingResult.customerKey,
        toss_billing_key: billingResult.billingKey,
        subscription_status: 'active',
        subscription_end_at: nextMonth.toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[Toss Billing DB Update Error]', updateError);
      return NextResponse.json({ error: '구독 정보 업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '프리미엄 구독이 활성화되었습니다!',
      payment: paymentResult,
    });
  } catch (error) {
    console.error('[Toss Issue Billing Error]', error);
    await logServerError('/api/toss/issue-billing', error);
    const message = error instanceof Error ? error.message : '결제 승인 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
