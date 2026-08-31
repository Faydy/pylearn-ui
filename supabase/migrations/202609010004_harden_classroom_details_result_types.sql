-- Existing deployments may have integer or timestamp variants of these columns.
-- Explicit casts keep the RPC result aligned with its declared PostgREST return shape.
create or replace function public.get_classroom_details(p_classroom_id bigint)
returns table (
  id bigint,
  name text,
  description text,
  teacher_id uuid,
  teacher_username text,
  join_code text,
  created_at timestamptz,
  archived boolean,
  student_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea clasa.';
  end if;

  if not public.is_classroom_owner(p_classroom_id)
    and not public.is_classroom_member(p_classroom_id) then
    raise exception 'Nu ai acces la această clasă.';
  end if;

  return query
  select
    c.id::bigint,
    c.name::text,
    c.description::text,
    c.teacher_id::uuid,
    p.username::text,
    c.join_code::text,
    c.created_at::timestamptz,
    c.archived,
    count(cm.student_id)::bigint
  from public.classrooms c
  join public.profiles p on p.id = c.teacher_id
  left join public.classroom_members cm on cm.classroom_id = c.id
  where c.id = p_classroom_id
  group by c.id, p.username;
end;
$$;

grant execute on function public.get_classroom_details(bigint) to authenticated;
