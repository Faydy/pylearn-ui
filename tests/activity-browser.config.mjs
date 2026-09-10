import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Isolated browser fixture: no credentials and no requests to real Supabase.
export default defineConfig({
  plugins: [{
    name: 'activity-browser-fixtures',
    enforce: 'pre',
    resolveId(source) {
      if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/activity-supabase.js', import.meta.url));
      if (source.endsWith('/AuthContext')) return fileURLToPath(new URL('./fixtures/activity-auth.js', import.meta.url));
    },
  }, react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5175, strictPort: true },
});
