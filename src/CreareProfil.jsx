import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { User, Loader2 } from 'lucide-react';

export default function CreareProfil() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [mesaj, setMesaj] = useState({ text: '', type: '' });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Dacă nu e logat deloc, îl trimitem la login
        if (!session) {
          navigate('/login', { replace: true });
          return;
        }

        setUserId(session.user.id);

        // Verificăm doar prezența ID-ului în tabelul profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Profilul există deja! Îl redirecționăm instant pe Dashboard
          navigate('/', { replace: true }); 
        } else {
          // Profilul NU există, oprim loading-ul și îi arătăm formularul
          setCheckingProfile(false);
        }
      } catch (error) {
        console.error("Eroare la verificarea profilului:", error.message);
        setCheckingProfile(false); // Îl lăsăm să vadă formularul în caz de eroare minoră
      }
    };

    checkExistingProfile();
  }, [navigate]);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMesaj({ text: '', type: '' });

    if (username.trim().length < 3) {
      setMesaj({ text: 'Username-ul trebuie să aibă minim 3 caractere.', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: userId, username: username.trim() }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Acest username este deja luat. Te rugăm să alegi altul!');
        }
        throw error;
      }

      // La creare cu succes, trimitem spre dashboard
      navigate('/', { replace: true }); 
      
    } catch (error) {
      setMesaj({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cât timp face verificarea la baza de date, afișăm doar loader-ul
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Interfața propriu-zisă a formularului
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-ink border border-border w-full max-w-md p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-main mb-2">Ultimul pas!</h1>
          <p className="text-muted">Alege-ți un nume de utilizator pentru clasament.</p>
        </div>

        {mesaj.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm font-medium border ${
            mesaj.type === 'error' ? 'bg-hard/10 text-hard border-hard/20' : 'bg-easy/10 text-easy border-easy/20'
          }`}>
            {mesaj.text}
          </div>
        )}

        <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
          <div className="relative">
            <User className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border text-text-main rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-ink font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors flex justify-center items-center gap-2 mt-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            Finalizează profilul
          </button>
        </form>
      </div>
    </div>
  );
}