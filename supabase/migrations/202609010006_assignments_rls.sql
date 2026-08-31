-- Assignments are managed by the teacher who owns their classroom.
-- Students can only read published assignments in classrooms they joined.
alter table public.assignments enable row level security;
alter table public.assignment_problems enable row level security;

drop policy if exists assignments_select_classroom_participants on public.assignments;
drop policy if exists assignments_insert_classroom_owner on public.assignments;
drop policy if exists assignments_update_classroom_owner on public.assignments;
drop policy if exists assignments_delete_classroom_owner on public.assignments;
drop policy if exists assignment_problems_select_visible_assignments on public.assignment_problems;
drop policy if exists assignment_problems_insert_classroom_owner on public.assignment_problems;
drop policy if exists assignment_problems_update_classroom_owner on public.assignment_problems;
drop policy if exists assignment_problems_delete_classroom_owner on public.assignment_problems;

create policy assignments_select_classroom_participants
on public.assignments
for select
to authenticated
using (
  public.is_classroom_owner(classroom_id)
  or (published and public.is_classroom_member(classroom_id))
);

create policy assignments_insert_classroom_owner
on public.assignments
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_classroom_owner(classroom_id)
);

create policy assignments_update_classroom_owner
on public.assignments
for update
to authenticated
using (public.is_classroom_owner(classroom_id))
with check (
  created_by = auth.uid()
  and public.is_classroom_owner(classroom_id)
);

create policy assignments_delete_classroom_owner
on public.assignments
for delete
to authenticated
using (public.is_classroom_owner(classroom_id));

create policy assignment_problems_select_visible_assignments
on public.assignment_problems
for select
to authenticated
using (
  exists (
    select 1
    from public.assignments a
    where a.id = assignment_id
      and (
        public.is_classroom_owner(a.classroom_id)
        or (a.published and public.is_classroom_member(a.classroom_id))
      )
  )
);

create policy assignment_problems_insert_classroom_owner
on public.assignment_problems
for insert
to authenticated
with check (
  exists (
    select 1
    from public.assignments a
    where a.id = assignment_id
      and public.is_classroom_owner(a.classroom_id)
  )
);

create policy assignment_problems_update_classroom_owner
on public.assignment_problems
for update
to authenticated
using (
  exists (
    select 1
    from public.assignments a
    where a.id = assignment_id
      and public.is_classroom_owner(a.classroom_id)
  )
)
with check (
  exists (
    select 1
    from public.assignments a
    where a.id = assignment_id
      and public.is_classroom_owner(a.classroom_id)
  )
);

create policy assignment_problems_delete_classroom_owner
on public.assignment_problems
for delete
to authenticated
using (
  exists (
    select 1
    from public.assignments a
    where a.id = assignment_id
      and public.is_classroom_owner(a.classroom_id)
  )
);

revoke all on table public.assignments from anon;
revoke all on table public.assignment_problems from anon;
grant select, insert, update, delete on table public.assignments to authenticated;
grant select, insert, update, delete on table public.assignment_problems to authenticated;
