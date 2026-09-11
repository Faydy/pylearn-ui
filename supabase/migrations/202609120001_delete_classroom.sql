begin;

-- Keep table deletion unavailable to clients. Ownership is established exclusively
-- from the authenticated JWT, never from a caller-supplied teacher or role.
revoke delete on public.classrooms from public, anon, authenticated;

create or replace function public.delete_classroom(
  p_classroom_id bigint,
  p_confirmation_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a șterge clasa.';
  end if;

  -- Lock before confirming the name: renames and concurrent deletions cannot
  -- change the target between authorization, confirmation and deletion.
  select c.name::text into v_name
  from public.classrooms c
  where c.id = p_classroom_id and c.teacher_id = auth.uid()
  for update;

  if not found then
    raise exception 'Clasa nu există sau nu ai permisiunea să o ștergi.';
  end if;
  if p_confirmation_name is distinct from v_name then
    raise exception 'Numele introdus nu corespunde numelui clasei. Reîncarcă pagina dacă numele s-a schimbat.';
  end if;

  -- Existing deployments predate the repository's migrations and may use
  -- restrictive rather than cascading FKs. Delete known children explicitly.
  -- Parent locks also block new FK references while their children are removed.
  perform a.id from public.assignments a
  where a.classroom_id = p_classroom_id order by a.id for update;

  delete from public.notifications n
  where n.classroom_id = p_classroom_id
     or n.assignment_id in (select a.id from public.assignments a where a.classroom_id = p_classroom_id);
  delete from public.assignment_problems ap
  using public.assignments a
  where ap.assignment_id = a.id and a.classroom_id = p_classroom_id;
  delete from public.assignments where classroom_id = p_classroom_id;
  delete from public.classroom_announcements where classroom_id = p_classroom_id;
  delete from public.classroom_members where classroom_id = p_classroom_id;
  delete from public.classrooms where id = p_classroom_id and teacher_id = auth.uid();

  -- Problems, profiles, global submissions and earned progress are not owned
  -- by a classroom and must not be deleted. Other FKs retain their own actions.
exception when foreign_key_violation then
  -- This exception block rolls back every preceding deletion, not just the
  -- failing statement. Do not expose table names, constraint names or row data.
  raise exception 'Clasa nu poate fi ștearsă deoarece există date asociate care împiedică ștergerea.';
end;
$$;

revoke all on function public.delete_classroom(bigint, text) from public, anon;
grant execute on function public.delete_classroom(bigint, text) to authenticated;

commit;
