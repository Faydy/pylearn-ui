-- Extend verdict storage only; record_problem_submission and rewards are unchanged.
alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions add constraint submissions_status_check
  check (status in ('pending', 'accepted', 'wrong_answer', 'tle', 'runtime_error',
                   'time_limit_exceeded', 'memory_limit_exceeded', 'compile_error', 'time_limit', 'memory_limit', 'internal_error'));
