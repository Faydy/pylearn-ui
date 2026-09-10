-- Disposable PostgreSQL fixture based on the user-supplied production export.
-- NEVER run this fixture on Supabase/production.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
$$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'service_role') $$;
create table public.grades (id bigint primary key, name text);
create table public.profiles (
  id uuid primary key, username varchar not null unique, avatar text,
  grade_id bigint references grades(id), role varchar not null default 'student',
  total_xp integer default 0, current_streak integer default 0,
  longest_streak integer default 0, last_active_date date,
  created_at timestamp default now(), coin_balance integer not null default 0,
  total_coins_earned integer not null default 0, economy_initialized_at timestamptz
);
create table public.problems (id integer primary key, xp_reward integer, category_id integer);
create table public.submissions (
  id serial primary key, user_id uuid references profiles(id), problem_id integer references problems(id),
  code text not null, status varchar check(status in ('pending','accepted','wrong_answer','tle','runtime_error')),
  runtime_ms integer, memory_kb integer, submitted_at timestamp default now()
);
create table public.user_problem_status (
  user_id uuid references profiles(id), problem_id integer references problems(id),
  solved boolean default false, attempts_count integer default 0, solved_at timestamp,
  primary key (user_id, problem_id)
);
create table public.activity_log (
  user_id uuid references profiles(id), activity_date date not null,
  problems_solved_count integer default 0, primary key (user_id, activity_date)
);
create table public.user_category_progress (
  user_id uuid references profiles(id), category_id integer, progress_percent integer,
  primary key (user_id, category_id)
);
create table public.coin_transactions (
  id serial primary key, user_id uuid references profiles(id), amount integer,
  transaction_type text, reason text, created_at timestamptz default now()
);
-- The preexisting signature is required for CREATE OR REPLACE compatibility.
create function public.record_problem_submission(
  p_user_id uuid, p_problem_id integer, p_code text, p_status varchar,
  p_runtime_ms integer default null, p_memory_kb integer default null,
  p_activity_date date default current_date
) returns jsonb language plpgsql security definer set search_path = public
as $$ begin raise exception 'Fixture placeholder must be replaced by the migration'; end; $$;
