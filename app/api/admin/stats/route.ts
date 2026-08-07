/**
 * 관리자 전용: 전체 가입자 통계 API
 * GET /api/admin/stats
 * plan별/role별/구독상태별 분포를 집계해서 반환한다.
 */
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '../../../../lib/supabase-server';
import { getMyProfile } from '../../../../lib/plan';

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getMyProfile(supabase);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const serviceSupabase = await createServiceClient();
    const { data, error } = await serviceSupabase
      .from('profiles')
      .select('plan, role, subscription_status');

    if (error) {
      console.error('[Admin Stats DB Error]', error);
      return NextResponse.json({ error: '통계 조회에 실패했습니다.' }, { status: 500 });
    }

    const rows = data ?? [];

    const totalUsers = rows.length;
    const freeUsers = rows.filter((r) => r.plan === 'free').length;
    const premiumUsers = rows.filter((r) => r.plan === 'premium').length;
    const adminUsers = rows.filter((r) => r.role === 'admin').length;

    const subscriptionStatus = rows.reduce(
      (acc, r) => {
        if (r.subscription_status === 'active') acc.active += 1;
        else if (r.subscription_status === 'canceled') acc.canceled += 1;
        else if (r.subscription_status === 'past_due') acc.past_due += 1;
        else acc.none += 1;
        return acc;
      },
      { active: 0, canceled: 0, past_due: 0, none: 0 },
    );

    return NextResponse.json({
      totalUsers,
      freeUsers,
      premiumUsers,
      adminUsers,
      subscriptionStatus,
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    const message = error instanceof Error ? error.message : '통계 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
