import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { FixtureAuthContext } from './fixtures/solved-auth';
import { resetFixture, setViewer, setFailure } from './fixtures/delete-classroom-supabase';
import DetaliiClasa from '../src/pages/DetaliiClasa';
import Clase from '../src/pages/Clase';
import '../src/index.css';

export default function Fixture() {
  const [user, setUser] = useState({ id: 'owner' });
  const [failure, toggleFailure] = useState(false);
  return <FixtureAuthContext.Provider value={{ user, profile: { role: user.id === 'student' ? 'elev' : 'profesor' }, loading: false }}><BrowserRouter>
    <nav className="flex flex-wrap gap-3 p-3 text-sm">
      <Link to="/clase/1" onClick={resetFixture}>Clasă de test</Link>
      {['owner', 'student', 'other'].map((id) => <button key={id} onClick={() => { setViewer(id); setUser({ id }); }}>{id === 'owner' ? 'Proprietar' : id === 'student' ? 'Elev' : 'Alt profesor'}</button>)}
      <button onClick={() => { setFailure(!failure); toggleFailure(!failure); }}>{failure ? 'Activează succesul' : 'Simulează eroare'}</button>
    </nav>
    <Routes><Route path="/clase/:classId" element={<DetaliiClasa />} /><Route path="/clase" element={<Clase />} /></Routes>
  </BrowserRouter></FixtureAuthContext.Provider>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
