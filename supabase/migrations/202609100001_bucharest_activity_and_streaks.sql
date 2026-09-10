-- Authoritative activity = first accepted solves on Europe/Bucharest dates.
-- Based on the current production function/schema export (2026-09-10).
-- Apply as one transaction. Historical naive timestamps require the separate
-- guarded repair in manual/repair_bucharest_activity.sql; never shift all dates.
begin;

-- Fail before changing anything if the inspected production schema has drifted.
do $$
begin
  if to_regprocedure('public.record_problem_submission(uuid,integer,text,character varying,integer,integer,date)') is null
    or (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'record_problem_submission') <> 1 then
    raise exception 'Inspect the current record_problem_submission overloads before applying this migration.';
  end if;
  if (select atttypid from pg_attribute where attrelid = 'public.user_problem_status'::regclass
      and attname = 'solved_at' and not attisdropped) is distinct from 'timestamp without time zone'::regtype
    or (select atttypid from pg_attribute where attrelid = 'public.submissions'::regclass
      and attname = 'submitted_at' and not attisdropped) is distinct from 'timestamp without time zone'::regtype then
    raise exception 'Timestamp types differ from the inspected schema; review explicit UTC timestamp storage first.';
  end if;
end;
$$;

create or replace function public.record_problem_submission(
  p_user_id uuid,
  p_problem_id integer,
  p_code text,
  p_status varchar,
  p_runtime_ms integer default null,
  p_memory_kb integer default null,
  p_activity_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_solved boolean := false;
  v_first_solve boolean := false;
  v_xp_reward integer := 0;
  v_category_id integer;
  v_total_problems integer := 0;
  v_solved_problems integer := 0;
  v_progress_percent integer := 0;
  v_total_xp integer := 0;
  v_last_active_date date;
  v_current_streak integer := 0;
  v_new_streak integer := 0;
  v_recorded_at timestamptz;
  v_activity_date date;
begin
  select xp_reward, category_id
  into v_xp_reward, v_category_id
  from public.problems
  where id = p_problem_id;

  if not found then
    raise exception 'Problema nu există.';
  end if;

  -- Serialize ALL solves for one user, including different problems. Taking
  -- this lock before status/category reads also prevents lost streak updates.
  select last_active_date, coalesce(current_streak, 0)
  into v_last_active_date, v_current_streak
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profilul nu există.';
  end if;

  -- One trusted instant, captured after the lock (even when waiting crosses
  -- midnight). p_activity_date is deprecated and deliberately NEVER read.
  v_recorded_at := clock_timestamp();
  v_activity_date := (v_recorded_at at time zone 'Europe/Bucharest')::date;

  -- These legacy columns are timestamp WITHOUT time zone. Store UTC explicitly
  -- so future timestamps are unambiguous regardless of the caller's session.
  insert into public.submissions (
    user_id, problem_id, code, status, runtime_ms, memory_kb, submitted_at
  ) values (
    p_user_id, p_problem_id, p_code, p_status, p_runtime_ms, p_memory_kb,
    v_recorded_at at time zone 'UTC'
  );

  insert into public.user_problem_status (user_id, problem_id, solved, attempts_count)
  values (p_user_id, p_problem_id, false, 0)
  on conflict (user_id, problem_id) do nothing;

  select coalesce(solved, false)
  into v_was_solved
  from public.user_problem_status
  where user_id = p_user_id and problem_id = p_problem_id
  for update;

  update public.user_problem_status
  set attempts_count = coalesce(attempts_count, 0) + 1,
      solved = case when p_status = 'accepted' then true else solved end,
      solved_at = case
        when p_status = 'accepted' and not v_was_solved
          then v_recorded_at at time zone 'UTC'
        else solved_at
      end
  where user_id = p_user_id and problem_id = p_problem_id;

  if p_status = 'accepted' and not v_was_solved then
    v_first_solve := true;

    insert into public.activity_log (user_id, activity_date, problems_solved_count)
    values (p_user_id, v_activity_date, 1)
    on conflict (user_id, activity_date) do update
    set problems_solved_count = coalesce(public.activity_log.problems_solved_count, 0) + 1;

    if v_last_active_date is null then
      v_new_streak := 1;
    elsif v_last_active_date = v_activity_date then
      v_new_streak := v_current_streak;
    elsif v_last_active_date = v_activity_date - 1 then
      v_new_streak := v_current_streak + 1;
    else
      -- Missing even one full local calendar day breaks the streak.
      v_new_streak := 1;
    end if;

    update public.profiles
    set total_xp = coalesce(total_xp, 0) + v_xp_reward,
        current_streak = v_new_streak,
        longest_streak = greatest(coalesce(longest_streak, 0), v_new_streak),
        last_active_date = v_activity_date
    where id = p_user_id;
    -- The existing profile economy trigger alone awards cumulative XP coins.
    -- No independent coin award and no changes to levels, avatars, or Shop.

    if v_category_id is not null then
      select count(*) into v_total_problems
      from public.problems where category_id = v_category_id;

      select count(*) into v_solved_problems
      from public.user_problem_status ups
      join public.problems p on p.id = ups.problem_id
      where ups.user_id = p_user_id and ups.solved = true
        and p.category_id = v_category_id;

      if v_total_problems > 0 then
        v_progress_percent := floor((v_solved_problems::numeric / v_total_problems::numeric) * 100);
      else
        v_progress_percent := 0;
      end if;

      insert into public.user_category_progress (user_id, category_id, progress_percent)
      values (p_user_id, v_category_id, v_progress_percent)
      on conflict (user_id, category_id) do update
      set progress_percent = excluded.progress_percent;
    end if;
  end if;

  select coalesce(total_xp, 0) into v_total_xp
  from public.profiles where id = p_user_id;

  return jsonb_build_object(
    'first_solve', v_first_solve,
    'xp_awarded', case when v_first_solve then v_xp_reward else 0 end,
    'total_xp', v_total_xp,
    'category_progress', case when v_category_id is not null then v_progress_percent else null end
  );
end;
$$;

comment on function public.record_problem_submission(uuid, integer, text, varchar, integer, integer, date)
  is 'Worker-only atomic submission/progression. p_activity_date is deprecated and ignored. The database clock determines the Europe/Bucharest activity DATE; naive submission/solve timestamps are stored as UTC.';

revoke all on function public.record_problem_submission(uuid, integer, text, varchar, integer, integer, date) from public, anon, authenticated;
grant execute on function public.record_problem_submission(uuid, integer, text, varchar, integer, integer, date) to service_role;

-- All streak screens already use this internal helper via scoped RPCs. Read
-- first-solve DATEs, never accepted-submission timestamps (repeats do not count).
-- The stored counter is historical; an expired streak displays 0 without writes.
create or replace function public.calculate_pylearn_current_streak(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with recursive active_days as (
    select activity_date
    from public.activity_log
    where user_id = p_user_id and problems_solved_count > 0
      and activity_date <= (now() at time zone 'Europe/Bucharest')::date
  ), streak_days(activity_date) as (
    select max(activity_date) from active_days
    where activity_date >= (now() at time zone 'Europe/Bucharest')::date - 1
    union all
    select d.activity_date - 1 from streak_days d
    where exists (select 1 from active_days a where a.activity_date = d.activity_date - 1)
  )
  select count(activity_date)::integer from streak_days;
$$;
revoke all on function public.calculate_pylearn_current_streak(uuid) from public, anon, authenticated;

create or replace function public.get_own_activity_week()
returns table (activity_date date, problems_solved_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_week_start date := v_today - (extract(isodow from v_today)::integer - 1);
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea activitatea.';
  end if;
  return query
  select a.activity_date, a.problems_solved_count
  from public.activity_log a
  where a.user_id = auth.uid() and a.problems_solved_count > 0
    and a.activity_date between v_week_start and v_today
  order by a.activity_date;
end;
$$;
revoke all on function public.get_own_activity_week() from public, anon;
grant execute on function public.get_own_activity_week() to authenticated;

create or replace function public.get_public_user_activity_month(
  p_profile_user_id uuid, p_year integer, p_month integer
)
returns table (activity_date date, problems_solved_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_month_start date;
  v_month_end date;
begin
  if auth.uid() is null then
    raise exception 'Trebuie să fii autentificat pentru a vedea activitatea unui utilizator.';
  end if;
  if p_month is null or p_month not between 1 and 12 then
    raise exception 'Luna selectată nu este validă.';
  end if;
  if p_year is null or p_year not between 2000 and extract(year from v_today)::integer then
    raise exception 'Anul selectat nu este valid.';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_user_id) then
    raise exception 'Utilizatorul nu a fost găsit.';
  end if;
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + interval '1 month')::date;
  if v_month_start > v_today then
    raise exception 'Luna selectată nu este validă.';
  end if;
  return query
  select a.activity_date, coalesce(a.problems_solved_count, 0)::integer
  from public.activity_log a
  where a.user_id = p_profile_user_id and a.problems_solved_count > 0
    and a.activity_date >= v_month_start and a.activity_date < v_month_end
    and a.activity_date <= v_today
  order by a.activity_date;
end;
$$;
revoke all on function public.get_public_user_activity_month(uuid, integer, integer) from public, anon;
grant execute on function public.get_public_user_activity_month(uuid, integer, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
