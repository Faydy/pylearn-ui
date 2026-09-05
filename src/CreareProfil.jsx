import { useEffect, useState } from 'react';
import { CheckCircle2, Coins, Loader2, Mail, RefreshCw, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import {
  AVATAR_OPTIONS,
  getAvatarUrl,
  isEmailVerified,
  isProfileComplete,
  normalizeProfileRole,
  PROFILE_ROLES,
} from './utils/profile';
import { normalizeUsername } from './utils/username';

export default function CreareProfil() {
  const navigate = useNavigate();
  const { user, profile, refreshAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const normalizedPreview = normalizeUsername(username);
  const emailVerified = isEmailVerified(user);

  useEffect(() => {
    if (profile?.username) {
      setUsername((currentUsername) => currentUsername || profile.username);
    }

    if (profile?.avatar || user?.user_metadata?.avatar) {
      setAvatar(profile?.avatar || user.user_metadata.avatar);
    }

    if (profile?.role || user?.user_metadata?.role) {
      setRole(normalizeProfileRole(profile?.role || user.user_metadata.role));
    }
  }, [profile?.avatar, profile?.role, profile?.username, user?.user_metadata?.avatar, user?.user_metadata?.role]);

  useEffect(() => {
    if (isProfileComplete(profile, user)) {
      navigate('/', { replace: true });
    }
  }, [navigate, profile, user]);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsResending(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/creare-profil`,
        },
      });

      if (error) throw error;
      setMessage({ text: 'Am trimis un nou email de confirmare.', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshVerification = async () => {
    setIsRefreshing(true);
    setMessage({ text: '', type: '' });

    try {
      const refreshedUser = await refreshAuth();
      setMessage({
        text: isEmailVerified(refreshedUser)
          ? 'Email confirmat. Poți finaliza profilul.'
          : 'Emailul nu este confirmat încă. Verifică inbox-ul și încearcă din nou.',
        type: isEmailVerified(refreshedUser) ? 'success' : 'error',
      });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateProfile = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });

    if (!user) {
      setMessage({ text: 'Sesiunea ta a expirat. Autentifică-te din nou pentru a continua.', type: 'error' });
      return;
    }

    const normalizedUsername = normalizeUsername(username);

    if (!emailVerified) {
      setMessage({ text: 'Confirmă emailul înainte de a finaliza profilul.', type: 'error' });
      return;
    }

    if (normalizedUsername.length < 3) {
      setMessage({ text: 'Username-ul trebuie să aibă minimum 3 caractere.', type: 'error' });
      return;
    }

    if (!avatar) {
      setMessage({ text: 'Alege primul avatar.', type: 'error' });
      return;
    }

    if (!PROFILE_ROLES.some((option) => option.value === role)) {
      setMessage({ text: 'Alege rolul tău.', type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: normalizedUsername, role }, { onConflict: 'id' });

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Acest username este deja luat. Te rugăm să alegi altul.');
        }
        throw profileError;
      }

      const { data: selectedAvatar, error: selectedAvatarError } = await supabase
        .from('avatar_catalog')
        .select('id')
        .eq('seed', avatar)
        .eq('is_active', true)
        .eq('is_onboarding_choice', true)
        .maybeSingle();
      if (selectedAvatarError?.code === '42703') throw new Error('Sistemul de avatare nu este configurat încă. Aplică migrarea necesară și reîncarcă pagina.');
      if (selectedAvatarError || !selectedAvatar) throw new Error('Avatarul selectat nu este disponibil. Reîncarcă pagina și încearcă din nou.');

      const { error: avatarError } = await supabase.rpc('claim_initial_avatar', { p_avatar_id: selectedAvatar.id });
      if (avatarError) {
        console.error('Initial avatar claim failed:', avatarError);
        if (avatarError.code === 'PGRST202') throw new Error('Sistemul de alegere inițială nu este configurat încă. Aplică migrarea necesară și reîncarcă pagina.');
        if ((avatarError.message || '').includes('Ai folosit deja')) throw new Error('Ai ales deja avatarul gratuit. Poți gestiona avatarele din Shop.');
        if (avatarError.code === '42501' || /row-level security|permission denied/i.test(avatarError.message || '')) {
          throw new Error('Alegerea avatarului necesită ultima migrare a sistemului Shop. Aplică migrarea 202609050015 și reîncarcă pagina.');
        }
        if (avatarError.message) throw new Error(avatarError.message);
        throw new Error('Avatarul inițial nu a putut fi salvat. Încearcă din nou.');
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar, role },
      });

      if (metadataError) throw metadataError;

      await refreshAuth();
      navigate('/', { replace: true });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-accent">pyLearn</p>
          <h1 className="text-3xl font-bold text-text-main sm:text-4xl">Completează-ți profilul</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">Mai sunt câțiva pași până poți începe să rezolvi probleme.</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-ink shadow-xl">
          <div className="border-b border-border bg-sidebar/40 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${emailVerified ? 'bg-easy/10 text-easy' : 'bg-accent/10 text-accent'}`}>
                {emailVerified ? <CheckCircle2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-text-main">Confirmă adresa de email</h2>
                <p className="truncate text-sm text-muted">{user?.email || 'Se încarcă adresa de email...'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold sm:ml-auto ${emailVerified ? 'bg-easy/10 text-easy' : 'bg-accent/10 text-accent'}`}>
                {emailVerified ? 'Confirmat' : 'De confirmat'}
              </span>
            </div>

            {!emailVerified && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">Accesează linkul primit în inbox pentru a activa contul.</p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Retrimite emailul'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRefreshVerification}
                    disabled={isRefreshing}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Am confirmat
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateProfile} className="flex flex-col gap-8 p-6 sm:p-8">
            {message.text && (
              <div className={`rounded-xl border p-3 text-sm font-medium ${message.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>
                {message.text}
              </div>
            )}

            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-bold text-text-main">Nume de utilizator</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                <input
                  id="username"
                  type="text"
                  placeholder="Andrei1234"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-text-main outline-none transition-colors focus:border-accent"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-muted">Spațiile devin automat <span className="font-mono">_</span>, iar literele mari devin litere mici.</p>
              {normalizedPreview && (
                <p className="mt-1 text-xs text-accent">Va fi salvat ca: <span className="font-mono">{normalizedPreview}</span></p>
              )}
            </div>

            <fieldset>
              <legend className="text-lg font-bold text-text-main">Alege-ți primul avatar</legend>
              <div className="mt-3 rounded-xl border border-accent/20 bg-accent/10 p-4">
                <div className="flex items-center gap-2 font-bold text-accent"><Coins className="h-4 w-4" />Prima alegere este gratuită</div>
                <p className="mt-2 text-sm leading-6 text-muted">Poți alege gratuit un singur avatar. După crearea profilului, celelalte avatare vor putea fi deblocate din Shop folosind monede câștigate prin rezolvarea problemelor.</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AVATAR_OPTIONS.map((seed) => {
                  const selected = avatar === seed;

                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setAvatar(seed)}
                      aria-label={`Alege avatarul ${seed}`}
                      aria-pressed={selected}
                      className={`group relative rounded-xl border p-2 transition-all ${selected ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-border bg-background hover:border-muted'}`}
                    >
                      <img src={getAvatarUrl(seed)} alt="" className="aspect-square w-full rounded-lg bg-sidebar" />
                      {selected && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[10px] font-black text-ink"><CheckCircle2 className="h-3 w-3" />Selectat</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main"><Users className="h-4 w-4 text-accent" /> Rolul tău</legend>
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

            <button
              type="submit"
              disabled={isSaving || !emailVerified}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
              {avatar ? 'Creează profilul cu acest avatar' : 'Alege gratuit un avatar'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
