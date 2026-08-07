-- ============================================================
-- Fairytale IdeaPiece — 운영 테이블 추가 (RLS 보완 + 에러 모니터링 + Rate Limiting)
-- ============================================================
-- 이 마이그레이션은 001_init.sql 을 수정하지 않고 아래 3가지를 추가한다.
--   (A) profiles 테이블의 누락된 RLS 정책 보완 (INSERT / DELETE)
--   (B) error_logs 테이블 신규 생성 (에러 모니터링용, 서비스 롤 전용 기록)
--   (C) ip_usage 테이블 신규 생성 (IP 기반 Rate Limiting용, 서비스 롤 전용 접근)
--
-- 참고: daily_usage 테이블은 001_init.sql에서 이미
--   `for all using (auth.uid() = user_id)` 정책이 적용되어 있으며,
--   Postgres RLS의 `for all`은 select/insert/update/delete를 전부 포함하므로
--   별도의 delete 정책이 없다는 지적은 실제로는 문제가 되지 않는다.
--   (따라서 daily_usage에는 정책을 추가하지 않는다.)
-- ============================================================

-- ============================================================
-- (0) 안전장치: profiles.role 컬럼이 없으면 추가한다.
-- ============================================================
-- 001_init.sql이 role 컬럼 없이 실행되었거나(예전 버전) 아직 적용되지
-- 않은 환경에서도 이 마이그레이션이 단독으로 안전하게 동작하도록 한다.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'role'
  ) then
    alter table profiles add column role text not null default 'user';
  end if;
end $$;

-- ============================================================
-- (A) profiles: 누락된 RLS 정책 보완 (INSERT / DELETE)
-- ============================================================
-- 신규가입 트리거(handle_new_user)는 security definer로 동작하여 RLS를
-- 우회하지만, 클라이언트에서 직접 upsert를 시도하는 경우를 대비해
-- 본인 행에 한해 삽입을 허용한다.
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- 회원 탈퇴 시 본인 프로필 삭제를 허용한다.
drop policy if exists "profiles_delete_own" on profiles;
create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = id);

-- ============================================================
-- (B) error_logs: 에러 모니터링용 테이블
-- ============================================================
create table if not exists error_logs (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  route       text not null,          -- 예: '/api/story', '/api/cron/renew-subscriptions'
  message     text not null,
  stack       text,
  context     jsonb                   -- 추가 컨텍스트 (user_id, request body 요약 등)
);

alter table error_logs enable row level security;

-- 조회: profiles.role = 'admin' 인 사용자만 허용
drop policy if exists "error_logs_select_admin_only" on error_logs;
create policy "error_logs_select_admin_only" on error_logs
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- 삽입: 별도 INSERT 정책을 만들지 않는다 (anon/authenticated 키로는 기본 차단).
-- 이 테이블은 서비스 롤 키로만 기록됩니다 (app 서버 코드에서 createServiceClient 사용).
-- 서비스 롤 키는 RLS 정책과 무관하게 항상 전체 접근이 가능한 Supabase 표준 동작을 따른다.

create index if not exists error_logs_created_at_idx on error_logs (created_at desc);

-- ============================================================
-- (C) ip_usage: IP 기반 Rate Limiting용 테이블
-- ============================================================
create table if not exists ip_usage (
  id             uuid default gen_random_uuid() primary key,
  ip             text not null,
  date           date not null default current_date,
  request_count  int not null default 0,
  unique(ip, date)
);

alter table ip_usage enable row level security;

-- 정책을 하나도 만들지 않는다: RLS가 활성화된 상태에서 정책이 없으면
-- anon/authenticated 키의 모든 접근(select/insert/update/delete)이
-- 기본적으로 거부되며, 오직 서비스 롤 키만 RLS를 우회하여 접근할 수 있다.

create index if not exists ip_usage_ip_date_idx on ip_usage (ip, date);

-- ============================================================
-- IP 사용량 1 증가 (RPC) — increment_daily_usage와 동일한 패턴
-- ============================================================
-- 현재 카운트를 증가시키고 증가된 후의 값을 반환한다.
-- rate limit 체크 로직에서 이 반환값과 한도를 비교하는 방식으로 사용한다.
create or replace function increment_ip_usage(p_ip text, p_date date)
returns int language plpgsql security definer as $$
declare
  v_count int;
begin
  insert into ip_usage (ip, date, request_count)
  values (p_ip, p_date, 1)
  on conflict (ip, date)
  do update set request_count = ip_usage.request_count + 1
  returning request_count into v_count;
  return v_count;
end;
$$;
