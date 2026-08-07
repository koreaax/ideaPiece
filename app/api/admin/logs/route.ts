/**
 * 관리자 전용: 최근 에러 로그 조회 API
 * GET /api/admin/logs
 * error_logs 테이블에서 최신 50개를 반환한다.
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
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Admin Logs DB Error]', error);
      return NextResponse.json({ error: '에러 로그 조회에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    console.error('[Admin Logs Error]', error);
    const message = error instanceof Error ? error.message : '에러 로그 조회 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
