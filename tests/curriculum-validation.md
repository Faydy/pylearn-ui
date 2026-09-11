# Problem curriculum implementation

## Routes and behavior

- `/probleme`: existing grade selection, unchanged.
- `/probleme/clasa/:gradeId`: curriculum overview; no individual problem records, problem filters or pagination.
- `/probleme/clasa/:gradeId/sectiune/:sectionName`: compatible section URL, now showing only its chapters.
- `/probleme/capitol/:chapterId`: existing chapter URL; breadcrumbs, chapter-wide progress, search, difficulty/status filters, sorting and existing problem cards.
- `/rezolvare/:id`: existing problem link, unchanged.

Chapters are grouped by the existing `section` field, with the existing `Altele` fallback for missing sections. Database `order_index` and ID preserve chapter order. Empty chapters remain visible with `0 probleme` and `În curând`; completed chapters remain clickable.

## Data and security

The new `get_problem_curriculum(p_grade_id, p_chapter_id)` RPC returns chapter metadata, grade name and aggregate counts. It uses `security invoker`, respects existing RLS and grants, and restricts solved rows to `auth.uid()` and `solved = true`. Anonymous calls skip the private status table and return null personal counts. No progression, execution, submission or economy functions were changed.

The grade overview normally makes two queries: one grade lookup plus one aggregate RPC. It never downloads all problems or issues one request per chapter. Aggregate rows are paged in batches of 1,000 if necessary. Chapter pages make one scoped aggregate RPC in addition to the existing paginated problem-browser requests; changing problem filters does not change chapter-wide progress.

Overall progress sums chapter counts, then rounds solved / total × 100. Zero totals avoid division by zero. Anonymous UI displays counts without personal bars or solved badges.

## Changed files

- `src/App.jsx`: reuse the curriculum view for section routes.
- `src/pages/Capitole.jsx`: replace inline problem lists with chapter cards and grade progress.
- `src/pages/ProblemeSectiune.jsx`: chapter breadcrumbs and aggregate progress, retaining existing filters/cards.
- `src/hooks/useProblemCurriculum.js`: scoped, cancellable loading; authentication changes, retries and browser-focus refresh.
- `src/components/problems/CurriculumProgress.jsx`, `CurriculumBreadcrumbs.jsx`: shared presentation.
- `supabase/migrations/202609110001_problem_curriculum.sql`: read-only aggregate RPC.
- `supabase/tests/problem-curriculum.test.mjs`: actual PostgreSQL migration tests using disposable PGlite.
- `tests/curriculum-browser.html`, `curriculum-browser.jsx`, `curriculum-browser.config.mjs`, `fixtures/curriculum-supabase.js`: isolated browser fixture with actual UI components.
- `tests/solved-browser.jsx`, `fixtures/solved-supabase.js`: keep the existing browser fixture compatible.

## Verification

`npm run build` and `git diff --check` passed. `npm run lint` passed with the five existing warnings in AuthContext, useProblemBrowser and the older solved-browser fixture; no new warnings.

`node --test supabase/tests/problem-curriculum.test.mjs tests/solved-problems.test.mjs`: 10 tests passed, including current-user scoping, failed attempts, another user's solved rows, RLS-hidden problems, anonymous table permissions, empty chapters and counts above 1,000 problems.

Actual browser tests used a fixture grade with Algoritmi, Vectori and Altele, five chapters, six problems and two personal solves. Verified grade selection; 2/6 = 33% grade progress; 1/3 = 33% chapter progress; completed and empty chapter navigation; section breadcrumbs; solved badges; search including diacritics; difficulty/status/sort controls; and URL filter persistence after refresh. Anonymous browsing shows totals without fake personal progress. Query logging showed one RPC and one grade lookup on entry to the grade overview, with no grade-wide problem request.

Both curriculum and chapter pages were measured at 320, 375, 430, 768 and 1440px: document scroll width matched viewport width. Cards use one column on mobile and two from tablet sizes. Expanded mobile filters remain contained. Browser console had no errors during testing.

Browser data was simulated; the migration itself was executed and tested in local PostgreSQL, not the production Supabase project.

Reproduce browser tests with `npx vite --config tests/curriculum-browser.config.mjs`, then open `http://127.0.0.1:5178/probleme`.

## Release

Apply `supabase/migrations/202609110001_problem_curriculum.sql` in the target Supabase project **before** publishing the frontend. Without the RPC, the curriculum will display its loading-error state. This work does not deploy either change automatically.
