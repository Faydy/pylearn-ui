import { createClient } from '@supabase/supabase-js';

// Extragem variabilele din fișierul .env (Vite folosește import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Dacă variabilele lipsesc, aruncăm o eroare clară ca să știm imediat de ce nu merge
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Lipsesc variabilele de mediu pentru Supabase! Verifică fișierul .env.local");
}

// Creăm și exportăm "clientul" pe care îl vom folosi în restul aplicației
export const supabase = createClient(supabaseUrl, supabaseAnonKey);