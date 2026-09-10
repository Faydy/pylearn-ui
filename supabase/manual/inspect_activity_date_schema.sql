-- Read-only preflight: run in the Supabase SQL editor as postgres.
-- The original schema and submission function predate this repository's migrations.
select p.oid::regprocedure::text as signature,
       pg_get_functiondef(p.oid) as definition,
       p.proacl as grants
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('record_problem_submission', 'calculate_pylearn_current_streak');

select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('user_problem_status', 'activity_log', 'profiles', 'submissions', 'user_category_progress', 'problems')
order by table_name, ordinal_position;

select c.conrelid::regclass as table_name, c.conname, pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid in ('public.user_problem_status'::regclass, 'public.activity_log'::regclass);

select t.tgrelid::regclass as table_name, t.tgname,
       pg_get_triggerdef(t.oid) as trigger_definition,
       pg_get_functiondef(t.tgfoid) as function_definition
from pg_trigger t
where not t.tgisinternal
  and t.tgrelid in ('public.user_problem_status'::regclass, 'public.activity_log'::regclass, 'public.profiles'::regclass, 'public.submissions'::regclass);

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('user_problem_status', 'activity_log', 'profiles', 'submissions');
