# Problem filter redesign validation

Validated on 2026-09-12 in the Codex Chromium browser.

## Files

- `src/components/problems/ProblemFilters.jsx`: search-first toolbar, Filters disclosure panel, dedicated Status/Sort controls, removable chips, reset and results action.
- `src/components/problems/FilterDropdown.jsx`: custom select-only combobox and portaled listbox. No native select menu or new dependency.
- `src/hooks/useProblemBrowser.js`: discard committed search drafts so Back does not reapply them and discard Forward history.
- `tests/problem-filters.test.mjs`: filter dependency, chip removal, pagination, URL and reset regression tests.
- `tests/problem-filters-browser.config.mjs`, `tests/problem-filters-browser.html`, `tests/problem-filters-browser.jsx`, `tests/fixtures/problem-filters-supabase.js`: isolated browser fixture with 67 problems, three pages, multiple grades/sections/chapters, and true/false/missing solved rows.
- This validation report.

Problem cards, server query construction, default ordering, result summary, and production dependencies are unchanged. In this app the broad archive is `/probleme/toate`; `/probleme` remains the existing curriculum landing page.

## UI behavior

Desktop keeps search beside Filters, Status (signed-in users), and Sort. On smaller screens search occupies its own row. The closed toolbar has no curriculum dropdowns. The expanded panel uses four columns on wide screens, two on tablets, and one on phones, with 44px controls and a results button that closes the live-filtering panel.

All existing six native dropdowns (class, section, chapter, difficulty, status, sort) now use the same custom combobox. Popups use `bg-sidebar`, `border-border`, theme text/accent/hover tokens, a selected checkmark, focus outlines, disabled opacity/cursor, and themed scrollbars. Popup width/height and opening direction follow available viewport space. Menus close on outside pointer, Tab, Escape, or selection. Arrow keys, Home/End, Enter/Space and typeahead were exercised.

Chips include each selected curriculum filter, difficulty, status, concept, search and non-default sort. A chip clears only its key; dependency validation removes a descendant only if invalid. The count retains the existing definition, including search and sort. Reset is shown only for non-default state and resets sort and pagination without removing route constraints or unrelated query parameters.

## Browser checks performed

Both themes were tested at 320, 375, 430, 768 and 1440px. All had zero native filter selects, no document/filter horizontal overflow, and no truncated Status/Sort labels. Dark menu computed background was `rgb(20, 27, 34)`; light was `rgb(255, 255, 255)`. Screenshots were visually inspected for desktop and mobile surfaces, borders, selected state and focus outlines. Device-width emulation was used, not a physical phone.

The isolated fixture uses the production components and `useProblemBrowser` with a test-only Supabase adapter and auth context. It verified:

1. Selecting class IX, Vectori, Parcurgerea vectorilor and Mediu produced four chips and one result. Changing to class X removed invalid section/chapter state and preserved difficulty. Removing difficulty preserved class.
2. Page 2 reset to page 1 when selecting solved status. Solved returned two records; unsolved returned 65, including failed attempts and absent status rows.
3. Descending XP placed Exercițiu 60, 59, 58 first. Combined search `exercițiu 05` returned one result. Removing search preserved status/sort.
4. Search `suma` with unsolved status returned two results; refresh restored all controls. Back removed the search; Forward restored it. This caught and verified the stale-draft fix in the hook.
5. Fixed grade hid class; fixed section hid class/section; fixed chapter exposed difficulty only. Reset kept their respective totals of 66, 44 and 23 and their route paths.
6. Anonymous state hid Status. Keyboard Space/typeahead/Enter selected Mediu. Escape first closed the dropdown, then the panel and restored focus to Filters. Tab closed the popup. Home/ArrowDown/Enter selected solved status.
7. The existing empty-results message still appears for a combination with no matching records.

The complete app was also opened against its configured real backend, anonymously. The archive returned 63 problems. Combining `difficulty=mediu&q=vector` returned three problems. Dark chapter menus, long scrollable chapter options, light sorting menus, and the full page at phone/tablet/desktop sizes were checked. No browser console errors were reported. Authenticated status behavior was tested with the isolated fixture, not a real user account. The existing mobile navigation scroll strip and all cards were left unchanged.

## Reproduce

```sh
node node_modules/vite/bin/vite.js --config tests/problem-filters-browser.config.mjs
# Open http://127.0.0.1:5179/probleme/toate
node --test tests/problem-filters.test.mjs tests/solved-problems.test.mjs
npm run build
npm run lint
git diff --check
```

Results: 10 tests passed; build passed; lint exited 0 with five pre-existing warnings (two hook dependency warnings, two solved-fixture Fast Refresh warnings, one AuthContext Fast Refresh warning); diff check passed. Git also emitted its local LF-to-CRLF conversion notices.
