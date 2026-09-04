-- Keep a stable ordinal for each user's submissions to one problem while the
-- visible history remains ordered newest first.
create or replace function public.get_own_problem_submission_history(
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
  memory_kb integer,
  submission_number integer
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
    nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb,
    row_number() over (
      order by
        nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz asc nulls last,
        nullif(to_jsonb(s) ->> 'id', '')::bigint asc nulls last
    )::integer as submission_number
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

revoke all on function public.get_own_problem_submission_history(integer, integer, integer) from public;
grant execute on function public.get_own_problem_submission_history(integer, integer, integer) to authenticated;
