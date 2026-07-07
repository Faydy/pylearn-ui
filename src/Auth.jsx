import { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, Loader2, FolderGit, Folder } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mesaj, setMesaj] = useState({ text: '', type: '' });

  // Funcția originală pentru Email/Parolă
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMesaj({ text: '', type: '' });

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMesaj({ text: 'Verifică email-ul pentru a confirma contul!', type: 'success' });
      }
    } catch (error) {
      setMesaj({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // NOU: Funcția pentru autentificare cu Google/GitHub
  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setMesaj({ text: '', type: '' });
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        // Opțional: poți forța întoarcerea pe o anumită pagină după logare
        // options: { redirectTo: 'http://localhost:5173/' }
      });
      if (error) throw error;
    } catch (error) {
      setMesaj({ text: error.message, type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-ink border border-border w-full max-w-md p-8 rounded-2xl shadow-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-main mb-2">pyLearn</h1>
          <p className="text-muted">{isLogin ? 'Bine ai revenit!' : 'Creează un cont nou'}</p>
        </div>

        {mesaj.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm font-medium border ${
            mesaj.type === 'error' ? 'bg-hard/10 text-hard border-hard/20' : 'bg-easy/10 text-easy border-easy/20'
          }`}>
            {mesaj.text}
          </div>
        )}

        {/* 1. Formularul standard (Email/Parolă) */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="Adresa de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border text-text-main rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="Parola"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isLogin ? 'Intră în cont' : 'Creează cont'}
          </button>
        </form>

        {/* 2. Separatorul vizual */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-ink text-muted font-medium">sau continuă cu</span>
          </div>
        </div>

        {/* 3. Butoanele pentru Social Login */}
        <div className="flex gap-4">
          {/* Buton Google (Folosim un text simplu cu 'G' stilizat dacă nu ai un SVG extern pregătit) */}
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-background border border-border hover:bg-sidebar-hover text-text-main font-bold py-2.5 rounded-xl transition-colors"
          >
            <span className="text-xl">G</span>
            Google
          </button>

          {/* Buton GitHub (Lucide React are deja iconița) */}
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-background border border-border hover:bg-sidebar-hover text-text-main font-bold py-2.5 rounded-xl transition-colors"
          >
            <FolderGit className="w-5 h-5" />
            GitHub
          </button>
        </div>

        {/* 4. Comutatorul Login/Register */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted hover:text-text-main transition-colors"
          >
            {isLogin ? 'Nu ai cont? Înregistrează-te' : 'Ai deja cont? Loghează-te'}
          </button>
        </div>

      </div>
    </div>
  );
}