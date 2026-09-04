import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

// Creăm Contextul
const AuthContext = createContext({});

async function fetchProfileRecord(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// Aceasta este componenta care va "îmbrățișa" toată aplicația
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (session) => {
      if (!isMounted) return;

      setLoading(true);
      setUser(session?.user || null);

      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await fetchProfileRecord(session.user.id);
        if (isMounted) setProfile(nextProfile);
      } catch (error) {
        console.error('Eroare la încărcarea profilului:', error.message);
        if (isMounted) setProfile(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await syncAuthState(session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted && event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (isMounted && event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      syncAuthState(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuth = async () => {
    const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
    if (error) throw error;

    setUser(refreshedUser || null);

    if (!refreshedUser) {
      setProfile(null);
      return null;
    }

    const nextProfile = await fetchProfileRecord(refreshedUser.id);
    setProfile(nextProfile);
    return refreshedUser;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isPasswordRecovery, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Creăm un "Hook" personalizat
export const useAuth = () => {
  return useContext(AuthContext);
};
