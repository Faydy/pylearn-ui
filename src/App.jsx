import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

import { isProfileComplete } from './utils/profile';

const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Teorie = lazy(() => import('./pages/Teorie'));
const TeorieClasa = lazy(() => import('./pages/TeorieClasa'));
const TeorieSectiune = lazy(() => import('./pages/TeorieSectiune'));
const TeorieCapitol = lazy(() => import('./pages/TeorieCapitol'));
const TeorieLectie = lazy(() => import('./pages/TeorieLectie'));
const Probleme = lazy(() => import('./pages/Probleme'));
const Scoruri = lazy(() => import('./pages/Scoruri'));
const Profile = lazy(() => import('./pages/Profile'));
const SolutiiTrimise = lazy(() => import('./pages/SolutiiTrimise'));
const RezolvareProblema = lazy(() => import('./pages/RezolvareProblema'));
const Capitole = lazy(() => import('./pages/Capitole'));
const ToateProblemele = lazy(() => import('./pages/ToateProblemele'));
const ProblemeSectiune = lazy(() => import('./pages/ProblemeSectiune'));
const Teme = lazy(() => import('./pages/Teme'));
const TemaDetalii = lazy(() => import('./pages/TemaDetalii'));
const TemaElevDetalii = lazy(() => import('./pages/TemaElevDetalii'));
const SolutieTemaElev = lazy(() => import('./pages/SolutieTemaElev'));
const EditorTema = lazy(() => import('./pages/EditorTema'));
const Clase = lazy(() => import('./pages/Clase'));
const DetaliiClasa = lazy(() => import('./pages/DetaliiClasa'));
const Anunturi = lazy(() => import('./pages/Anunturi'));
const Notificari = lazy(() => import('./pages/Notificari'));
const Shop = lazy(() => import('./pages/Shop'));
const Auth = lazy(() => import('./Auth'));
const CreareProfil = lazy(() => import('./CreareProfil'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TheoryDev = import.meta.env.VITE_ENABLE_THEORY_DEV_TOOLS === 'true'
  ? lazy(() => import('./pages/TheoryDev')) : null;

function RouteFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );
}

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
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {TheoryDev && <Route path="/dev/teorie" element={<TheoryDev />} />}
          <Route path="/login" element={user ? <Navigate to={authenticatedDestination} replace /> : <Auth initialMode="login" />} />
          <Route path="/register" element={user ? <Navigate to={authenticatedDestination} replace /> : <Auth initialMode="register" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/creare-profil"
            element={user ? (profileComplete ? <Navigate to="/" replace /> : <CreareProfil />) : <Navigate to="/login" replace />}
          />

          {/* Pagini publice: pot fi explorate și fără cont. */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teorie" element={<Teorie />} />
            <Route path="/teorie/clasa/:gradeId" element={<TeorieClasa />} />
            <Route path="/teorie/clasa/:gradeId/sectiune/:sectionName" element={<TeorieSectiune />} />
            <Route path="/teorie/capitol/:chapterId" element={<TeorieCapitol />} />
            <Route path="/teorie/:theoryId" element={<TeorieLectie />} />

            <Route path="/probleme" element={<Probleme />} />
            <Route path="/probleme/clasa/:gradeId" element={<Capitole />} />
            <Route path="/probleme/capitol/:chapterId" element={<ProblemeSectiune />} />
            <Route path="/probleme/toate" element={<ToateProblemele />} />
            <Route path="/probleme/clasa/:gradeId/sectiune/:sectionName" element={<Capitole />} />

            <Route path="/rezolvare/:id" element={<RezolvareProblema />} />
            <Route path="/scoruri" element={<Scoruri />} />
            <Route path="/anunturi" element={<Anunturi />} />
            <Route path="/notificari" element={user ? <Notificari /> : <Navigate to="/login" replace />} />
            <Route path="/shop" element={user ? (profileComplete ? <Shop /> : <Navigate to="/creare-profil" replace />) : <Navigate to="/login" replace />} />
            <Route path="/teme" element={<Teme />} />
            <Route path="/teme/toate" element={<Teme showAll />} />
            <Route path="/teme/noua" element={<EditorTema />} />
            <Route path="/teme/:assignmentId/edit" element={<EditorTema />} />
            <Route path="/teme/:assignmentId/elev/:studentId/problema/:problemId" element={<SolutieTemaElev />} />
            <Route path="/teme/:assignmentId/elev/:studentId" element={<TemaElevDetalii />} />
            <Route path="/teme/:assignmentId" element={<TemaDetalii />} />
            <Route path="/clase" element={<Clase />} />
            <Route path="/clase/:classId" element={<DetaliiClasa />} />

            <Route
              path="/profil"
              element={user ? (profileComplete ? <Profile /> : <Navigate to="/creare-profil" replace />) : <Navigate to="/login" replace />}
            />
            <Route
              path="/profil/solutii"
              element={user ? (profileComplete ? <SolutiiTrimise /> : <Navigate to="/creare-profil" replace />) : <Navigate to="/login" replace />}
            />
            <Route
              path="/profil/:userId"
              element={user ? (profileComplete ? <Profile /> : <Navigate to="/creare-profil" replace />) : <Navigate to="/login" replace />}
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
