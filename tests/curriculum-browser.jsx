import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { FixtureAuthContext } from './fixtures/solved-auth';
import { requests, setViewer } from './fixtures/curriculum-supabase';
import Probleme from '../src/pages/Probleme';
import Capitole from '../src/pages/Capitole';
import ProblemeSectiune from '../src/pages/ProblemeSectiune';
import '../src/index.css';

export default function Fixture() {
  const [user, setUser] = useState({ id: 'student-a' });
  const [log, setLog] = useState('');
  return <FixtureAuthContext.Provider value={{ user, loading: false }}><BrowserRouter>
    <nav className="flex flex-wrap gap-3 border-b border-border p-3 text-sm">
      <Link to="/probleme">Start test</Link>
      <button onClick={() => { const next = user ? null : { id: 'student-a' }; setViewer(next?.id); setUser(next); }}>{user ? 'Test anonim' : 'Test autentificat'}</button>
      <button onClick={() => setLog(JSON.stringify(requests.map(({source,columns,filters}) => ({source,columns,filters})), null, 2))}>Vezi cererile</button>
    </nav>
    {log && <details className="p-3"><summary>Jurnal cereri</summary><pre aria-label="Jurnal cereri" className="max-h-60 overflow-auto text-xs">{log}</pre></details>}
    <Routes>
      <Route path="/probleme" element={<Probleme />} />
      <Route path="/probleme/clasa/:gradeId" element={<Capitole />} />
      <Route path="/probleme/clasa/:gradeId/sectiune/:sectionName" element={<Capitole />} />
      <Route path="/probleme/capitol/:chapterId" element={<ProblemeSectiune />} />
      <Route path="/rezolvare/:id" element={<p className="p-5">Problemă selectată</p>} />
    </Routes>
  </BrowserRouter></FixtureAuthContext.Provider>;
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Fixture />);
