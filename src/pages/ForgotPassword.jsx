import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { supabase } from '../supabaseClient';
import { getAuthErrorMessage } from '../utils/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage({ text: 'Introdu o adresă de email validă.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setMessage({
        text: 'Dacă există un cont asociat acestei adrese, vei primi în scurt timp un email cu instrucțiuni pentru resetarea parolei. Verifică și folderul Spam.',
        type: 'success',
      });
    } catch (error) {
      setMessage({ text: getAuthErrorMessage(error, 'Nu am putut trimite linkul de resetare. Încearcă din nou.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Ți-ai uitat parola?" subtitle="Introdu adresa de email asociată contului tău și îți vom trimite un link pentru resetarea parolei.">
      {message.text && <div className={`mb-5 rounded-xl border p-3 text-sm font-medium ${message.type === 'error' ? 'border-hard/20 bg-hard/10 text-hard' : 'border-easy/20 bg-easy/10 text-easy'}`}>{message.text}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-text-main">Email</span>
          <span className="relative block"><Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nume@exemplu.ro" autoComplete="email" required className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-text-main outline-none transition-colors focus:border-accent" /></span>
        </label>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-ink transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {loading ? 'Se trimite...' : 'Trimite linkul de resetare'}
        </button>
      </form>
      <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-text-main"><ArrowLeft className="h-4 w-4" />Înapoi la autentificare</Link>
    </AuthLayout>
  );
}
