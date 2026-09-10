-- GUARDED HISTORICAL REPAIR / PREVIEW. Run as postgres after migration
-- 202609100001_bucharest_activity_and_streaks.sql in a maintenance window.
--
-- Historical solved_at/submitted_at are timestamp WITHOUT time zone. Their
-- original timezone cannot be recovered from the type or SHOW timezone today.
-- FIRST verify historical database/role timezone settings and import history.
-- Only after confirming ALL candidate timestamps were stored as UTC, replace
-- v_verified_source_timezone := null with := 'UTC' below.
--
-- This script defaults to ROLLBACK. Review/save all result sets and the backups
-- before changing the final ROLLBACK to COMMIT and rerunning. Unproven users are
-- untouched. A mix of old/new daily buckets which matches neither full histogram
-- is intentionally skipped for individual review, not guessed.
begin;
set local lock_timeout = '5s';

do $$
declare
  v_verified_source_timezone text := null;
begin
  if v_verified_source_timezone is distinct from 'UTC' then
    raise exception 'Repair stopped: independently verify historical UTC storage, then explicitly set v_verified_source_timezone to UTC.';
  end if;
  if (select atttypid from pg_attribute where attrelid = 'public.user_problem_status'::regclass
      and attname = 'solved_at' and not attisdropped) is distinct from 'timestamp without time zone'::regtype
    or (select atttypid from pg_attribute where attrelid = 'public.submissions'::regclass
      and attname = 'submitted_at' and not attisdropped) is distinct from 'timestamp without time zone'::regtype then
    raise exception 'Unexpected timestamp type; stop and review conversion.';
  end if;
  if exists (
    select 1 from pg_attribute where attrelid = 'public.activity_log'::regclass
      and attnum > 0 and not attisdropped
      and attname not in ('user_id', 'activity_date', 'problems_solved_count')
  ) then
    raise exception 'activity_log has additional data; review before reconstructing counts.';
  end if;
end;
$$;

-- Block concurrent submissions/progression while proving and reconciling data.
lock table public.profiles, public.user_problem_status, public.submissions, public.activity_log
  in share row exclusive mode;

create temp table repair_first_accepted on commit drop as
select user_id, problem_id, min(submitted_at) as first_accepted_at
from public.submissions
where status = 'accepted'
group by user_id, problem_id;

create temp table repair_solves on commit drop as
select ups.user_id, ups.problem_id, ups.solved_at,
       ups.solved_at::date as legacy_date,
       ((ups.solved_at at time zone 'UTC') at time zone 'Europe/Bucharest')::date as corrected_date,
       (ups.solved_at is not null and a.first_accepted_at = ups.solved_at
         and isfinite(ups.solved_at)
         and ups.solved_at <= (clock_timestamp() at time zone 'UTC')) as verified
from public.user_problem_status ups
left join repair_first_accepted a using (user_id, problem_id)
where ups.solved = true;

create temp table repair_legacy_counts on commit drop as
select user_id, legacy_date as activity_date, count(*)::integer as problems_solved_count
from repair_solves where verified group by user_id, legacy_date;

create temp table repair_corrected_counts on commit drop as
select user_id, corrected_date as activity_date, count(*)::integer as problems_solved_count
from repair_solves where verified group by user_id, corrected_date;

create temp table repair_eligibility on commit drop as
select p.id as user_id,
  case
    when not exists (select 1 from repair_solves s where s.user_id = p.id)
      then 'SKIP: no reconstructable first solves'
    when exists (select 1 from repair_solves s where s.user_id = p.id and s.verified is not true)
      then 'SKIP: missing/invalid timestamp or first accepted evidence differs'
    when exists (
      select 1 from repair_first_accepted a
      where a.user_id = p.id and not exists (
        select 1 from repair_solves s where s.user_id = a.user_id and s.problem_id = a.problem_id
      )
    ) then 'SKIP: accepted submission without solved status'
    when not exists (
      select 1 from public.activity_log a
      full join repair_legacy_counts c using (user_id, activity_date)
      where coalesce(a.user_id, c.user_id) = p.id
        and a.problems_solved_count is distinct from c.problems_solved_count
    ) then 'REPAIR: complete legacy daily counts verified'
    when not exists (
      select 1 from public.activity_log a
      full join repair_corrected_counts c using (user_id, activity_date)
      where coalesce(a.user_id, c.user_id) = p.id
        and a.problems_solved_count is distinct from c.problems_solved_count
    ) then 'RECONCILE: daily counts already correct'
    else 'SKIP: unmatched activity (mixed buckets, imports, deleted history, or unrelated counts)'
  end as decision
from public.profiles p;

create temp table repair_users on commit drop as
select user_id from repair_eligibility where decision not like 'SKIP:%';

-- Exact before images, including profile counters. Export these result sets
-- during preview; do not rely on the temp tables for backup after COMMIT.
create temp table repair_activity_before on commit drop as
select a.* from public.activity_log a join repair_users u using (user_id);
create temp table repair_profiles_before on commit drop as
select p.id, p.last_active_date, p.current_streak, p.longest_streak
from public.profiles p join repair_users u on u.user_id = p.id;

-- Only proven users are touched, and only changed/missing dates are updated.
insert into public.activity_log (user_id, activity_date, problems_solved_count)
select c.user_id, c.activity_date, c.problems_solved_count
from repair_corrected_counts c join repair_users u using (user_id)
on conflict (user_id, activity_date) do update
set problems_solved_count = excluded.problems_solved_count
where public.activity_log.problems_solved_count is distinct from excluded.problems_solved_count;

delete from public.activity_log a
using repair_users u
where a.user_id = u.user_id and not exists (
  select 1 from repair_corrected_counts c
  where c.user_id = a.user_id and c.activity_date = a.activity_date
);

-- Consecutive islands: latest island = stored current streak, largest island
-- can raise longest_streak, but a repair/reset never lowers an existing record.
create temp table repair_streaks on commit drop as
with numbered as (
  select c.user_id, c.activity_date,
         c.activity_date - row_number() over (partition by c.user_id order by c.activity_date)::integer as island
  from repair_corrected_counts c join repair_users u using (user_id)
), runs as (
  select user_id, max(activity_date) as last_day, count(*)::integer as run_length
  from numbered group by user_id, island
), ranked as (
  select *, row_number() over (partition by user_id order by last_day desc) as recency,
         max(run_length) over (partition by user_id) as longest
  from runs
)
select user_id, last_day, run_length, longest from ranked where recency = 1;

update public.profiles p
set last_active_date = r.last_day, current_streak = r.run_length,
    longest_streak = greatest(coalesce(p.longest_streak, 0), r.longest)
from repair_streaks r
where p.id = r.user_id;

select decision, count(*) as users from repair_eligibility group by decision order by decision;
select * from repair_eligibility where decision like 'SKIP:%' order by user_id;
select * from repair_activity_before order by user_id, activity_date;
select * from repair_profiles_before order by id;
select a.* from public.activity_log a join repair_users u using (user_id) order by user_id, activity_date;
select p.id, p.last_active_date, p.current_streak, p.longest_streak,
       public.calculate_pylearn_current_streak(p.id) as effective_current_streak
from public.profiles p join repair_users u on u.user_id = p.id order by p.id;

-- Preview only. Change to COMMIT only after verifying the timezone, exported
-- backups, candidate/skip reports, corrected buckets and profile counters.
rollback;
