# Runnable theory examples — validation

Implemented on 2026-09-11. No database migrations. The initial frontend implementation was followed by the Judge0 output fix described below.

## Follow-up: Judge0 output encoding

The reported failure with `print("Numărul:", i)` exposed a likely backend transport issue: polling requested plain-text result fields. Judge0 documents conversion failures for some output bytes in this mode. `backend/code-runner-api/src/index.ts` now requests Base64 result fields and decodes stdout, stderr, compile output and message as UTF-8. Code submission, execution limits, output truncation and the public `/run` response contract are unchanged.

`backend/code-runner-api/test/index.spec.ts` covers the five-line Romanian example with a simulated plain-output conversion failure, ASCII, all error fields, empty results, Unicode, invalid UTF-8 bytes and output truncation. All 14 Worker tests pass; backend TypeScript checking also passes. A direct live Judge0 reproduction was blocked by HTTP 403, so the exact production cause remains unconfirmed. The fix requires backend deployment.

## Implementation

- `src/components/theory/TheoryContent.jsx`: replaces only explicitly runnable Python fences with `RunnableCodeBlock`; retains the existing static code and Markdown renderers.
- `src/utils/runnableMarkdown.js`: inspects the HAST code node's `language-python` class and a standalone `run` token in `data.meta`. The installed mdast-to-HAST handler already preserves metadata, so no remark/rehype plugin was needed. Removes only the single newline that handler appends, retaining original indentation and blank lines.
- `src/components/theory/RunnableCodeBlock.jsx`: owns code, output, error and running state per instance. Run sends the current code and empty stdin. Reset restores the original fence value and clears results. Run and Reset are disabled during a request; a synchronous guard prevents duplicate requests. Unmounted instances ignore late responses.
- `src/utils/api.js`: extracts the existing JSON parsing and API error handling, and shares `runCode(code, input)` between theory and problems. Preserves POST `/run`, JSON `{ code, input }`, `success`, `output`, `error`, HTTP fallback and network error behavior.
- `src/utils/pythonEditorOptions.js` and `src/pages/RezolvareProblema.jsx`: share the existing font, minimap, padding, cursor and scrolling settings. Problem-specific autocomplete registration/options, drafts, submit, reset and terminal logic remain in the problem page.
- Theory editors add automatic layout, line numbers, 22px line height and a 100–320px height based on code line count. The theme follows the existing `data-theme` attribute. Results preserve whitespace and scroll within their own area.

The `TopHeader.jsx` change in the workspace belongs to the preceding mobile-header fix.

## Automated tests

Run `node --test tests/runnable-markdown.test.mjs tests/run-code.test.mjs`.

Eight tests passed, covering explicit metadata detection, negative metadata cases, tilde/nested fences, exact whitespace preservation, surrounding Markdown/math, API payloads, empty stdout, runtime/HTTP/network failures, malformed JSON and repeated runs.

## Actual browser tests

Start `npx vite --config tests/theory-browser.config.mjs` and open `http://127.0.0.1:5177/tests/theory-browser.html`.

The fixture uses the actual theory renderer, Monaco and problem-solving page. Supabase and `/run` responses are simulated, making failure states reproducible without modifying production lessons. Supporting files: `theory-browser.html`, `theory-browser.jsx`, `theory-browser.config.mjs`, `fixtures/theory-supabase.js`.

Verified in the Codex browser:

- Plain `python` and `javascript run` remain static; both `python run` and `python title=example run` mount independent Monaco editors.
- Keyboard editing to `print(12)` sends that exact code with empty stdin. Returned stdout retains indentation and line breaks.
- Reset restores the six-line Markdown example, including four-space indentation, and clears its output without clearing another block's error.
- Runtime traceback, HTTP 429, network failure, invalid JSON/HTTP 502 and empty stdout display inline.
- While the first request is pending, its controls are disabled and its editor remains visible. The second block can run and display its own result. The pending request later completes normally.
- Normal text, headings, bold, italic, inline code, links, lists, static fences and math remain rendered before and after the editors.
- Viewports 320, 375, 430, 768 and 1440px: document scroll width equals viewport width. Buttons remain contained, wrapping at narrow widths. A 600-character output scrolls inside its result area.
- Dark and light modes render; light mode switches both editors to Monaco's light theme without clearing results.
- The actual problem component sends `print(input())` with sample stdin `5\n7`; success displays in Output and a runtime failure displays in Erori.
- No browser console errors or warnings were reported during those scenarios.

A separate request to the configured real `/run` endpoint was attempted and returned HTTP 403. Live Judge0 execution was therefore not verified; successful execution and failure UI assertions above use simulated responses.

## Checks

- `npm run build`: passed.
- `npm run lint`: passed with five existing warnings in `AuthContext.jsx`, `useProblemBrowser.js` and `tests/solved-browser.jsx`; no new warnings.
- `git diff --check`: passed.
