/**
 * 관리자 전용: 사용자 목록 API
 * GET /api/admin/users
 * auth.users(이메일)와 profiles(플랜/role/구독)를 id 기준으로 join해서 반환한다.
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

    // NOTE: 200명 초과 시 페이지네이션 추가 필요 (listUsers의 page 파라미터 활용)
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.listUsers({
      perPage: 200,
    });

    if (authError) {
      console.error('[Admin Users Auth Error]', authError);
      return NextResponse.json({ error: '사용자 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    const { data: profileRows, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, plan, role, subscription_status, subscription_end_at, created_at');

    if (profileError) {
      console.error('[Admin Users Profile Error]', profileError);
      return NextResponse.json({ error: '사용자 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

    const users = (authData?.users ?? [])
      .map((authUser) => {
        const p = profileMap.get(authUser.id);
        return {
          id: authUser.id,
          email: authUser.email ?? null,
          plan: p?.plan ?? 'free',
          role: p?.role ?? 'user',
          subscription_status: p?.subscription_status ?? null,
          subscription_end_at: p?.subscription_end_at ?? null,
          created_at: p?.created_at ?? authUser.created_at,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[Admin Users Error]', error);
    const message = error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
