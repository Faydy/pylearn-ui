import { ArrowLeft, CheckCircle2, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { supabase } from '../supabaseClient';
import {
  clearPendingVerificationEmail,
  getAuthErrorMessage,
  getPendingVerificationEmail,
  rememberPendingVerificationEmail,
} from '../utils/auth';
import { isEmailVerified, isProfileComplete } from '../utils/profile';

const RESEND_COOLDOWN_SECONDS = 45;

export default function VerifyEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profile, refreshAuth } = useAuth();
  const [email, setEmail] = useState(() => state?.email || getPendingVerificationEmail());
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (state?.email) rememberPendingVerificationEmail(state.email);
  }, [state?.email]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const intervalId = window.setInterval(() => setCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldown]);

  useEffect(() => {
    if (!user || !isEmailVerified(user)) return;
    clearPendingVerificationEmail();
    navigate(isProfileComplete(profile, user) ? '/' : '/creare-profil', { replace: true });
  }, [navigate, profile, user]);

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage({ text: 'Introdu adresa de email folosită la înscriere.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/creare-profil` },
      });
      if (error) throw error;

      rememberPendingVerificationEmail(normalizedEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage({ text: 'Emailul de verificare a fost retrimis. Verifică și folderul Spam.', type: 'success' });
    } catch (error) {
      setMessage({ text: getAuthErrorMessage(error, 'Nu am putut retrimite emailul. Încearcă din nou.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) {
      setMessage({ text: 'Deschide linkul din email, apoi vei fi redirecționat automat în aplicație.', type: 'error' });
      return;
    }

    setRefreshing(true);
    setMessage({ text: '', type: '' });
    try {
      const refreshedUser = await refreshAuth();
      setMessage({
        text: isEmailVerified(refreshedUser) ? 'Email confirmat. Continuăm configurarea profilului.' : 'Emailul nu este confirmat încă. Verifică inbox-ul și încearcă din nou.',
        type: isEmailVerified(refreshedUser) ? 'success' : 'error',
      });
    } catch (error) {
      setMessage({ text: getAuthErrorMessage(error, 'Nu am putut verifica starea emailului.'), type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AuthLayout title="Verifică-ți adresa de email" subtitle="Deschide emailul și apasă linkul de confirmare pentru a-ți activa contul.">
      {message.text && <div className={`mb-5 rounded-xl border p-3 text-sm font-medium ${message.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>{message.text}</div>}
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-sm text-muted">Ți-am trimis un link de confirmare la:</p>
        <div className="mt-3 flex items-center gap-2 text-text-main"><Mail className="h-5 w-5 shrink-0 text-accent" /><span className="truncate font-bold">{email || 'adresa folosită la înscriere'}</span></div>
      </div>
      {!email && <label className="mt-5 block"><span className="mb-2 block text-sm font-bold text-text-main">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nume@exemplu.ro" autoComplete="email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-main outline-none transition-colors focus:border-accent" /></label>}
      <button type="button" onClick={handleResend} disabled={loading || cooldown > 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        {cooldown > 0 ? `Poți retrimite în ${cooldown}s` : 'Retrimite emailul'}
      </button>
      <button type="button" onClick={handleRefresh} disabled={refreshing} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50">
        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Am verificat emailul
      </button>
      <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la autentificare</Link>
    </AuthLayout>
  );
}
