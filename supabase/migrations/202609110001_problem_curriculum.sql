-- Read-only curriculum aggregates; existing table privileges and RLS still apply.
create or replace function public.get_problem_curriculum(
  p_grade_id integer default null,
  p_chapter_id integer default null
)
returns table (
  chapter_id integer, title text, section text, grade_id integer,
  grade_name text, order_index integer,
  total_problem_count bigint, solved_problem_count bigint
)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if p_grade_id is null and p_chapter_id is null then
    raise exception 'Selectează o clasă sau un capitol.' using errcode = '22023';
  end if;

  if auth.uid() is null then
    -- Public browsing never needs permission to read private status rows.
    return query
    select c.id, c.title::text, c.section::text, c.grade_id,
      g.name::text, c.order_index, count(p.id), null::bigint
    from public.chapters c
    join public.grades g on g.id = c.grade_id
    left join public.problems p on p.chapter_id = c.id
    where (p_grade_id is null or c.grade_id = p_grade_id)
      and (p_chapter_id is null or c.id = p_chapter_id)
    group by c.id, c.title, c.section, c.grade_id, g.name, c.order_index
    order by c.order_index nulls last, c.id;
  else
    return query
    select c.id, c.title::text, c.section::text, c.grade_id,
      g.name::text, c.order_index, count(distinct p.id),
      count(distinct p.id) filter (where ups.solved is true)
    from public.chapters c
    join public.grades g on g.id = c.grade_id
    left join public.problems p on p.chapter_id = c.id
    left join public.user_problem_status ups on ups.problem_id = p.id
      and ups.user_id = (select auth.uid()) and ups.solved is true
    where (p_grade_id is null or c.grade_id = p_grade_id)
      and (p_chapter_id is null or c.id = p_chapter_id)
    group by c.id, c.title, c.section, c.grade_id, g.name, c.order_index
    order by c.order_index nulls last, c.id;
  end if;
end;
$$;

revoke all on function public.get_problem_curriculum(integer, integer) from public;
grant execute on function public.get_problem_curriculum(integer, integer) to anon, authenticated;
