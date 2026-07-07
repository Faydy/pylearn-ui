import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Trophy, LogOut, Save, Loader2, Flame, Award } from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [username, setUsername] = useState('');
  const [mesaj, setMesaj] = useState({ text: '', type: '' });

  useEffect(() => {
    async function aduDateleProfilului() {
      try {
        // 1. Aflăm cine este utilizatorul logat (pentru adresa de email)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserAuth(user);

        // 2. Căutăm profilul lui public în tabela 'profiles'
        let { data: profil, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // PLASĂ DE SIGURANȚĂ: Dacă profilul nu există încă (eroare PGRST116), îl creăm noi
        if (error && error.code === 'PGRST116') {
          const numeTemporar = `user_${user.id.substring(0, 5)}`;
          const { data: profilNou, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, username: numeTemporar }])
            .select()
            .single();
            
          if (insertError) throw insertError;
          profil = profilNou;
        } else if (error) {
          throw error;
        }

        setProfileData(profil);
        setUsername(profil.username || '');
      } catch (error) {
        console.error("Eroare la încărcarea profilului:", error.message);
      } finally {
        setLoading(false);
      }
    }

    aduDateleProfilului();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMesaj({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username })
        .eq('id', userAuth.id);

      if (error) throw error;
      
      setMesaj({ text: 'Profil actualizat cu succes!', type: 'success' });
    } catch (error) {
      setMesaj({ text: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    // Această funcție va șterge automat sesiunea
    // App.jsx va detecta asta instantaneu și te va arunca pe pagina de Login!
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main">Profilul Meu</h1>
        <p className="text-muted mt-2">Gestionează datele contului și preferințele tale.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PARTEA STÂNGĂ: Formularul de editare */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          <div className="bg-ink border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Informații Personale
            </h2>

            {mesaj.text && (
              <div className={`p-3 rounded-lg mb-6 text-sm font-medium border ${
                mesaj.type === 'error' ? 'bg-hard/10 text-hard border-hard/20' : 'bg-easy/10 text-easy border-easy/20'
              }`}>
                {mesaj.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="flex flex-col gap-5">
              
              {/* Câmp Email (Doar citire, nu se poate modifica de aici) */}
              <div>
                <label className="block text-sm font-bold text-muted mb-2">Adresă Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={userAuth?.email || ''}
                    disabled
                    className="w-full bg-background border border-border text-muted rounded-xl pl-10 pr-4 py-2.5 opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Câmp Username (Editabil) */}
              <div>
                <label className="block text-sm font-bold text-muted mb-2">Nume de Utilizator</label>
                <div className="relative">
                  <User className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-background border border-border text-text-main rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={saving || username === profileData?.username}
                  className="cursor-pointer bg-accent text-ink font-bold py-2.5 px-6 rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvează Modificările
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* PARTEA DREAPTĂ: Statistici și Acțiuni */}
        <div className="flex flex-col gap-6">
          
          {/* Card Statistici (ReadOnly) */}
          <div className="bg-ink border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-main mb-4">Statistici</h2>
            
            <div className="flex flex-col gap-4">
              <div className="bg-background rounded-xl p-4 border border-border flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-lg text-accent">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted font-bold uppercase tracking-wider">Experiență Totală</p>
                  <p className="text-xl font-bold text-text-main">{profileData?.total_xp || 0} XP</p>
                </div>
              </div>

              <div className="bg-background rounded-xl p-4 border border-border flex items-center gap-4">
                <div className="bg-medium/10 p-3 rounded-lg text-medium">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted font-bold uppercase tracking-wider">Streak Curent</p>
                  <p className="text-xl font-bold text-text-main">{profileData?.current_streak || 0} Zile</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Danger Zone (Logout) */}
          <div className="bg-ink border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-main mb-2">Contul Meu</h2>
            <p className="text-xs text-muted mb-4">Deloghează-te în siguranță de pe acest dispozitiv.</p>
            
            <button
              onClick={handleLogout}
              className="cursor-pointer w-full flex items-center justify-center gap-2 text-hard border border-hard hover:bg-hard/10 font-bold py-2.5 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Ieși din cont
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}