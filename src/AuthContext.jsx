import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

// Creăm Contextul
const AuthContext = createContext({});

// Aceasta este componenta care va "îmbrățișa" toată aplicația
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // <-- NOU: Aici salvăm datele din tabelul profiles
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Funcție separată pentru a aduce profilul
    const fetchProfile = async (userId) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    };

    // Verificăm sesiunea curentă la încărcarea paginii
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      // Dacă avem un user logat, îi aducem și profilul
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    };
    
    checkSession();

    // Ascultăm schimbările (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      
      // Când cineva se loghează, aducem profilul. Când dă logout, îl ștergem.
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    // NOU: Am adăugat `profile` în valoarea exportată
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Creăm un "Hook" personalizat
export const useAuth = () => {
  return useContext(AuthContext);
};