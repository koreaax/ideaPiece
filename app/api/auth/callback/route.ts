/**
 * Supabase OAuth 콜백 처리
 * Google 소셜 로그인 완료 후 이 라우트로 리다이렉트됩니다.
 */
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
