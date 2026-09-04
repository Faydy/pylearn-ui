-- A finalized assignment stays visible, but no longer accepts submissions for
-- its problems from enrolled students. The timestamp is maintained in Postgres
-- so it cannot be forged by the browser.
alter table public.assignments
  add column if not exists is_finalized boolean not null default false;

alter table public.assignments
  add column if not exists finalized_at timestamptz;

create index if not exists assignment_problems_problem_assignment_idx
  on public.assignment_problems (problem_id, assignment_id);

create index if not exists assignments_finalized_classroom_idx
  on public.assignments (classroom_id, finalized_at desc)
  where is_finalized = true;

create or replace function public.enforce_assignment_finalization()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.finalized_at := case when new.is_finalized then now() else null end;
    return new;
  end if;

  if old.is_finalized and not new.is_finalized then
    raise exception 'O temă finalizată nu poate fi redeschisă.';
  end if;

  if new.is_finalized and not old.is_finalized then
    new.finalized_at := now();
  elsif new.is_finalized then
    new.finalized_at := old.finalized_at;
  else
    new.finalized_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists assignments_enforce_finalization on public.assignments;
create trigger assignments_enforce_finalization
before insert or update on public.assignments
for each row
execute function public.enforce_assignment_finalization();

-- The browser learns only whether the authenticated student is prevented from
-- submitting a particular problem. It never receives class member data.
create or replace function public.get_finalized_assignment_for_problem(
  p_problem_id integer
)
returns table (
  assignment_id bigint,
  assignment_title text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in ('elev', 'student')
  ) then
    return;
  end if;

  return query
  select
    a.id,
    a.title::text
  from public.assignments a
  join public.assignment_problems ap on ap.assignment_id = a.id
  join public.classroom_members cm
    on cm.classroom_id = a.classroom_id
    and cm.student_id = auth.uid()
  where ap.problem_id = p_problem_id
    and a.published = true
    and a.is_finalized = true
  order by a.finalized_at desc nulls last, a.id desc
  limit 1;
end;
$$;

revoke all on function public.get_finalized_assignment_for_problem(integer) from public;
grant execute on function public.get_finalized_assignment_for_problem(integer) to authenticated;

-- Submission recording is an internal Worker operation. Revoking every
-- existing overload prevents a browser client from bypassing /submit.
do $$
declare
  function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_problem_submission'
  loop
    execute format('revoke all on function %s from public', function_signature);
    execute format('revoke all on function %s from anon', function_signature);
    execute format('revoke all on function %s from authenticated', function_signature);
    execute format('grant execute on function %s to service_role', function_signature);
  end loop;
end;
$$;
