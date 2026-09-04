-- Hidden judge cases must never be selectable by a browser client. The public
-- runner uses its service-role client, while browsers receive samples via RPC.
alter table public.test_cases enable row level security;

revoke all privileges on table public.test_cases from anon, authenticated;

-- Revoke any historical per-column grants too; table-level REVOKE does not
-- remove those grants in PostgreSQL.
do $$
declare
  columns_list text;
begin
  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
  into columns_list
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'test_cases';

  if columns_list is not null then
    execute format(
      'revoke select (%1$s), insert (%1$s), update (%1$s), references (%1$s) on table public.test_cases from anon, authenticated',
      columns_list
    );
  end if;
end;
$$;

create or replace function public.get_sample_test_cases(p_problem_id bigint)
returns table (
  input text,
  expected_output text,
  is_sample boolean
)
language sql
security definer
set search_path = public
as $$
  select
    test_case.input::text,
    test_case.expected_output::text,
    test_case.is_sample
  from public.test_cases as test_case
  where test_case.problem_id = p_problem_id
    and test_case.is_sample is true
  order by test_case.id;
$$;

revoke all on function public.get_sample_test_cases(bigint) from public;
grant execute on function public.get_sample_test_cases(bigint) to anon, authenticated;
