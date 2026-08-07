-- ============================================================
-- Fairytale IdeaPiece — 초기 스키마 (Toss Payments & Admin 권한 추가)
-- ============================================================

-- 1. 사용자 프로필 (auth.users 1:1 확장)
create table if not exists profiles (
  id                     uuid references auth.users on delete cascade primary key,
  plan                   text not null default 'free',   -- 'free' | 'premium'
  role                   text not null default 'user',   -- 'user' | 'admin'
  toss_customer_key      text,                           -- 토스 고객 고유키
  toss_billing_key       text,                           -- 자동 결제용 빌링키
  subscription_status    text,                           -- 'active' | 'canceled' | 'past_due' | null
  subscription_end_at    timestamptz,
  created_at             timestamptz default now()
);

-- 기존 테이블이 이미 있는 경우 role 컬럼 추가
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='profiles' and column_name='role'
  ) then
    alter table profiles add column role text not null default 'user';
  end if;
end $$;

-- 2. 하루 생성 횟수 (무료 플랜 rate-limit)
create table if not exists daily_usage (
  id          uuid    default gen_random_uuid() primary key,
  user_id     uuid    references auth.users on delete cascade,
  date        date    not null default current_date,
  story_count int     not null default 0,
  unique(user_id, date)
);

-- ============================================================
-- Row Level Security (보안 정책)
-- ============================================================
alter table profiles    enable row level security;
alter table daily_usage enable row level security;

-- profiles: 기존 정책 삭제 후 재생성
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- daily_usage: 기존 정책 삭제 후 재생성
drop policy if exists "daily_usage_own" on daily_usage;
create policy "daily_usage_own" on daily_usage
  for all using (auth.uid() = user_id);

-- ============================================================
-- 신규 가입 시 profiles 자동 생성 트리거
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 하루 생성 횟수 1 증가 (RPC)
-- ============================================================
create or replace function increment_daily_usage(p_user_id uuid, p_date date)
returns void language plpgsql security definer as $$
begin
  insert into daily_usage (user_id, date, story_count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set story_count = daily_usage.story_count + 1;
end;
$$;
