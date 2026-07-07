import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Teorie from './pages/Teorie';
import Probleme from './pages/Probleme';
import Scoruri from './pages/Scoruri';
import Profile from './pages/Profile';
import Auth from './Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Ruta de Login este acum independentă. Dacă e logat deja, îl trimitem pe Home */}
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Auth />} />

        {/* Toate rutele din interiorul aplicației (care au meniul lateral) */}
        <Route element={<MainLayout />}>
          
          {/* Acestea sunt Publice (merg și fără cont) */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/teorie" element={<Teorie />} />
          <Route path="/probleme" element={<Probleme />} />
          <Route path="/scoruri" element={<Scoruri />} />
          
          {/* Profilul este Protejat (dacă nu e logat, îl trimitem să se logheze) */}
          <Route path="/profil" element={session ? <Profile /> : <Navigate to="/login" replace />} />
          
        </Route>
        
        {/* Dacă scrie o adresă care nu există, îl întoarcem pe pagina principală */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}