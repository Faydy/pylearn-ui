import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Teorie from './pages/Teorie';
import Probleme from './pages/Probleme';
import Scoruri from './pages/Scoruri';
import Profile from './pages/Profile';
import RezolvareProblema from './pages/RezolvareProblema';
import Capitole from './pages/Capitole';
import ToateProblemele from './pages/ToateProblemele';
import ProblemeSectiune from './pages/ProblemeSectiune';
import Teme from './pages/Teme';
import TemaDetalii from './pages/TemaDetalii';
import EditorTema from './pages/EditorTema';
import Clase from './pages/Clase';
import DetaliiClasa from './pages/DetaliiClasa';

import Auth from './Auth';
import CreareProfil from './CreareProfil';
import { isProfileComplete } from './utils/profile';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const profileComplete = isProfileComplete(profile, user);
  const authenticatedDestination = profileComplete ? '/' : '/creare-profil';

  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={user ? <Navigate to={authenticatedDestination} replace /> : <Auth />} />
        <Route
          path="/creare-profil"
          element={user ? (profileComplete ? <Navigate to="/" replace /> : <CreareProfil />) : <Navigate to="/login" replace />}
        />

        {/* Pagini publice: pot fi explorate și fără cont. */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/teorie" element={<Teorie />} />

          <Route path="/probleme" element={<Probleme />} />
          <Route path="/probleme/clasa/:gradeId" element={<Capitole />} />
          <Route path="/probleme/toate" element={<ToateProblemele />} />
          <Route path="/probleme/clasa/:gradeId/sectiune/:sectionName" element={<ProblemeSectiune />} />

          <Route path="/rezolvare/:id" element={<RezolvareProblema />} />
          <Route path="/scoruri" element={<Scoruri />} />
          <Route path="/teme" element={<Teme />} />
          <Route path="/teme/noua" element={<EditorTema />} />
          <Route path="/teme/:assignmentId/edit" element={<EditorTema />} />
          <Route path="/teme/:assignmentId" element={<TemaDetalii />} />
          <Route path="/clase" element={<Clase />} />
          <Route path="/clase/:classId" element={<DetaliiClasa />} />
          
          <Route
            path="/profil"
            element={user ? (profileComplete ? <Profile /> : <Navigate to="/creare-profil" replace />) : <Navigate to="/login" replace />}
          />
          
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}
