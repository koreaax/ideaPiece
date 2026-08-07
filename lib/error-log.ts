/**
 * 서버 에러를 Supabase error_logs 테이블에 기록하는 유틸.
 * 로깅 자체가 실패해도 원래 요청 처리 흐름을 절대 방해하지 않는다 (fire-and-forget, 항상 조용히 실패).
 */
import { createServiceClient } from './supabase-server';

export async function logServerError(
  route: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack ?? null : null;

    const supabase = await createServiceClient();
    await supabase.from('error_logs').insert({
      route,
      message,
      stack,
      context: context ?? null,
    });
  } catch {
    // 에러 로깅 자체가 실패해도 절대 상위로 전파하지 않는다 (조용히 무시)
  }
}
