-- Fix the public submission history query without changing its exposed RPC
-- signature. Keeping each selected field explicit avoids composite-row field
-- resolution failures when the function is executed by an authenticated user.
create or replace function public.get_public_user_submissions(
  p_profile_user_id uuid,
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
  solved boolean,
  can_view_code boolean,
  source_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer_id uuid;
begin
  v_viewer_id := auth.uid();

  if v_viewer_id is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea soluțiile unui utilizator.';
  end if;

  if not exists (select 1 from public.profiles where id = p_profile_user_id) then
    raise exception 'Utilizatorul nu a fost găsit.';
  end if;

  return query
  with visible_submissions as (
    select
      nullif(to_jsonb(s) ->> 'id', '')::bigint as submission_id,
      s.problem_id::integer as problem_id,
      problem.title::text as problem_title,
      problem.difficulty::text as problem_difficulty,
      coalesce(problem.xp_reward, 0)::integer as xp_reward,
      (to_jsonb(s) ->> 'status')::text as submission_status,
      nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz as submitted_at,
      nullif(to_jsonb(s) ->> 'runtime_ms', '')::integer as runtime_ms,
      nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb,
      coalesce(
        nullif(to_jsonb(s) ->> 'code', ''),
        nullif(to_jsonb(s) ->> 'source_code', '')
      )::text as submission_source_code,
      coalesce(author_status.solved, false) as solved,
      (
        s.user_id = v_viewer_id
        or exists (
          select 1
          from public.user_problem_status viewer_status
          where viewer_status.user_id = v_viewer_id
            and viewer_status.problem_id = s.problem_id
            and viewer_status.solved = true
        )
        or exists (
          select 1
          from public.classrooms classroom
          join public.classroom_members member
            on member.classroom_id = classroom.id
          where classroom.teacher_id = v_viewer_id
            and member.student_id = s.user_id
        )
      ) as can_view_code
    from public.submissions s
    join public.problems problem on problem.id = s.problem_id
    left join public.user_problem_status author_status
      on author_status.user_id = s.user_id
      and author_status.problem_id = s.problem_id
    where s.user_id = p_profile_user_id
  )
  select
    submission_id,
    problem_id,
    problem_title,
    problem_difficulty,
    xp_reward,
    submission_status,
    submitted_at,
    runtime_ms,
    memory_kb,
    solved,
    can_view_code,
    case when can_view_code then submission_source_code else null end as source_code
  from visible_submissions
  order by submitted_at desc nulls last, submission_id desc nulls last
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
end;
$$;

revoke all on function public.get_public_user_submissions(uuid, integer, integer) from public;
grant execute on function public.get_public_user_submissions(uuid, integer, integer) to authenticated;
