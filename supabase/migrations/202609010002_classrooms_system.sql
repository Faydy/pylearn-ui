-- Extends the existing classroom tables used by assignments. No replacement tables are created.
alter table public.classrooms
  add column if not exists description text,
  add column if not exists join_code varchar(6),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists archived boolean not null default false;

alter table public.classroom_members
  add column if not exists joined_at timestamptz not null default now();

create or replace function public.generate_classroom_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt integer := 0;
  v_index integer;
begin
  loop
    v_attempt := v_attempt + 1;
    v_code := '';

    for v_index in 1..6 loop
      v_code := v_code || substr(
        v_alphabet,
        floor(random() * length(v_alphabet) + 1)::integer,
        1
      );
    end loop;

    if not exists (
      select 1 from public.classrooms where join_code = v_code
    ) then
      return v_code;
    end if;

    if v_attempt >= 50 then
      raise exception 'Nu s-a putut genera un cod unic pentru clasă.';
    end if;
  end loop;
end;
$$;

-- Existing rows without a valid code receive one before the unique constraint is created.
do $$
declare
  v_classroom record;
begin
  for v_classroom in
    select c.id
    from public.classrooms c
    where c.join_code is null
      or c.join_code !~ '^[A-HJ-NP-Z2-9]{6}$'
      or c.id in (
        select duplicate_codes.id
        from (
          select id, row_number() over (partition by join_code order by id) as row_number
          from public.classrooms
          where join_code is not null
        ) duplicate_codes
        where duplicate_codes.row_number > 1
      )
  loop
    update public.classrooms
    set join_code = public.generate_classroom_code()
    where id = v_classroom.id;
  end loop;
end;
$$;

alter table public.classrooms
  alter column join_code set not null;

alter table public.classrooms
  drop constraint if exists classrooms_join_code_format_check;

alter table public.classrooms
  add constraint classrooms_join_code_format_check
  check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$') not valid;

create unique index if not exists classrooms_join_code_unique_idx
  on public.classrooms (join_code);

create unique index if not exists classroom_members_classroom_student_unique_idx
  on public.classroom_members (classroom_id, student_id);

create index if not exists classrooms_teacher_id_idx
  on public.classrooms (teacher_id);

create index if not exists classroom_members_student_id_idx
  on public.classroom_members (student_id);

create or replace function public.is_classroom_owner(p_classroom_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classrooms c
    where c.id = p_classroom_id
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_classroom_member(p_classroom_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classroom_members cm
    where cm.classroom_id = p_classroom_id
      and cm.student_id = auth.uid()
  );
$$;

create or replace function public.create_classroom(
  p_name text,
  p_description text default null
)
returns setof public.classrooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_classroom public.classrooms%rowtype;
  v_code text;
  v_attempt integer;
begin
  if v_user_id is null then
    raise exception 'Trebuie să fii autentificat pentru a crea o clasă.';
  end if;

  select role into v_role
  from public.profiles
  where id = v_user_id;

  if coalesce(v_role, '') not in ('profesor', 'teacher') then
    raise exception 'Nu ai permisiunea să creezi clase.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Numele clasei este obligatoriu.';
  end if;

  if length(trim(p_name)) > 120 then
    raise exception 'Numele clasei poate avea cel mult 120 de caractere.';
  end if;

  if p_description is not null and length(trim(p_description)) > 3000 then
    raise exception 'Descrierea poate avea cel mult 3000 de caractere.';
  end if;

  for v_attempt in 1..20 loop
    v_code := public.generate_classroom_code();

    begin
      insert into public.classrooms (name, description, teacher_id, join_code)
      values (
        trim(p_name),
        nullif(trim(p_description), ''),
        v_user_id,
        v_code
      )
      returning * into v_classroom;

      return next v_classroom;
      return;
    exception
      when unique_violation then
        if v_attempt = 20 then
          raise exception 'Nu s-a putut genera un cod unic pentru clasă.';
        end if;
    end;
  end loop;
end;
$$;

create or replace function public.join_classroom_by_code(p_code text)
returns setof public.classrooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_classroom public.classrooms%rowtype;
begin
  if v_user_id is null then
    raise exception 'Trebuie să fii autentificat pentru a intra într-o clasă.';
  end if;

  if v_code !~ '^[A-HJ-NP-Z2-9]{6}$' then
    raise exception 'Codul introdus nu este valid.';
  end if;

  select role into v_role
  from public.profiles
  where id = v_user_id;

  if coalesce(v_role, '') not in ('elev', 'student') then
    raise exception 'Nu ai permisiunea să intri în această clasă.';
  end if;

  select * into v_classroom
  from public.classrooms
  where join_code = v_code;

  if not found then
    raise exception 'Nu există nicio clasă cu acest cod.';
  end if;

  if v_classroom.archived then
    raise exception 'Această clasă este arhivată.';
  end if;

  if exists (
    select 1
    from public.classroom_members
    where classroom_id = v_classroom.id
      and student_id = v_user_id
  ) then
    raise exception 'Ești deja membru al acestei clase.';
  end if;

  begin
    insert into public.classroom_members (classroom_id, student_id)
    values (v_classroom.id, v_user_id);
  exception
    when unique_violation then
      raise exception 'Ești deja membru al acestei clase.';
  end;

  return next v_classroom;
  return;
end;
$$;

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
    cm.student_id,
    p.username::text,
    coalesce(p.total_xp, 0),
    cm.joined_at
  from public.classroom_members cm
  join public.profiles p on p.id = cm.student_id
  where cm.classroom_id = p_classroom_id
  order by lower(p.username), cm.joined_at;
end;
$$;

create or replace function public.update_classroom_details(
  p_classroom_id bigint,
  p_name text,
  p_description text,
  p_archived boolean
)
returns setof public.classrooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom public.classrooms%rowtype;
begin
  if not public.is_classroom_owner(p_classroom_id) then
    raise exception 'Nu ai permisiunea să modifici această clasă.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Numele clasei este obligatoriu.';
  end if;

  if length(trim(p_name)) > 120 then
    raise exception 'Numele clasei poate avea cel mult 120 de caractere.';
  end if;

  if p_description is not null and length(trim(p_description)) > 3000 then
    raise exception 'Descrierea poate avea cel mult 3000 de caractere.';
  end if;

  update public.classrooms
  set
    name = trim(p_name),
    description = nullif(trim(p_description), ''),
    archived = coalesce(p_archived, false)
  where id = p_classroom_id
  returning * into v_classroom;

  return next v_classroom;
  return;
end;
$$;

create or replace function public.regenerate_classroom_code(p_classroom_id bigint)
returns setof public.classrooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom public.classrooms%rowtype;
  v_code text;
  v_attempt integer;
begin
  if not public.is_classroom_owner(p_classroom_id) then
    raise exception 'Nu ai permisiunea să generezi un cod nou.';
  end if;

  for v_attempt in 1..20 loop
    v_code := public.generate_classroom_code();

    begin
      update public.classrooms
      set join_code = v_code
      where id = p_classroom_id
      returning * into v_classroom;

      return next v_classroom;
      return;
    exception
      when unique_violation then
        if v_attempt = 20 then
          raise exception 'Nu s-a putut genera un cod unic pentru clasă.';
        end if;
    end;
  end loop;
end;
$$;

create or replace function public.leave_classroom(p_classroom_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a părăsi o clasă.';
  end if;

  if public.is_classroom_owner(p_classroom_id) then
    raise exception 'Profesorul nu poate părăsi propria clasă.';
  end if;

  delete from public.classroom_members
  where classroom_id = p_classroom_id
    and student_id = auth.uid();

  if not found then
    raise exception 'Nu faci parte din această clasă.';
  end if;
end;
$$;

alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.classroom_announcements enable row level security;

-- Replace policy definitions for the classroom tables so prior permissive rules cannot bypass codes.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('classrooms', 'classroom_members', 'classroom_announcements')
  loop
    execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_policy.tablename);
  end loop;
end;
$$;

create policy classrooms_select_authorized
on public.classrooms
for select
to authenticated
using (
  teacher_id = auth.uid()
  or public.is_classroom_member(id)
);

create policy classroom_members_select_authorized
on public.classroom_members
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_classroom_owner(classroom_id)
);

create policy classroom_members_delete_own
on public.classroom_members
for delete
to authenticated
using (student_id = auth.uid());

create policy classroom_announcements_select_authorized
on public.classroom_announcements
for select
to authenticated
using (
  public.is_classroom_owner(classroom_id)
  or public.is_classroom_member(classroom_id)
);

revoke all on table public.classrooms from anon;
revoke all on table public.classroom_members from anon;
revoke all on table public.classroom_announcements from anon;
revoke insert, update, delete on table public.classrooms from authenticated;
revoke insert, update on table public.classroom_members from authenticated;
revoke insert, update, delete on table public.classroom_announcements from authenticated;
grant select on table public.classrooms to authenticated;
grant select on table public.classroom_members to authenticated;
grant select on table public.classroom_announcements to authenticated;
grant execute on function public.create_classroom(text, text) to authenticated;
grant execute on function public.join_classroom_by_code(text) to authenticated;
grant execute on function public.get_classroom_details(bigint) to authenticated;
grant execute on function public.get_classroom_members(bigint) to authenticated;
grant execute on function public.update_classroom_details(bigint, text, text, boolean) to authenticated;
grant execute on function public.regenerate_classroom_code(bigint) to authenticated;
grant execute on function public.leave_classroom(bigint) to authenticated;
revoke all on function public.generate_classroom_code() from public;
revoke all on function public.is_classroom_owner(bigint) from public;
revoke all on function public.is_classroom_member(bigint) from public;
grant execute on function public.is_classroom_owner(bigint) to authenticated;
grant execute on function public.is_classroom_member(bigint) to authenticated;
