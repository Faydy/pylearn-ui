import { useEffect, useState } from 'react';
import { FolderGit, Loader2, Lock, Mail } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './components/auth/AuthLayout';
import { supabase } from './supabaseClient';
import { getAuthErrorMessage, isUnverifiedEmailError, rememberPendingVerificationEmail } from './utils/auth';

export default function Auth({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(() => location.state?.successMessage
    ? { text: location.state.successMessage, type: 'success' }
    : { text: '', type: '' });
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  useEffect(() => {
    setIsLogin(initialMode !== 'register');
    setMessage(location.state?.successMessage
      ? { text: location.state.successMessage, type: 'success' }
      : { text: '', type: '' });
    setUnverifiedEmail('');
  }, [initialMode, location.state?.successMessage]);

  const handleAuth = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    setUnverifiedEmail('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        return;
      }

      if (password.length < 8) throw new Error('password should be at least 8 characters');
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/creare-profil` },
      });
      if (error) throw error;

      if (data.session) {
        navigate('/creare-profil', { replace: true });
        return;
      }

      rememberPendingVerificationEmail(normalizedEmail);
      navigate('/verify-email', { replace: true, state: { email: normalizedEmail } });
    } catch (error) {
      if (isLogin && isUnverifiedEmailError(error)) {
        rememberPendingVerificationEmail(normalizedEmail);
        setUnverifiedEmail(normalizedEmail);
      }
      setMessage({ text: getAuthErrorMessage(error), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/creare-profil` },
      });
      if (error) throw error;
    } catch (error) {
      setMessage({ text: getAuthErrorMessage(error, 'Autentificarea nu a putut fi inițiată.'), type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={isLogin ? 'Bine ai revenit!' : 'Creează un cont nou'} subtitle={isLogin ? 'Continuă să înveți și să rezolvi probleme.' : 'Începe-ți călătoria pe PyLearn.'}>
      {message.text && <div className={`mb-6 rounded-lg border p-3 text-sm font-medium ${message.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>{message.text}</div>}
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <label className="relative block"><Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type="email" placeholder="Adresa de email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-text-main outline-none transition-colors focus:border-accent" required /></label>
        <div>
          <label className="relative block"><Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type="password" placeholder="Parola" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-text-main outline-none transition-colors focus:border-accent" required /></label>
          {isLogin && <button type="button" onClick={() => navigate('/forgot-password')} className="mt-2 ml-auto block w-fit text-xs font-bold text-muted transition-colors hover:text-accent">Ai uitat parola?</button>}
          {!isLogin && <p className="mt-2 text-xs text-muted">Parola trebuie să aibă minimum 8 caractere.</p>}
        </div>
        <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">{isLoading && <Loader2 className="h-5 w-5 animate-spin" />}{isLogin ? 'Intră în cont' : 'Creează cont'}</button>
      </form>
      {unverifiedEmail && <button type="button" onClick={() => navigate('/verify-email', { state: { email: unverifiedEmail } })} className="mt-4 text-sm font-bold text-accent transition-colors hover:text-text-main">Retrimite emailul de verificare</button>}
      <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-sm"><span className="bg-ink px-4 font-medium text-muted">sau continuă cu</span></div></div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4"><button type="button" onClick={() => handleSocialLogin('google')} disabled={isLoading} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50"><span className="text-xl">G</span>Google</button><button type="button" onClick={() => handleSocialLogin('github')} disabled={isLoading} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 font-bold text-text-main transition-colors hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50"><FolderGit className="h-5 w-5" />GitHub</button></div>
      <div className="mt-8 text-center"><button type="button" onClick={() => navigate(isLogin ? '/register' : '/login')} className="text-sm text-muted transition-colors hover:text-text-main">{isLogin ? 'Nu ai cont? Înregistrează-te' : 'Ai deja cont? Loghează-te'}</button></div>
    </AuthLayout>
  );
}
