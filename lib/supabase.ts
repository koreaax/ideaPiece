/**
 * Supabase 브라우저 클라이언트 싱글턴
 * 'use client' 컴포넌트에서만 사용하세요.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
