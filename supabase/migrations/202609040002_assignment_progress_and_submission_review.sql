-- Assignment progress remains derived from user_problem_status. These RPCs
-- expose only the aggregates and accepted code a classroom owner is allowed
-- to inspect, without broadening direct access to submissions.
create or replace function public.get_assignment_student_progress(p_assignment_id bigint)
returns table (
  student_id uuid,
  username text,
  avatar text,
  solved_count integer,
  total_count integer,
  progress_percentage integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_id bigint;
  v_total_count integer;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea progresul elevilor.';
  end if;

  select a.classroom_id
  into v_classroom_id
  from public.assignments a
  join public.classrooms c on c.id = a.classroom_id
  where a.id = p_assignment_id
    and c.teacher_id = auth.uid();

  if not found then
    raise exception 'Nu ai permisiunea să vezi progresul acestei teme.';
  end if;

  select count(*)::integer
  into v_total_count
  from public.assignment_problems ap
  where ap.assignment_id = p_assignment_id;

  return query
  with solved_by_student as (
    select
      ups.user_id::uuid as student_id,
      count(distinct ups.problem_id)::integer as solved_count
    from public.user_problem_status ups
    join public.assignment_problems ap
      on ap.assignment_id = p_assignment_id
      and ap.problem_id = ups.problem_id
    join public.classroom_members cm
      on cm.classroom_id = v_classroom_id
      and cm.student_id = ups.user_id
    where ups.solved = true
    group by ups.user_id
  )
  select
    cm.student_id::uuid,
    p.username::text,
    p.avatar::text,
    coalesce(solved_by_student.solved_count, 0)::integer,
    v_total_count::integer,
    case
      when v_total_count = 0 then 0
      else round(coalesce(solved_by_student.solved_count, 0)::numeric * 100 / v_total_count)::integer
    end as progress_percentage
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  left join solved_by_student on solved_by_student.student_id = cm.student_id
  where cm.classroom_id = v_classroom_id
    and lower(coalesce(p.role, '')) in ('elev', 'student')
  order by lower(p.username), cm.student_id;
end;
$$;

-- PostgreSQL cannot replace a function when its OUT-column signature changes.
-- This drops only the RPC definition; assignment and submission data remain intact.
drop function if exists public.get_assignment_student_details(bigint, uuid);

create function public.get_assignment_student_details(
  p_assignment_id bigint,
  p_student_id uuid
)
returns table (
  student_id uuid,
  student_username text,
  student_avatar text,
  assignment_id bigint,
  assignment_title text,
  classroom_id bigint,
  due_at timestamptz,
  problem_id integer,
  problem_position integer,
  problem_title text,
  problem_difficulty text,
  problem_xp_reward integer,
  solved boolean,
  solved_at timestamp,
  submission_id bigint,
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
declare
  v_classroom_id bigint;
  v_assignment_title text;
  v_due_at timestamptz;
  v_student_username text;
  v_student_avatar text;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea soluțiile elevilor.';
  end if;

  select a.classroom_id, a.title::text, a.due_at
  into v_classroom_id, v_assignment_title, v_due_at
  from public.assignments a
  join public.classrooms c on c.id = a.classroom_id
  where a.id = p_assignment_id
    and c.teacher_id = auth.uid();

  if not found then
    raise exception 'Nu ai permisiunea să vezi soluțiile acestei teme.';
  end if;

  select p.username::text, p.avatar::text
  into v_student_username, v_student_avatar
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  where cm.classroom_id = v_classroom_id
    and cm.student_id = p_student_id
    and lower(coalesce(p.role, '')) in ('elev', 'student');

  if not found then
    raise exception 'Elevul nu face parte din această clasă.';
  end if;

  return query
  select
    p_student_id,
    v_student_username,
    v_student_avatar,
    p_assignment_id,
    v_assignment_title,
    v_classroom_id,
    v_due_at,
    ap.problem_id::integer,
    ap.position::integer,
    problem.title::text,
    problem.difficulty::text,
    coalesce(problem.xp_reward, 0)::integer,
    coalesce(status_row.solved, false),
    status_row.solved_at::timestamp,
    accepted_submission.submission_id,
    accepted_submission.submission_status,
    accepted_submission.submitted_at,
    accepted_submission.source_code,
    accepted_submission.runtime_ms,
    accepted_submission.memory_kb
  from public.assignment_problems ap
  join public.problems problem on problem.id = ap.problem_id
  left join lateral (
    select
      bool_or(coalesce(ups.solved, false)) as solved,
      max(ups.solved_at) filter (where ups.solved) as solved_at
    from public.user_problem_status ups
    where ups.user_id = p_student_id
      and ups.problem_id = ap.problem_id
  ) status_row on true
  left join lateral (
    select
      nullif(to_jsonb(s) ->> 'id', '')::bigint as submission_id,
      to_jsonb(s) ->> 'status' as submission_status,
      nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz as submitted_at,
      coalesce(nullif(to_jsonb(s) ->> 'code', ''), nullif(to_jsonb(s) ->> 'source_code', '')) as source_code,
      nullif(to_jsonb(s) ->> 'runtime_ms', '')::integer as runtime_ms,
      nullif(to_jsonb(s) ->> 'memory_kb', '')::integer as memory_kb
    from public.submissions s
    where s.user_id = p_student_id
      and s.problem_id = ap.problem_id
      and lower(coalesce(to_jsonb(s) ->> 'status', '')) = 'accepted'
    order by
      nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz desc nulls last,
      nullif(to_jsonb(s) ->> 'id', '')::bigint desc nulls last
    limit 1
  ) accepted_submission on true
  where ap.assignment_id = p_assignment_id
  order by ap.position, ap.problem_id;
end;
$$;

revoke all on function public.get_assignment_student_progress(bigint) from public;
revoke all on function public.get_assignment_student_details(bigint, uuid) from public;
grant execute on function public.get_assignment_student_progress(bigint) to authenticated;
grant execute on function public.get_assignment_student_details(bigint, uuid) to authenticated;

-- Teachers receive only status events that concern students and problems from
-- their own assignments. The UI still gets its displayed data from the RPCs.
alter table public.user_problem_status enable row level security;

drop policy if exists user_problem_status_select_teacher_assignment_progress on public.user_problem_status;
create policy user_problem_status_select_teacher_assignment_progress
on public.user_problem_status
for select
to authenticated
using (
  exists (
    select 1
    from public.assignments a
    join public.assignment_problems ap on ap.assignment_id = a.id
    join public.classrooms c on c.id = a.classroom_id
    join public.classroom_members cm on cm.classroom_id = a.classroom_id
    join public.profiles p on p.id = cm.student_id
    where c.teacher_id = auth.uid()
      and cm.student_id = user_problem_status.user_id
      and ap.problem_id = user_problem_status.problem_id
      and lower(coalesce(p.role, '')) in ('elev', 'student')
  )
);

-- A professor may have an accidental classroom_members row, but assignment
-- notifications belong exclusively to student-role members.
create or replace function public.notify_classroom_members_about_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_name text;
begin
  if not new.published then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.published is not distinct from new.published then
    return new;
  end if;

  select name::text
  into v_classroom_name
  from public.classrooms
  where id = new.classroom_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    classroom_id,
    assignment_id
  )
  select
    cm.student_id,
    'new_assignment',
    'Temă nouă',
    format(
      'Ai primit o temă nouă la clasa %s: „%s”.',
      coalesce(v_classroom_name, 'ta'),
      new.title
    ),
    '/teme/' || new.id,
    new.classroom_id,
    new.id
  from public.classroom_members cm
  join public.classrooms c on c.id = cm.classroom_id
  join public.profiles recipient on recipient.id = cm.student_id
  where cm.classroom_id = new.classroom_id
    and cm.student_id is distinct from c.teacher_id
    and lower(coalesce(recipient.role, '')) in ('elev', 'student')
  on conflict (user_id, assignment_id, type) where assignment_id is not null do nothing;

  return new;
end;
$$;

-- Realtime receives only assignment-problem filters in the client. Keep this
-- idempotent because a project may already publish the status table.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_problem_status'
    ) then
    alter publication supabase_realtime add table public.user_problem_status;
  end if;
end;
$$;

-- Optional one-time cleanup for notifications created by the previous trigger.
-- Review first, then run manually only if those historical rows should go away:
-- delete from public.notifications n
-- using public.assignments a, public.classrooms c
-- where n.type = 'new_assignment'
--   and n.assignment_id = a.id
--   and a.classroom_id = c.id
--   and n.user_id = c.teacher_id;
