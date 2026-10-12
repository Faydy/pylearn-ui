# Mobile Monaco clipboard investigation — 2026-09-14

## Implementation update — 2026-10-12

Status: **mobile replacement implemented; physical phone acceptance still pending.** The investigation below records the earlier Monaco-only state, not the current implementation.

All five editor surfaces now use `ResponsiveCodeEditor`: touch-first devices use a lazy-loaded CodeMirror 6 editor with native selection and clipboard handling; desktop retains Monaco. Controlled values, Python/Markdown highlighting, Python completions, the autocomplete toggle, themes, and read-only viewers are supported. No Clipboard API permission or custom paste interception is needed. During finalization, completion key bindings were given priority over newline insertion, and completions were disabled in read-only viewers.

Current validation:

- `npm run build`: passed (bundle-size warning for the lazy mobile editor).
- `npm run lint`: passed with six warnings, including the editor fixture's Fast Refresh warning.
- `node --test tests/editor-value.test.mjs`: two passing tests covering exact text synchronization and cursor mapping.
- `git diff --check`: passed.
- Local browser fixture `/tests/editor-browser.html`: pasted multiline Python with four-space indentation, emoji, and trailing blank lines; the React value preserved the exact text. Cut emptied the editor, paste restored it, and copy to a normal textarea preserved it. Editing the second runnable block left the first unchanged. A paste attempt in read-only mode did not change the value or change count. Switching to Monaco retained the shared value.

These browser checks selected the mobile renderer using the fixture's media-query override; they do **not** emulate a phone or validate iOS/Android long-press menus. Physical Safari and Chrome mobile acceptance remains outstanding. Use the checklist below for device testing, now against CodeMirror; an upstream Monaco patch is no longer required by this implementation.

## Historical Monaco-only investigation

At the time of this earlier investigation, no production code, CSS, editor options, or event handlers had been changed. Passing desktop checks must not be treated as mobile acceptance.

## Findings

The installed `@monaco-editor/loader` configuration loads Monaco **0.55.1** from jsDelivr. PyLearn has five editor render sites in four files:

| Surface | File | Audit result |
| --- | --- | --- |
| Problem solving | `src/pages/RezolvareProblema.jsx` | Shared Python options; completion provider; no touch/context-menu suppression in wrapper |
| Runnable theory blocks | `src/components/theory/RunnableCodeBlock.jsx` | Independent controlled values; no focus effect or touch suppression |
| Developer Markdown | `src/pages/TheoryDev.jsx` | Shared options; separate explicit clipboard buttons; no editor clipboard interception |
| Submission modal | `src/components/profile/SubmittedSolutions.jsx` | Read-only; inner mouse-down stops propagation to prevent closing the modal, without cancelling default behavior |
| Inline submitted code | `src/components/profile/SubmittedSolutions.jsx` | Read-only |

The app stylesheet and wrappers contain no editor `user-select: none`, `touch-action: none`, native-context-menu cancellation, or overrides of Monaco's input textarea. Toolbar elements are siblings of the editor. Overflow clipping exists around editor panels, but there is no evidence it causes the reported clipboard failure. The existing developer Copy buttons catch Clipboard API failures and do not intercept native editor Copy/Cut/Paste. Clipboard API availability/permissions were not tested on Safari.

The exact installed upstream source reveals several barriers to normal iOS selection:

1. [Monaco touch.js](https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/esm/vs/base/browser/touch.js) translates a held touch into `-monaco-gesturecontextmenu` and cancels native touch events when it dispatches a gesture.
2. [Monaco pointerHandler.js](https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/esm/vs/editor/browser/controller/pointerHandler.js) registers the code surface as a gesture target. Touch movement scrolls the editor; pen movement can extend selection. Taps focus the internal input and update Monaco's cursor.
3. [Monaco contextmenu.js](https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/esm/vs/editor/contrib/contextmenu/browser/contextmenu.js) cancels the browser menu for code targets and displays Monaco's menu. Setting `contextmenu: false` does not remove the preceding gesture cancellation or implement native selection handles.
4. [Monaco textAreaEditContext.js](https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/esm/vs/editor/browser/controller/editContext/textArea/textAreaEditContext.js) owns the position and small dimensions of its input textarea. It is not a full native text-editing surface corresponding to the rendered code.
5. [Monaco textAreaEditContextInput.js](https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/esm/vs/editor/browser/controller/editContext/textArea/textAreaEditContextInput.js), `_installSelectionChangeListener`, explicitly ignores native selection changes outside Chrome. Merely making the textarea selectable therefore does not provide Safari selection synchronization.

These are upstream mechanisms consistent with the reported failure, **not a device-confirmed diagnosis of which mechanism triggers the user's particular iPhone failure**. The [official Monaco site](https://microsoft.github.io/monaco-editor/) explicitly lists mobile browsers as unsupported. A blanket CSS override, context-menu toggle, browser sniff, or forced accessibility mode is not a demonstrated fix.

## Browser checks actually performed

Used the existing isolated fixture:

```sh
npm run dev -- --config tests/theory-dev-browser.config.mjs
# http://127.0.0.1:5179/dev/teorie
```

The fixture renders the real developer editor, two real runnable editors, and a normal textarea, without production account access.

| Check | Observed result |
| --- | --- |
| Chromium desktop, runnable code selection + Cmd+A/C | Passed; clipboard contained the selected code |
| Cmd+X followed by Cmd+V | Passed; cut emptied the first editor; paste restored it |
| Indented paste | Passed; `for i in range(3):` followed by four-space-indented `print(i)` survived paste and copy-back |
| 390 × 844 Chromium viewport | Editors rendered and remained editable; **viewport sizing only, not touch/iOS emulation** |
| Multiline paste in second editor | Passed; `a = 5`, `b = 7`, `print(a + b)` remained separate lines |
| Two-editor focus isolation | Passed in this fixture; editing the second block left the first block's code intact |
| Monaco → normal textarea | Passed; copied multiline code pasted unchanged |
| Normal textarea → Monaco | Passed with `print("Salut")`; copy-back returned exactly the same single line |
| Normal page selection | Cmd+A outside Monaco selected ordinary page text and copied it |
| Safari macOS | Attempted; browser control was interrupted by user activity, so no valid clipboard result |
| Physical iPhone / iOS Safari | Unavailable; long press, selection handles, native menu, Copy, Cut, Paste and Select All **unverified** |
| Chromium touch emulation | Unavailable through the exposed browser controls |
| Problem editor / read-only viewers | Source audit only; no interactive clipboard test |
| Autocomplete toggle, manual Ctrl+Space, snippets, problem draft persistence | Source unchanged; no interactive regression claim |

Chromium's inspected input used `native-edit-context`, rather than Safari's textarea fallback. Chromium success cannot establish Safari correctness.

## Validation

- `npm run build`: passed.
- `npm run lint`: passed with five existing warnings (Fast Refresh exports in `AuthContext.jsx` and `solved-browser.jsx`; effect dependencies in `useProblemBrowser.js`).
- `git diff --check`: passed after adding this report.

## Required next verification

On a physical iPhone, record iOS/Safari version and reproduce the failure in both the PyLearn fixture and a minimal Monaco 0.55.1 editor. Inspect touch cancellation, focused input, selection range, and native menu behavior with Safari's remote inspector. A proposed upstream fix must handle both touch gesture dispatch and Safari native-selection/model synchronization, without modifying the hidden input blindly.

Acceptance remains: long-press partial-line selection, selection handles, native Copy/Cut/Paste/Select All, tapping elsewhere, all three supplied paste samples, transfers to/from page text and normal inputs, multiple independent runnable editors, read-only copy, problem drafts, autocomplete ON/OFF, manual completions, snippets, desktop mouse selection and Cmd/Ctrl+A/C/X/V. Until those checks pass, do not label this issue fixed.
