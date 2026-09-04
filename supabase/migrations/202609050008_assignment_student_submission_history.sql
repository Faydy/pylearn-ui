-- A classroom owner may inspect every submission for an assigned problem,
-- including failed attempts, without receiving broad SELECT access to the
-- submissions table. The assignment, member, and problem are all verified
-- against the authenticated teacher before code is returned.
create or replace function public.get_assignment_student_problem_submissions(
  p_assignment_id bigint,
  p_student_id uuid,
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
  source_code text,
  runtime_ms integer,
  memory_kb integer,
  submission_number integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea soluțiile elevilor.';
  end if;

  select a.classroom_id
  into v_classroom_id
  from public.assignments a
  join public.classrooms c on c.id = a.classroom_id
  where a.id = p_assignment_id
    and c.teacher_id = auth.uid();

  if not found then
    raise exception 'Nu ai permisiunea să vezi soluțiile acestei teme.';
  end if;

  perform 1
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  where cm.classroom_id = v_classroom_id
    and cm.student_id = p_student_id
    and lower(coalesce(p.role, '')) in ('elev', 'student');

  if not found then
    raise exception 'Elevul nu face parte din această clasă.';
  end if;

  perform 1
  from public.assignment_problems ap
  where ap.assignment_id = p_assignment_id
    and ap.problem_id = p_problem_id;

  if not found then
    raise exception 'Problema nu face parte din această temă.';
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
    nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb,
    row_number() over (
      order by
        nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz asc nulls last,
        nullif(to_jsonb(s) ->> 'id', '')::bigint asc nulls last
    )::integer as submission_number
  from public.submissions s
  join public.problems problem on problem.id = s.problem_id
  where s.user_id = p_student_id
    and s.problem_id = p_problem_id
  order by
    nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz desc nulls last,
    nullif(to_jsonb(s) ->> 'id', '')::bigint desc nulls last
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
end;
$$;

revoke all on function public.get_assignment_student_problem_submissions(bigint, uuid, integer, integer, integer) from public;
grant execute on function public.get_assignment_student_problem_submissions(bigint, uuid, integer, integer, integer) to authenticated;
