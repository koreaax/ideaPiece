/**
 * 플랜 조회 & rate-limit 유틸 (서버 전용)
 * Supabase profiles / daily_usage 테이블을 사용합니다.
 */
import { SupabaseClient } from '@supabase/supabase-js';

export type Plan = 'free' | 'premium';
export type Role = 'user' | 'admin';

export type UserProfile = {
  id: string;
  plan: Plan;
  role: Role;
  toss_customer_key: string | null;
  toss_billing_key: string | null;
  subscription_status: string | null;
  subscription_end_at: string | null;
};

/** 현재 로그인 사용자의 플랜 및 권한 조회 */
export async function getMyProfile(supabase: SupabaseClient): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan, role, toss_customer_key, toss_billing_key, subscription_status, subscription_end_at')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    // 프로필 정보가 없더라도 ADMIN_EMAILS 목록에 해당 이메일이 있으면 임시 admin 객체 반환
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return {
        id: user.id,
        plan: 'premium',
        role: 'admin',
        toss_customer_key: null,
        toss_billing_key: null,
        subscription_status: 'active',
        subscription_end_at: null,
      };
    }
    return null;
  }

  const profile = data as UserProfile;

  // 환경 변수로 설정된 ADMIN_EMAILS 체크
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    profile.role = 'admin';
  }

  // subscription_end_at이 지났으면 (단, admin이 아닌 경우만) free로 취급
  if (profile.role !== 'admin' && profile.plan === 'premium' && profile.subscription_end_at) {
    const endAt = new Date(profile.subscription_end_at);
    if (endAt < new Date()) {
      profile.plan = 'free';
    }
  }

  return profile;
}

/** 유료 플랜 또는 관리자 권한 여부 확인 (관리자는 결제 없이 무제한 이용) */
export async function isPremium(supabase: SupabaseClient): Promise<boolean> {
  const profile = await getMyProfile(supabase);
  if (!profile) return false;

  return profile.plan === 'premium' || profile.role === 'admin';
}

/** 오늘 무료 생성 횟수 조회 (없으면 0) */
export async function getDailyUsage(supabase: SupabaseClient, userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data } = await supabase
    .from('daily_usage')
    .select('story_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  return data?.story_count ?? 0;
}

/** 오늘 생성 횟수를 1 증가 (upsert) */
export async function incrementDailyUsage(supabase: SupabaseClient, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  await supabase.rpc('increment_daily_usage', { p_user_id: userId, p_date: today });
}

/** 무료 플랜 하루 1편 제한 초과 여부 (관리자나 유료 사용자는 예외) */
export const FREE_DAILY_LIMIT = 1;

export async function hasExceededFreeLimit(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const profile = await getMyProfile(supabase);
  if (profile?.role === 'admin' || profile?.plan === 'premium') {
    return false;
  }

  const count = await getDailyUsage(supabase, userId);
  return count >= FREE_DAILY_LIMIT;
}
