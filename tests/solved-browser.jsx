import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { FixtureAuthContext } from './fixtures/solved-auth';
import { fixtureProblems, statuses, simulateAccepted, requests } from './fixtures/solved-supabase';
import { solvedProblemIds } from '../src/utils/solvedProblems';
import ToateProblemele from '../src/pages/ToateProblemele';
import Probleme from '../src/pages/Probleme';
import Capitole from '../src/pages/Capitole';
import ProblemeSectiune from '../src/pages/ProblemeSectiune';
import RelatedProblems from '../src/components/theory/RelatedProblems';
import AssignmentProblemList from '../src/components/assignments/AssignmentProblemList';
import '../src/index.css';

function Practice() {
  const { id } = useParams(); const navigate = useNavigate();
  return <section className="p-4"><h1>Fixture problemă {id}</h1><button className="p-4" onClick={() => { simulateAccepted(id); navigate(-1); }}>Simulează rezolvarea confirmată și revino</button><button className="p-4" onClick={() => navigate(-1)}>Înapoi fără rezolvare</button></section>;
}
function Fixture() {
  const [user, setUser] = useState({ id: 'fixture-user' });
  const [counts, setCounts] = useState('');
  return <FixtureAuthContext.Provider value={{ user, profile: { grade_id: 1 }, loading: false }}><MemoryRouter initialEntries={['/probleme/toate']}>
    <nav className="flex flex-wrap gap-3 p-4 text-sm">
      <Link to="/probleme/toate">Arhivă</Link><Link to="/probleme">Pagina principală</Link><Link to="/probleme/clasa/1">Clasă</Link><Link to="/probleme/capitol/1">Capitol</Link><Link to="/related">Teorie</Link><Link to="/assignment">Temă elev</Link><Link to="/teacher">Temă profesor</Link>
      <button onClick={() => setUser(user ? null : { id: 'fixture-user' })}>{user ? 'Test anonim' : 'Test autentificat'}</button>
      <button onClick={() => setCounts(JSON.stringify(requests.map(({table,filters})=>({table,filters}))))}>Vezi cererile fixture</button>
    </nav><output className="block break-words text-xs">{counts}</output>
    <Routes>
      <Route path="/probleme/toate" element={<ToateProblemele />} /><Route path="/probleme" element={<Probleme />} />
      <Route path="/probleme/clasa/:gradeId" element={<Capitole />} /><Route path="/probleme/capitol/:chapterId" element={<ProblemeSectiune />} />
      <Route path="/rezolvare/:id" element={<Practice />} />
      <Route path="/related" element={<RelatedProblems problems={fixtureProblems} gradeId={1} section="Bazele programării" />} />
      <Route path="/assignment" element={<AssignmentProblemList problems={fixtureProblems} solvedIds={user ? solvedProblemIds(statuses) : undefined} />} />
      <Route path="/teacher" element={<AssignmentProblemList problems={fixtureProblems} />} />
    </Routes>
  </MemoryRouter></FixtureAuthContext.Provider>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
