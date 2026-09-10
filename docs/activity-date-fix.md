# Activity date and streak correctness — 2026-09-10

Implemented in the workspace, tested locally, **not applied to production Supabase**. The current function and column types were inspected from the database export supplied in this task; no direct privileged production SQL connection was available. Existing executed migrations are unchanged.

1. **Root cause.** `record_problem_submission(..., p_activity_date date DEFAULT CURRENT_DATE)` used the session's calendar date. At September 9 02:00 Bucharest, UTC is September 8 23:00, so a UTC session persisted September 8. Both activity and profile streak dates came from that parameter.

2. **Date audit.** The supplied submission function used `p_activity_date` for the activity upsert, same-day/yesterday comparisons, and `last_active_date`. It also implicitly cast `now()` into the naive `solved_at` column, while `submissions.submitted_at` defaulted to `now()`. Migration `202609040004` derived streaks from *all* accepted submissions, including repeat solves, using `(submitted_at AT TIME ZONE 'Europe/Bucharest')::date`. Because the actual column is `timestamp without time zone`, this attaches a zone instead of converting a known instant and then casts through the session timezone. Migration `202609050011` validated the calendar year using `current_date`. The weekly calendar generated browser-local week boundaries via `toISOString()` and parsed naive submission timestamps with `new Date(value)`. The shared date helper and profile calendar used browser-local getters for today/month/grid dates. No authoritative frontend or Worker `toISOString().split(...)`/`.slice(0,10)` activity writes were found. Remaining ISO conversions in assignment and notification utilities are unrelated timestamp handling and were left unchanged.

3. **Timezone.** The authoritative activity calendar timezone is explicitly `Europe/Bucharest`. No fixed offset, browser timezone, or session date controls activity writes. UTC is used only as the explicit storage convention for the existing naive timestamp columns and for timezone-independent frontend calendar arithmetic. PostgreSQL DATE values remain date-only values. See PostgreSQL's [AT TIME ZONE documentation](https://www.postgresql.org/docs/current/functions-datetime.html#FUNCTIONS-DATETIME-ZONECONVERT).

4. **Trusted write.** The function locks the profile, captures one `clock_timestamp()` in `v_recorded_at`, and derives `v_activity_date := (v_recorded_at AT TIME ZONE 'Europe/Bucharest')::date`. Capturing after the lock prevents a waiting request from using a pre-midnight date. Both timestamps use the same instant, explicitly stored as `v_recorded_at AT TIME ZONE 'UTC'` in the verified `timestamp without time zone` columns. The signature stays compatible; the optional date argument defaults to NULL and is ignored even when explicitly supplied. The Worker's six named arguments and JSON result shape are preserved. Execution remains service-role-only, with SECURITY DEFINER and `search_path = public`.

5. **Streak algorithm.** Only a first accepted solve applies progression. No previous date: 1. Previous date equals today: unchanged. Previous date equals yesterday: previous streak + 1. Any other date: 1. `longest_streak = greatest(existing longest_streak, new current_streak)`. A `(user_id, activity_date)` upsert increments the count for each distinct first solve while the streak advances once per day.

6. **One missed day.** September 7 active, September 8 inactive, September 9 first solve yields current streak 1. Wrong/runtime-error submissions and accepted repeats still record submission/attempt history, but do not change XP, coins, activity, streak, or first-solve time. `/run` does not call progression.

7. **Expired display.** `calculate_pylearn_current_streak` now counts consecutive positive activity DATEs ending today or yesterday; it returns 0 otherwise and excludes future rows. Dashboard `get_own_activity_summary` and both own/public profile `get_public_profile` already use this helper, so their contracts remain unchanged. Profile header and stats both receive the scoped public profile result. Sidebar/header and leaderboards do not display another streak value. Date-dependent queries refresh when the Bucharest date changes (15-second checks, plus focus/visibility refresh), without mutating the database or resetting unsaved profile fields.

8. **Production historical data.** Not repaired automatically or changed remotely. The user confirmed that historical timezone provenance is unknown. A timestamp without time zone cannot prove the original timezone, and today's `SHOW timezone` cannot prove historical settings. The forward migration deliberately does not guess.

9. **Guarded repair.** `supabase/manual/repair_bucharest_activity.sql` fails until an operator independently verifies historical UTC storage and explicitly acknowledges it in the script. It defaults to ROLLBACK. For each user, every first-solve timestamp must be finite, non-future, and exactly match the earliest accepted submission. The entire existing daily histogram must match either the legacy first-solve histogram or the already-corrected histogram. Missing history, null timestamps, unmatched counts, unexplained accepted submissions, extra activity columns, and mixed old/new buckets are skipped or stop the script. No global +1 operation is used. Under table locks, proven counts are reconstructed using `((solved_at AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Bucharest')::date`. Before images, proposed results, and skipped users are returned for export/review before any COMMIT.

10. **Historical profile reconciliation.** For proven users only, the repair sets `last_active_date` to the latest corrected day, computes stored `current_streak` from the latest consecutive island, and raises/preserves `longest_streak` using the largest island. Old current streaks can remain stored after expiry; the scoped reads display 0. Unproven users remain untouched. XP, coin balances/transactions, timestamps, avatars, and category progress are not modified by repair. This was executed against disposable fixtures, not production rows.

11. **Frontend calendar.** Date-only keys stay strings. Numeric UTC containers are used exclusively for calendar arithmetic and always formatted with UTC, preventing a DATE from shifting to another day. Bucharest today is separately derived with Intl. Monday-first layout, Romanian labels, selected month, future navigation restriction, active cells, summary counts, tooltips, styles, and responsive layout are preserved. The dashboard week now reads a scoped first-solve activity RPC instead of accepted submissions.

12. **Midnight tests executed.** September 9 at 00:05, 02:00, 23:55, and September 10 at 00:05 produce the expected local days. PostgreSQL tests execute the migrated function with a frozen clock only inside disposable test definitions under UTC, Bucharest, and Los Angeles session timezones; a supplied `2099-01-01` date is ignored. Frontend date tests also ran with UTC, Los Angeles, and Kiritimati process timezones, as well as the default Bucharest environment. Browser fixture checks verified September 9 highlighted, September 8 inactive, one day/three solves, today markers, August→September navigation, disabled next month, zero expired streak displays, and a 390px layout without horizontal overflow. Browser data was mocked locally; no production submissions were made.

13. **DST.** Winter UTC+2 and summer UTC+3, the March/October DST transitions, leap February, and Bucharest New Year are covered. Conversion uses the IANA zone rules; no fixed-offset date arithmetic is used.

14. **Files changed for this task.**

    - `supabase/migrations/202609100001_bucharest_activity_and_streaks.sql`
    - `supabase/manual/inspect_activity_date_schema.sql`
    - `supabase/manual/repair_bucharest_activity.sql`
    - `supabase/tests/activity_fixture.sql`, `supabase/tests/activity.test.mjs`
    - `src/utils/activity.js`, `src/hooks/useBucharestToday.js`
    - `src/components/profile/ProfileActivityCalendar.jsx`
    - `src/components/RightPanel/CalendarActivitate.jsx`
    - `src/components/MainArea/Grid/ActivitateComponent.jsx`
    - `src/pages/Profile.jsx`
    - `backend/code-runner-api/test/index.spec.ts`
    - `tests/activity.test.mjs`, `tests/activity-browser.config.mjs`, `tests/activity-browser.html`, `tests/activity-browser.jsx`, `tests/fixtures/activity-auth.js`, `tests/fixtures/activity-supabase.js`
    - `package.json`, `package-lock.json` (PGlite development dependency and test commands)
    - `docs/activity-date-fix.md`

    Pre-existing edits to the problem browser and its related files were preserved.

15. **New migration.** `202609100001_bucharest_activity_and_streaks.sql`. Its transaction fails before changes if the known RPC overload or timestamp types differ from the supplied schema. It preserves existing table/RLS policies, economy triggers, and scoped profile RPC contracts. The profile lock serializes different-problem solves; real multi-connection concurrency was not load-tested by the single-connection PGlite runner.

16. **Validation results.** `npm run build`: passed. `npm run lint`: passed with four pre-existing warnings (`AuthContext.jsx`, two dependency warnings in `useProblemBrowser.js`, unused import in `Probleme.jsx`). `git diff --check`: passed. `npm run test:activity`: 30 tests passed (including nested suite totals). Worker `npm test -- --run`: 5 passed. Tests cover cumulative 10-XP coin thresholds using the actual existing economy trigger, category recalculation, first solves, repeats, missed days, stored/effective streak differences, future dates, role grants, schema guards, repair idempotency/skip behavior, and forced late-failure rollback of all progression writes. There were no pre-existing database tests; PGlite runs actual PostgreSQL SQL/PLpgSQL against a disposable fixture matching the supplied schema.

17. **Manual Supabase steps.** Run the read-only `supabase/manual/inspect_activity_date_schema.sql` if production has changed since the supplied export; review any drift. Apply only the new migration as one transaction in Supabase SQL Editor/as the migration owner before deploying the updated frontend. No Worker redeployment is required. Historical repair is separate: establish the old timestamps' timezone from historical settings/import provenance; if UTC is verified, enable and run the repair preview, export its before/after and skipped-user reports, then deliberately change ROLLBACK to COMMIT and rerun in a maintenance window. If timezone provenance remains unknown, leave the guard intact and keep those users for manual investigation. Never run test fixture SQL on production.

To rerun locally:

```sh
npm ci
npm run test:activity
npm run build
npm run lint
git diff --check
npm run test:activity:browser
```

The browser fixture is at `http://127.0.0.1:5175/tests/activity-browser.html`; its `instant` query parameter freezes the fixture clock only. Worker tests run from `backend/code-runner-api` with `npm test -- --run`.
