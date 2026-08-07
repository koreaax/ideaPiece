/**
 * 현재 로그인한 사용자 프로필 조회 API
 * GET /api/me
 * ADMIN_EMAILS 판별 로직(getMyProfile)이 서버에서만 실행되어
 * 관리자 이메일 목록이 클라이언트 번들에 노출되지 않는다.
 */
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';
import { getMyProfile } from '../../../lib/plan';

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getMyProfile(supabase);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[Me API]', error);
    return NextResponse.json({ profile: null }, { status: 500 });
  }
}
