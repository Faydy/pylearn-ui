-- Private submission history. These RPCs never accept a user id: the current
-- Supabase Auth identity is the only profile whose code can be returned.
create index if not exists submissions_user_submitted_at_idx
  on public.submissions (user_id, submitted_at desc);

create index if not exists submissions_user_problem_submitted_at_idx
  on public.submissions (user_id, problem_id, submitted_at desc);

create or replace function public.get_own_recent_submissions(
  p_offset integer default 0,
  p_limit integer default 8
)
returns table (
  submission_id bigint,
  problem_id integer,
  problem_title text,
  problem_difficulty text,
  xp_reward integer,
  submission_status text,
  submitted_at timestamptz,
  runtime_ms integer,
  memory_kb integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea trimiterile tale.';
  end if;

  return query
  select
    nullif(to_jsonb(s) ->> 'id', '')::bigint as submission_id,
    s.problem_id::integer,
    problem.title::text as problem_title,
    problem.difficulty::text as problem_difficulty,
    coalesce(problem.xp_reward, 0)::integer as xp_reward,
    (to_jsonb(s) ->> 'status')::text as submission_status,
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz as submitted_at,
    nullif(to_jsonb(s) ->> 'runtime_ms', '')::integer as runtime_ms,
    nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb
  from public.submissions s
  join public.problems problem on problem.id = s.problem_id
  where s.user_id = auth.uid()
  order by
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz desc nulls last,
    nullif(to_jsonb(s) ->> 'id', '')::bigint desc nulls last
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 8), 1), 50);
end;
$$;

create or replace function public.get_own_problem_submissions(
  p_problem_id integer,
  p_offset integer default 0,
  p_limit integer default 20
)
returns table (
  submission_id bigint,
  problem_id integer,
  problem_title text,
  problem_difficulty text,
  xp_reward integer,
  submission_status text,
  submitted_at timestamptz,
  runtime_ms integer,
  memory_kb integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea trimiterile tale.';
  end if;

  return query
  select
    nullif(to_jsonb(s) ->> 'id', '')::bigint as submission_id,
    s.problem_id::integer,
    problem.title::text as problem_title,
    problem.difficulty::text as problem_difficulty,
    coalesce(problem.xp_reward, 0)::integer as xp_reward,
    (to_jsonb(s) ->> 'status')::text as submission_status,
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz as submitted_at,
    nullif(to_jsonb(s) ->> 'runtime_ms', '')::integer as runtime_ms,
    nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb
  from public.submissions s
  join public.problems problem on problem.id = s.problem_id
  where s.user_id = auth.uid()
    and s.problem_id = p_problem_id
  order by
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz desc nulls last,
    nullif(to_jsonb(s) ->> 'id', '')::bigint desc nulls last
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
end;
$$;

create or replace function public.get_own_submission(p_submission_id bigint)
returns table (
  submission_id bigint,
  problem_id integer,
  problem_title text,
  problem_difficulty text,
  xp_reward integer,
  submission_status text,
  submitted_at timestamptz,
  source_code text,
  runtime_ms integer,
  memory_kb integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea o soluție.';
  end if;

  return query
  select
    nullif(to_jsonb(s) ->> 'id', '')::bigint as submission_id,
    s.problem_id::integer,
    problem.title::text as problem_title,
    problem.difficulty::text as problem_difficulty,
    coalesce(problem.xp_reward, 0)::integer as xp_reward,
    (to_jsonb(s) ->> 'status')::text as submission_status,
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz as submitted_at,
    coalesce(
      nullif(to_jsonb(s) ->> 'code', ''),
      nullif(to_jsonb(s) ->> 'source_code', '')
    )::text as source_code,
    nullif(to_jsonb(s) ->> 'runtime_ms', '')::integer as runtime_ms,
    nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb
  from public.submissions s
  join public.problems problem on problem.id = s.problem_id
  where s.user_id = auth.uid()
    and nullif(to_jsonb(s) ->> 'id', '')::bigint = p_submission_id;
end;
$$;

create or replace function public.get_own_latest_problem_submission(p_problem_id integer)
returns table (
  submission_id bigint,
  problem_id integer,
  problem_title text,
  problem_difficulty text,
  xp_reward integer,
  submission_status text,
  submitted_at timestamptz,
  source_code text,
  runtime_ms integer,
  memory_kb integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea o soluție.';
  end if;

  return query
  select
    nullif(to_jsonb(s) ->> 'id', '')::bigint as submission_id,
    s.problem_id::integer,
    problem.title::text as problem_title,
    problem.difficulty::text as problem_difficulty,
    coalesce(problem.xp_reward, 0)::integer as xp_reward,
    (to_jsonb(s) ->> 'status')::text as submission_status,
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz as submitted_at,
    coalesce(
      nullif(to_jsonb(s) ->> 'code', ''),
      nullif(to_jsonb(s) ->> 'source_code', '')
    )::text as source_code,
    nullif(to_jsonb(s) ->> 'runtime_ms', '')::integer as runtime_ms,
    nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb
  from public.submissions s
  join public.problems problem on problem.id = s.problem_id
  where s.user_id = auth.uid()
    and s.problem_id = p_problem_id
  order by
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz desc nulls last,
    nullif(to_jsonb(s) ->> 'id', '')::bigint desc nulls last
  limit 1;
end;
$$;

revoke all on function public.get_own_recent_submissions(integer, integer) from public;
revoke all on function public.get_own_problem_submissions(integer, integer, integer) from public;
revoke all on function public.get_own_submission(bigint) from public;
revoke all on function public.get_own_latest_problem_submission(integer) from public;

grant execute on function public.get_own_recent_submissions(integer, integer) to authenticated;
grant execute on function public.get_own_problem_submissions(integer, integer, integer) to authenticated;
grant execute on function public.get_own_submission(bigint) to authenticated;
grant execute on function public.get_own_latest_problem_submission(integer) to authenticated;
