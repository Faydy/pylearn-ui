-- Existing deployments can have legacy numeric or timestamp column variants.
-- Cast every returned value to the declared RPC shape to avoid PostgreSQL's
-- "structure of query does not match function result type" error.
create or replace function public.get_classroom_members(p_classroom_id bigint)
returns table (
  student_id uuid,
  username text,
  total_xp integer,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_classroom_owner(p_classroom_id) then
    raise exception 'Nu ai permisiunea să vezi elevii acestei clase.';
  end if;

  return query
  select
    cm.student_id::uuid,
    p.username::text,
    coalesce(p.total_xp::integer, 0)::integer,
    cm.joined_at::timestamptz
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  where cm.classroom_id = p_classroom_id
  order by lower(p.username), cm.joined_at;
end;
$$;

grant execute on function public.get_classroom_members(bigint) to authenticated;
