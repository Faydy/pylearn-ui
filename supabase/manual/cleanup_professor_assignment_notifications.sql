-- Optional, one-time cleanup of only the incorrect "Temă nouă" rows that
-- were delivered to the teacher who owns that assignment's classroom.
-- Run this in Supabase SQL Editor only after reviewing the affected rows.

select
  n.id,
  n.user_id,
  n.assignment_id,
  n.created_at
from public.notifications n
join public.assignments a on a.id = n.assignment_id
join public.classrooms c on c.id = a.classroom_id
where n.type = 'new_assignment'
  and n.user_id = c.teacher_id
order by n.created_at desc;

-- Uncomment after checking the SELECT result above.
-- delete from public.notifications n
-- using public.assignments a, public.classrooms c
-- where n.type = 'new_assignment'
--   and n.assignment_id = a.id
--   and a.classroom_id = c.id
--   and n.user_id = c.teacher_id;
