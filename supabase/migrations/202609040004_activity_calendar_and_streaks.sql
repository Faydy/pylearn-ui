-- Derive activity from accepted submissions in Bucharest time. This keeps the
-- dashboard and profiles correct even when the database session uses UTC.
create or replace function public.calculate_pylearn_current_streak(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_streak integer;
begin
  with recursive active_days as (
    select distinct (s.submitted_at at time zone 'Europe/Bucharest')::date as activity_day
    from public.submissions s
    where s.user_id = p_user_id
      and lower(coalesce(s.status, '')) = 'accepted'
  ), streak_days(activity_day) as (
    select max(activity_day)
    from active_days
    where activity_day >= v_today - 1

    union all

    select streak_days.activity_day - 1
    from streak_days
    where streak_days.activity_day is not null
      and exists (
        select 1
        from active_days
        where activity_day = streak_days.activity_day - 1
      )
  )
  select count(activity_day)::integer
  into v_streak
  from streak_days;

  return coalesce(v_streak, 0);
end;
$$;

create or replace function public.get_own_activity_summary()
returns table (
  total_xp integer,
  current_streak integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea activitatea.';
  end if;

  return query
  select
    coalesce(p.total_xp::integer, 0)::integer,
    public.calculate_pylearn_current_streak(auth.uid())::integer
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

-- Keep the public profile function's existing result shape while returning a
-- live streak rather than a stale counter stored in profiles.
create or replace function public.get_public_profile(p_profile_id uuid)
returns table (
  id uuid,
  username text,
  avatar text,
  role text,
  grade_id bigint,
  grade_name text,
  total_xp integer,
  current_streak integer,
  longest_streak integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea un profil.';
  end if;

  return query
  select
    p.id::uuid,
    p.username::text,
    p.avatar::text,
    p.role::text,
    p.grade_id::bigint,
    g.name::text,
    coalesce(p.total_xp::integer, 0)::integer,
    public.calculate_pylearn_current_streak(p.id)::integer,
    coalesce(p.longest_streak::integer, 0)::integer,
    p.created_at::timestamptz
  from public.profiles p
  left join public.grades g on g.id = p.grade_id
  where p.id = p_profile_id;
end;
$$;

revoke all on function public.calculate_pylearn_current_streak(uuid) from public;
revoke all on function public.get_own_activity_summary() from public;
revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_own_activity_summary() to authenticated;
grant execute on function public.get_public_profile(uuid) to authenticated;
