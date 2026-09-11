import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { FixtureAuthContext } from './fixtures/solved-auth';
import ToateProblemele from '../src/pages/ToateProblemele';
import ProblemBrowser from '../src/components/problems/ProblemBrowser';
import '../src/index.css';

export default function Fixture() {
  const [user, setUser] = useState({ id: 'student-a' });
  return <FixtureAuthContext.Provider value={{ user, loading: false }}><BrowserRouter>
    <nav className="flex flex-wrap gap-3 border-b border-border p-3 text-xs">
      <Link to="/probleme/toate">Arhivă</Link>
      <Link to="/probleme/clasa/1">Clasă fixă</Link>
      <Link to="/probleme/clasa/1/sectiune/Algoritmi">Secțiune fixă</Link>
      <Link to="/probleme/capitol/1">Capitol fix</Link>
      <button onClick={() => setUser(user ? null : { id: 'student-a' })}>{user ? 'Test anonim' : 'Test autentificat'}</button>
    </nav>
    <Routes>
      <Route path="/probleme/toate" element={<ToateProblemele />} />
      <Route path="/probleme/clasa/1" element={<main className="p-4"><ProblemBrowser gradeId="1" /></main>} />
      <Route path="/probleme/clasa/1/sectiune/Algoritmi" element={<main className="p-4"><ProblemBrowser gradeId="1" section="Algoritmi" /></main>} />
      <Route path="/probleme/capitol/1" element={<main className="p-4"><ProblemBrowser chapterId="1" /></main>} />
      <Route path="/rezolvare/:id" element={<p>Problemă selectată</p>} />
    </Routes>
  </BrowserRouter></FixtureAuthContext.Provider>;
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Fixture />);
