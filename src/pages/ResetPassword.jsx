import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { supabase } from '../supabaseClient';
import { getAuthErrorMessage } from '../utils/auth';

function hasRecoveryMarker() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return query.get('type') === 'recovery' || hash.get('type') === 'recovery' || query.has('code');
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { isPasswordRecovery } = useAuth();
  const [recoveryStatus, setRecoveryStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (recoveryStatus === 'success') return undefined;
    let mounted = true;

    const validateRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setRecoveryStatus(session && (hasRecoveryMarker() || isPasswordRecovery) ? 'valid' : 'invalid');
    };

    validateRecoverySession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' && session) setRecoveryStatus('valid');
      if (event === 'SIGNED_OUT') setRecoveryStatus('invalid');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isPasswordRecovery, recoveryStatus]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage({ text: 'Parola trebuie să aibă minimum 8 caractere.', type: 'error' });
      return;
    }
    if (password !== confirmation) {
      setMessage({ text: 'Parolele nu coincid.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRecoveryStatus('invalid');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setRecoveryStatus('success');
      setMessage({ text: 'Parola a fost schimbată cu succes.', type: 'success' });
    } catch (error) {
      console.error('Eroare la actualizarea parolei:', error.message);
      setMessage({ text: getAuthErrorMessage(error, 'Parola nu a putut fi schimbată. Solicită un link nou.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const returnToLogin = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  if (recoveryStatus === 'checking') {
    return <AuthLayout title="Se verifică linkul..."><div className="flex justify-center py-8"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div></AuthLayout>;
  }

  if (recoveryStatus === 'invalid') {
    return <AuthLayout title="Link invalid"><div className="rounded-xl border border-hard/20 bg-hard/10 p-4 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-hard" /><p className="mt-3 font-bold text-text-main">Linkul de resetare nu mai este valid sau a expirat.</p></div><Link to="/forgot-password" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90"><KeyRound className="h-5 w-5" />Solicită un link nou</Link><Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la autentificare</Link></AuthLayout>;
  }

  if (recoveryStatus === 'success') {
    return <AuthLayout title="Parolă actualizată"><div className="rounded-xl border border-easy/20 bg-easy/10 p-4 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-easy" /><p className="mt-3 font-bold text-text-main">{message.text}</p><p className="mt-2 text-sm text-muted">Te poți autentifica folosind parola nouă.</p></div><button type="button" onClick={returnToLogin} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90">Autentifică-te</button></AuthLayout>;
  }

  return (
    <AuthLayout title="Setează o parolă nouă" subtitle="Alege o parolă de minimum 8 caractere pentru contul tău.">
      {message.text && <div className={`mb-5 rounded-xl border p-3 text-sm font-medium ${message.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>{message.text}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block"><span className="mb-2 block text-sm font-bold text-text-main">Parolă nouă</span><span className="relative block"><Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-12 text-text-main outline-none transition-colors focus:border-accent" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-text-main" aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
        <label className="block"><span className="mb-2 block text-sm font-bold text-text-main">Confirmă parola</span><span className="relative block"><Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-12 text-text-main outline-none transition-colors focus:border-accent" /><button type="button" onClick={() => setShowConfirmation((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-text-main" aria-label={showConfirmation ? 'Ascunde parola' : 'Arată parola'}>{showConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span></label>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}{loading ? 'Se schimbă...' : 'Schimbă parola'}</button>
      </form>
    </AuthLayout>
  );
}
