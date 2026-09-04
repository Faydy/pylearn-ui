-- Preserve the existing progress RPC signature and expose deadline information
-- through a separate teacher-only RPC. A late submission is any submission for
-- a problem in the assignment created after the assignment deadline.
create or replace function public.get_assignment_student_progress_with_deadline(
  p_assignment_id bigint
)
returns table (
  student_id uuid,
  username text,
  avatar text,
  solved_count integer,
  total_count integer,
  progress_percentage integer,
  submitted_after_deadline boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom_id bigint;
  v_due_at timestamptz;
  v_total_count integer;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea progresul elevilor.';
  end if;

  select a.classroom_id, a.due_at
  into v_classroom_id, v_due_at
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
  with assignment_problem_ids as (
    select ap.problem_id
    from public.assignment_problems ap
    where ap.assignment_id = p_assignment_id
  ),
  solved_by_student as (
    select
      ups.user_id::uuid as solved_student_id,
      count(distinct ups.problem_id)::integer as solved_problem_count
    from public.user_problem_status ups
    join assignment_problem_ids ap on ap.problem_id = ups.problem_id
    join public.classroom_members cm
      on cm.classroom_id = v_classroom_id
      and cm.student_id = ups.user_id
    where ups.solved = true
    group by ups.user_id
  ),
  late_by_student as (
    select
      s.user_id::uuid as late_student_id,
      true as has_late_submission
    from public.submissions s
    join assignment_problem_ids ap on ap.problem_id = s.problem_id
    join public.classroom_members cm
      on cm.classroom_id = v_classroom_id
      and cm.student_id = s.user_id
    where v_due_at is not null
      and nullif(to_jsonb(s) ->> 'submitted_at', '')::timestamptz > v_due_at
    group by s.user_id
  )
  select
    cm.student_id::uuid,
    p.username::text,
    p.avatar::text,
    coalesce(solved_by_student.solved_problem_count, 0)::integer,
    v_total_count::integer,
    case
      when v_total_count = 0 then 0
      else round(coalesce(solved_by_student.solved_problem_count, 0)::numeric * 100 / v_total_count)::integer
    end as progress_percentage,
    coalesce(late_by_student.has_late_submission, false)
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  left join solved_by_student on solved_by_student.solved_student_id = cm.student_id
  left join late_by_student on late_by_student.late_student_id = cm.student_id
  where cm.classroom_id = v_classroom_id
    and lower(coalesce(p.role, '')) in ('elev', 'student')
  order by lower(p.username), cm.student_id;
end;
$$;

revoke all on function public.get_assignment_student_progress_with_deadline(bigint) from public;
grant execute on function public.get_assignment_student_progress_with_deadline(bigint) to authenticated;
