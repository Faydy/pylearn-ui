-- The selected DiceBear seed must be public so every UI can render the same avatar.
alter table public.profiles
  add column if not exists avatar varchar(32);

-- Preserve the avatar selected by existing users before the frontend starts
-- reading it from profiles for public views such as scoreboards and classes.
update public.profiles p
set avatar = u.raw_user_meta_data ->> 'avatar'
from auth.users u
where u.id = p.id
  and p.avatar is null
  and u.raw_user_meta_data ->> 'avatar' in ('Ada', 'Felix', 'Nova', 'Milo', 'Sofia', 'Theo');

alter table public.profiles
  drop constraint if exists profiles_avatar_check;

alter table public.profiles
  add constraint profiles_avatar_check
  check (avatar is null or avatar in ('Ada', 'Felix', 'Nova', 'Milo', 'Sofia', 'Theo')) not valid;

-- The previous function returned four columns. PostgreSQL requires a drop
-- before adding the public avatar field to its declared return structure.
drop function if exists public.get_classroom_members(bigint);

create function public.get_classroom_members(p_classroom_id bigint)
returns table (
  student_id uuid,
  username text,
  avatar text,
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
    p.avatar::text,
    coalesce(p.total_xp::integer, 0)::integer,
    cm.joined_at::timestamptz
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  where cm.classroom_id = p_classroom_id
  order by lower(p.username), cm.joined_at;
end;
$$;

grant execute on function public.get_classroom_members(bigint) to authenticated;
