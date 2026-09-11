import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TheoryContent from '../src/components/theory/TheoryContent';
import RezolvareProblema from '../src/pages/RezolvareProblema';
import '../src/index.css';

const markdown = [
  '# Structura de decizie', '',
  'Instrucțiunea `if` execută un bloc doar dacă o condiție este **adevărată**. Text *italic* și [link](https://example.com).', '',
  '```python run', 'varsta = 16', '', 'if varsta >= 18:', '    print("Major")', 'else:', '    print("Minor")', '```', '',
  'Modifică valoarea variabilei `varsta` și apasă Rulează.', '',
  '## De reținut', '', '- condiția produce `True` sau `False`', '- după `if` se pune `:`', '- codul trebuie indentat', '',
  '```python', 'print("Static example")', '```', '',
  '```python title=example run', 'print(2)', '```', '',
  'Text după bloc. $x^2$', '', '```javascript run', 'console.log("static")', '```',
].join('\n');

export default function Fixture() {
  const [mode, setMode] = useState('success');
  const [requests, setRequests] = useState([]);
  const [problem, setProblem] = useState(false);
  const [light, setLight] = useState(false);
  const [release, setRelease] = useState(null);

  // Test-only transport interception. Production code still uses the shared runCode helper.
  window.fetch = async (url, init) => {
    if (url !== '/fixture-api/run') throw new Error('Unexpected fixture request');
    setRequests((previous) => [...previous, { url, ...JSON.parse(init.body) }]);
    if (mode === 'network') throw new Error('Failed to fetch');
    if (mode === 'pending') await new Promise((resolve) => setRelease(() => resolve));
    if (mode === 'invalid') return new Response('Not JSON', { status: 502 });
    if (mode === 'runtime') return Response.json({ success: false, output: 'Traceback (most recent call last):\n  File "main.py", line 1\nZeroDivisionError: division by zero' });
    if (mode === 'backend') return Response.json({ error: 'Prea multe cereri.' }, { status: 429 });
    return Response.json({ success: true, output: mode === 'empty' ? '' : mode === 'long' ? 'x'.repeat(600) + '\n  linia 2\n' : '12\n  rezultat\n' });
  };

  return <MemoryRouter initialEntries={['/rezolvare/1']}>
    <nav className="flex flex-wrap items-center gap-3 border-b border-border p-3 text-sm">
      <label>Răspuns simulat <select aria-label="Răspuns simulat" className="bg-background" value={mode} onChange={(event) => setMode(event.target.value)}>{['success', 'empty', 'runtime', 'backend', 'network', 'invalid', 'pending', 'long'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <button onClick={() => { const next = !light; setLight(next); document.documentElement.dataset.theme = next ? 'light' : 'dark'; document.documentElement.classList.toggle('dark', !next); }}>{light ? 'Temă întunecată' : 'Temă luminoasă'}</button>
      <button onClick={() => setProblem(!problem)}>{problem ? 'Vezi teoria' : 'Vezi problema'}</button>
      {release && <button onClick={() => { release(); setRelease(null); }}>Finalizează cererea</button>}
    </nav>
    <details className="p-3"><summary>Cereri trimise ({requests.length})</summary><pre className="overflow-auto" aria-label="Cereri trimise">{JSON.stringify(requests, null, 2)}</pre></details>
    {problem ? <Routes><Route path="/rezolvare/:id" element={<RezolvareProblema />} /></Routes> : <main className="p-4 sm:p-6"><div className="mx-auto min-w-0 max-w-3xl rounded-2xl border border-border bg-ink p-5 sm:p-8"><TheoryContent content={markdown} /></div></main>}
  </MemoryRouter>;
}

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Fixture />);
