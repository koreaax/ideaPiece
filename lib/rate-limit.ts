/**
 * IP 기반 Rate Limiting 유틸.
 * 서버리스 환경(Vercel)은 함수 인스턴스 간 메모리가 공유되지 않으므로,
 * Supabase의 ip_usage 테이블 + increment_ip_usage RPC로 영속적으로 카운트한다.
 * 계정을 여러 개 만들어 무료 한도(하루 1편)를 우회하는 어뷰징을 막기 위한 2차 방어선이며,
 * 정상적인 단일 사용자가 걸리지 않도록 넉넉한 한도로 설정한다.
 */
import { createServiceClient } from './supabase-server';

export const DEFAULT_IP_DAILY_LIMIT = 20;

/** 요청 객체에서 클라이언트 IP를 최대한 추정해서 추출한다. */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for는 "client, proxy1, proxy2" 형태일 수 있으므로 첫 번째 값 사용
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
};

/**
 * 해당 IP의 오늘 요청 횟수를 1 증가시키고, 한도를 초과했는지 확인한다.
 * DB 조회 자체가 실패하는 경우(네트워크 오류 등)에는 서비스 가용성을 우선시해서
 * 요청을 차단하지 않고 통과시킨다 (fail-open).
 */
export async function checkAndIncrementIpUsage(
  ip: string,
  limit: number = DEFAULT_IP_DAILY_LIMIT
): Promise<RateLimitResult> {
  if (ip === 'unknown') {
    // IP를 특정할 수 없는 경우 차단하지 않는다 (오탐 방지)
    return { allowed: true, count: 0, limit };
  }

  try {
    const supabase = await createServiceClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc('increment_ip_usage', {
      p_ip: ip,
      p_date: today,
    });

    if (error) {
      // RPC 실패 시 fail-open (서비스 가용성 우선)
      return { allowed: true, count: 0, limit };
    }

    const count = typeof data === 'number' ? data : 0;
    return { allowed: count <= limit, count, limit };
  } catch {
    return { allowed: true, count: 0, limit };
  }
}
