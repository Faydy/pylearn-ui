-- Public profile activity is returned only as a monthly aggregate. This keeps
-- activity_log private while exposing the minimum data required by the profile
-- calendar: a date and its solved-problem count.
create or replace function public.get_public_user_activity_month(
  p_profile_user_id uuid,
  p_year integer,
  p_month integer
)
returns table (
  activity_date date,
  problems_solved_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month_start date;
  v_month_end date;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea activitatea unui utilizator.';
  end if;

  if p_month is null or p_month not between 1 and 12 then
    raise exception 'Luna selectată nu este validă.';
  end if;

  if p_year is null or p_year not between 2000 and extract(year from current_date)::integer then
    raise exception 'Anul selectat nu este valid.';
  end if;

  if not exists (select 1 from public.profiles where id = p_profile_user_id) then
    raise exception 'Utilizatorul nu a fost găsit.';
  end if;

  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + interval '1 month')::date;

  return query
  select
    activity.activity_date::date,
    coalesce(activity.problems_solved_count, 0)::integer
  from public.activity_log activity
  where activity.user_id = p_profile_user_id
    and activity.activity_date >= v_month_start
    and activity.activity_date < v_month_end
    and coalesce(activity.problems_solved_count, 0) > 0
  order by activity.activity_date;
end;
$$;

revoke all on function public.get_public_user_activity_month(uuid, integer, integer) from public;
grant execute on function public.get_public_user_activity_month(uuid, integer, integer) to authenticated;
