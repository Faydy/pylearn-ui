import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Copy, RotateCcw } from 'lucide-react';
import TopHeader from '../components/MainArea/TopHeader';
import TheoryPreview from '../components/theory/TheoryPreview';
import { pythonEditorOptions } from '../utils/pythonEditorOptions';
import { lessonUpdateSql, THEORY_DRAFT_KEY, THEORY_STARTER } from '../utils/theoryAuthoring';

function loadDraft() {
  try { return { source: localStorage.getItem(THEORY_DRAFT_KEY) ?? THEORY_STARTER, error: '' }; }
  catch { return { source: THEORY_STARTER, error: 'Stocarea locală nu este disponibilă. Copiază Markdown înainte de a închide pagina.' }; }
}
const editorTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'vs-dark';

export default function TheoryDev() {
  const [draft, setDraft] = useState(loadDraft);
  const [preview, setPreview] = useState(draft.source);
  const [theme, setTheme] = useState(editorTheme);
  const [lessonId, setLessonId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [resetVersion, setResetVersion] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const copyVersion = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setPreview(draft.source), 200);
    return () => clearTimeout(timer);
  }, [draft.source]);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(editorTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const updateSource = (source) => {
    let error = '';
    // Save immediately so even a refresh during the preview debounce keeps the draft.
    try { localStorage.setItem(THEORY_DRAFT_KEY, source); }
    catch { error = 'Draftul nu a putut fi salvat local. Copiază Markdown înainte de a închide pagina.'; }
    copyVersion.current += 1;
    setDraft({ source, error });
    setFeedback(null);
  };

  const copy = async (sql = false) => {
    const version = ++copyVersion.current;
    try {
      const text = sql ? lessonUpdateSql(draft.source, lessonId) : draft.source;
      await navigator.clipboard.writeText(text);
      if (copyVersion.current === version) setFeedback({ error: false, text: sql ? 'SQL copiat. Nu a fost executat.' : 'Markdown copiat' });
    } catch (error) {
      if (copyVersion.current === version) setFeedback({ error: true, text: error.message?.startsWith('Introdu un ID') ? error.message : 'Nu am putut copia. Selectează textul în editor și copiază-l manual.' });
    }
  };

  const reset = () => {
    setConfirmReset(false);
    let error = '';
    try { localStorage.removeItem(THEORY_DRAFT_KEY); }
    catch { error = 'Draftul vechi nu a putut fi șters din stocarea locală.'; }
    copyVersion.current += 1;
    setDraft({ source: THEORY_STARTER, error });
    setPreview(THEORY_STARTER);
    setResetVersion((version) => version + 1);
    setFeedback({ error: false, text: 'Template restaurat' });
  };

  return <div className="flex min-h-dvh min-w-0 flex-col bg-background text-text-main">
    <TopHeader title="Editor lecție" />
    <main className="isolate min-w-0 flex-1 p-4 sm:p-6">
      <div className="mx-auto min-w-0 max-w-[100rem]">
        <Link to="/teorie" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-accent"><ArrowLeft className="h-4 w-4" />Înapoi la teorie</Link>
        <h1 className="text-2xl font-bold">Editor lecție</h1>
        <p className="mt-2 text-sm text-muted">Draft local · Previzualizarea folosește renderer-ul real PyLearn. Copiază textul în <code>theory_lessons.content</code>.</p>
        <div className="my-5 flex flex-wrap items-end gap-3">
          <button type="button" onClick={() => copy()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-accent/90"><Copy className="h-4 w-4" />Copiază Markdown</button>
          <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold hover:border-accent"><RotateCcw className="h-4 w-4" />Resetează</button>
          <label className="block min-w-0 text-xs text-muted">ID lecție (pentru SQL)<input aria-label="ID lecție" inputMode="numeric" value={lessonId} onChange={(event) => setLessonId(event.target.value)} placeholder="123" className="mt-1 block min-h-11 w-40 max-w-full rounded-xl border border-border bg-ink px-3 text-sm text-text-main outline-accent" /></label>
          <button type="button" onClick={() => copy(true)} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-bold hover:border-accent">Copiază pentru SQL</button>
        </div>
        {confirmReset && <div role="alertdialog" aria-labelledby="reset-draft-title" aria-describedby="reset-draft-description" className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <h2 id="reset-draft-title" className="font-bold">Resetezi draftul?</h2>
          <p id="reset-draft-description" className="mt-2 text-sm text-muted">Draftul local va fi șters și înlocuit cu template-ul. Copiază lecția înainte dacă vrei să o păstrezi.</p>
          <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setConfirmReset(false)} className="min-h-11 rounded-lg border border-border px-3 text-sm font-bold">Păstrează draftul</button><button type="button" onClick={reset} className="min-h-11 rounded-lg bg-accent px-3 text-sm font-bold text-ink">Confirmă resetarea</button></div>
        </div>}
        {feedback && <p role="status" className={`mb-4 text-sm ${feedback.error ? 'text-hard' : 'text-easy'}`}>{feedback.text}</p>}
        {draft.error && <p role="alert" className="mb-4 text-sm text-hard">{draft.error}</p>}
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <section aria-label="Markdown" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-ink">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"><h2 className="font-bold">Markdown</h2><span className="text-xs text-muted">{draft.source.split('\n').length} linii · {draft.source.length} caractere</span></div>
            <div className="h-[55dvh] min-h-80 lg:h-[calc(100dvh-20rem)] lg:min-h-[28rem]">
              <Editor key={resetVersion} height="100%" language="markdown" theme={theme} value={draft.source} onChange={(value) => updateSource(value ?? '')} loading={<span className="text-sm text-muted">Se încarcă editorul…</span>} options={{ ...pythonEditorOptions, lineNumbers: 'on', minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true, lineNumbersMinChars: 3, ariaLabel: 'Sursa Markdown a lecției', tabSize: 4, detectIndentation: false }} />
            </div>
          </section>
          <section aria-label="Preview" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-ink">
            <div className="border-b border-border px-4 py-3"><h2 className="font-bold">Preview</h2></div>
            <div className="min-w-0 overflow-auto lg:h-[calc(100dvh-20rem)] lg:min-h-[28rem]">
              <div className="mx-auto min-w-0 max-w-3xl p-5 sm:p-8"><TheoryPreview key={resetVersion} markdown={preview} /></div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
