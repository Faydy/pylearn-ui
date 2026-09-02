import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, LogOut, Save, Loader2, Flame, Award, Users } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { AVATAR_OPTIONS, getAvatarUrl, normalizeProfileRole, PROFILE_ROLES } from '../utils/profile';
import { normalizeUsername } from '../utils/username';

export default function Profile() {
  const { refreshAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('');
  const [mesaj, setMesaj] = useState({ text: '', type: '' });
  const normalizedPreview = normalizeUsername(username);

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
        setAvatar(profil.avatar || user.user_metadata?.avatar || '');
        setRole(normalizeProfileRole(profil.role || user.user_metadata?.role || ''));
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
      const normalizedUsername = normalizeUsername(username);

      if (normalizedUsername.length < 3) {
        throw new Error('Username-ul trebuie să aibă minim 3 caractere.');
      }

      if (!avatar) {
        throw new Error('Alege un avatar.');
      }

      if (!PROFILE_ROLES.some((option) => option.value === role)) {
        throw new Error('Alege rolul tău.');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: normalizedUsername, avatar, role })
        .eq('id', userAuth.id);

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Acest username este deja luat. Te rugăm să alegi altul.');
        }
        throw profileError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar, role },
      });
      if (metadataError) {
        throw new Error(`Datele profilului au fost salvate, dar avatarul nu a putut fi actualizat. ${metadataError.message}`);
      }
      
      setUsername(normalizedUsername);
      setProfileData((currentProfile) => (
        currentProfile
          ? { ...currentProfile, username: normalizedUsername, avatar, role }
          : currentProfile
      ));
      const refreshedUser = await refreshAuth();
      setUserAuth(refreshedUser);
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
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main sm:text-3xl">Profilul Meu</h1>
        <p className="text-muted mt-2">Gestionează datele contului și preferințele tale.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PARTEA STÂNGĂ: Formularul de editare */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          <div className="rounded-2xl border border-border bg-ink p-4 sm:p-6">
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
                <p className="text-xs text-muted mt-2">
                  Poți scrie cu spații și litere mari. La salvare, username-ul devine lowercase și spațiile se transformă în `_`.
                </p>
                {normalizedPreview && (
                  <p className="text-xs text-accent mt-1">
                    Va fi salvat ca: <span className="font-mono">{normalizedPreview}</span>
                  </p>
                )}
              </div>

              <fieldset>
                <legend className="mb-3 block text-sm font-bold text-muted">Avatar</legend>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {AVATAR_OPTIONS.map((seed) => {
                    const selected = avatar === seed;

                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setAvatar(seed)}
                        aria-label={`Alege avatarul ${seed}`}
                        aria-pressed={selected}
                        className={`rounded-xl border p-2 transition-all ${selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border bg-background hover:border-muted'}`}
                      >
                        <img src={getAvatarUrl(seed)} alt="" className="aspect-square w-full rounded-lg bg-sidebar" />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-muted"><Users className="h-4 w-4 text-accent" /> Rolul tău</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PROFILE_ROLES.map((option) => {
                    const selected = role === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        aria-pressed={selected}
                        className={`rounded-xl border p-4 text-left transition-all ${selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border bg-background hover:border-muted'}`}
                      >
                        <span className="block font-bold text-text-main">{option.label}</span>
                        <span className="mt-1 block text-xs text-muted">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    saving
                    || (
                      normalizedPreview === profileData?.username
                      && avatar === (profileData?.avatar || userAuth?.user_metadata?.avatar || '')
                      && role === normalizeProfileRole(profileData?.role || userAuth?.user_metadata?.role || '')
                    )
                  }
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
