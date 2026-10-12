import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '../src/components/ResponsiveCodeEditor';
import RunnableCodeBlock from '../src/components/theory/RunnableCodeBlock';
import { MOBILE_EDITOR_QUERY } from '../src/utils/editorEnvironment';
import { pythonEditorOptions } from '../src/utils/pythonEditorOptions';
import { registerPythonCompletionProvider } from '../src/utils/pythonCompletions';
import '../src/index.css';

// Test-only override: exercise both renderer branches without pretending that
// desktop Chromium has become iOS. Production uses the real media query.
const nativeMatchMedia = window.matchMedia.bind(window);
const media = new EventTarget();
media.matches = new URLSearchParams(location.search).get('editor') !== 'desktop';
window.matchMedia = query => query === MOBILE_EDITOR_QUERY ? media : nativeMatchMedia(query);
const initial = 'for i in range(3):\n    print(i)';
const mountMonaco = (editor, monaco) => {
  const provider = registerPythonCompletionProvider(monaco);
  editor.onDidDispose(() => provider.dispose());
};

function EditorFixture() {
  const [code, setCode] = useState(() => localStorage.getItem('editor-fixture-draft') ?? initial);
  const [mobile, setMobile] = useState(media.matches);
  const [autocomplete, setAutocomplete] = useState(true);
  const [light, setLight] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [changes, setChanges] = useState(0);
  const [markdown, setMarkdown] = useState('# Lecție\n\nText **bold**.');
  const update = value => { setCode(value); setChanges(n => n + 1); localStorage.setItem('editor-fixture-draft', value); };
  return <main className="mx-auto max-w-3xl space-y-4 p-4">
    <h1>Responsive editor validation</h1>
    <p>Normal page text for selection and copy.</p>
    <div className="flex flex-wrap gap-4">
      <button onClick={() => { media.matches = !media.matches; media.dispatchEvent(new Event('change')); setMobile(media.matches); }}>Use {mobile ? 'Monaco' : 'CodeMirror'}</button>
      <label><input type="checkbox" checked={autocomplete} onChange={e => setAutocomplete(e.target.checked)} />Autocomplete</label>
      <label><input type="checkbox" checked={light} onChange={e => setLight(e.target.checked)} />Light</label>
      <label><input type="checkbox" checked={readOnly} onChange={e => setReadOnly(e.target.checked)} />Read only</label>
      <button onClick={() => setCode(initial)}>Reset code</button>
    </div>
    <Editor value={code} onChange={update} height={220} language="python" theme={light ? 'light' : 'vs-dark'} autocompleteEnabled={autocomplete} onMount={mountMonaco} options={{ ...pythonEditorOptions, ariaLabel: 'Test Python', readOnly, quickSuggestions: autocomplete }} />
    <output aria-label="Change count">{changes}</output>
    <pre aria-label="Shared value">{JSON.stringify(code)}</pre>
    <label>Clipboard scratchpad<textarea aria-label="Clipboard scratchpad" className="block h-24 w-full border" /></label>
    <Editor value={markdown} onChange={setMarkdown} language="markdown" height={160} options={{ ariaLabel: 'Test Markdown', wordWrap: 'on' }} />
    <RunnableCodeBlock initialCode={'print("first block")'} />
    <RunnableCodeBlock initialCode={'print("second block")'} />
  </main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><EditorFixture /></StrictMode>);
