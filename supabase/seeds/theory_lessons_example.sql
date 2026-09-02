-- Optional seed: replace the chapter title if your curriculum uses a different name.
-- This insert is idempotent and only adds the sample when the matching chapter exists.
insert into public.theory_lessons (
  title,
  slug,
  summary,
  content,
  chapter_id,
  order_index,
  estimated_read_minutes,
  published
)
select
  'Introducere în numerele naturale',
  'introducere-numere-naturale',
  'Ce sunt numerele naturale și cum le folosim în probleme.',
  E'# Introducere\n\nNumerele naturale ne ajută să numărăm obiecte: $0, 1, 2, 3, \\ldots$.\n\n> **Definiție**\n> Un număr natural este un număr folosit pentru numărare.\n\n## Exemplu\n\nÎn mulțimea `{0, 1, 2, 3}`, numărul $3$ este mai mare decât $2$.\n\n$$\n3 = 2 + 1\n$$',
  c.id,
  1,
  4,
  true
from public.chapters c
where lower(c.title) = lower('Numere naturale')
  and not exists (
    select 1
    from public.theory_lessons lesson
    where lesson.slug = 'introducere-numere-naturale'
  )
limit 1;
