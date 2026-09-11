import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, Play, RotateCcw } from 'lucide-react';
import { runCode } from '../../utils/api';
import { pythonEditorOptions } from '../../utils/pythonEditorOptions';

const getEditorTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'vs-dark';

export default function RunnableCodeBlock({ initialCode, language = 'python' }) {
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState(getEditorTheme);
  const runningRef = useRef(false);
  const requestVersion = useRef(0);
  const height = Math.min(320, Math.max(100, currentCode.split('\n').length * 22 + 32));

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getEditorTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      observer.disconnect();
      requestVersion.current += 1;
    };
  }, []);

  const handleRun = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    const version = ++requestVersion.current;
    setOutput(null);
    setError('');
    setIsRunning(true);
    try {
      const result = await runCode(currentCode, '');
      if (version !== requestVersion.current) return;
      if (result.success) setOutput(result.output);
      else setError(result.output);
    } finally {
      if (version === requestVersion.current) {
        runningRef.current = false;
        setIsRunning(false);
      }
    }
  };

  const handleReset = () => {
    setCurrentCode(initialCode);
    setOutput(null);
    setError('');
  };

  return (
    <section aria-label="Exemplu Python interactiv" className="mt-6 min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-background text-sm leading-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="font-mono font-bold text-text-main">Python</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleReset} disabled={isRunning} title="Resetează codul la varianta inițială" className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-muted transition-colors hover:bg-sidebar-hover hover:text-text-main focus-visible:outline-accent disabled:opacity-50">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />Resetează
          </button>
          <button type="button" onClick={handleRun} disabled={isRunning} className="flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-3 font-bold text-ink transition-colors hover:bg-accent/90 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50">
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}Rulează
          </button>
        </div>
      </div>
      <Editor
        height={height}
        width="100%"
        language={language}
        theme={theme}
        value={currentCode}
        onChange={(value) => setCurrentCode(value ?? '')}
        loading={<span className="text-muted">Se încarcă editorul…</span>}
        options={{
          ...pythonEditorOptions,
          automaticLayout: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          lineHeight: 22,
          folding: false,
          glyphMargin: false,
          overviewRulerLanes: 0,
          scrollbar: { alwaysConsumeMouseWheel: false },
          ariaLabel: 'Cod Python editabil',
        }}
      />
      <div role="status" aria-live="polite" aria-busy={isRunning} className="min-w-0 border-t border-border px-3 py-2">
        <p className={`font-bold ${error ? 'text-hard' : 'text-text-main'}`}>{error ? 'Eroare' : 'Rezultat'}</p>
        {error || output !== null ? (
          <pre tabIndex={0} aria-label={error ? 'Eroare de execuție' : 'Rezultatul execuției'} className={`mt-1 max-h-48 max-w-full overflow-auto whitespace-pre font-mono text-sm ${error ? 'text-hard' : 'text-text-main'}`}>{error || output || '(fără rezultat)'}</pre>
        ) : <p className="text-muted">{isRunning ? 'Se execută…' : 'Apasă „Rulează” pentru a vedea rezultatul.'}</p>}
      </div>
    </section>
  );
}
