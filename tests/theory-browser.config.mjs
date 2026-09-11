import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Real components and Monaco; isolated data and /run responses, no production writes.
export default defineConfig({
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/fixture-api') },
  plugins: [{ name: 'theory-fixtures', enforce: 'pre', resolveId(source) {
    if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/theory-supabase.js', import.meta.url));
    if (source.endsWith('/AuthContext')) return fileURLToPath(new URL('./fixtures/solved-auth.js', import.meta.url));
    if (source.endsWith('/NotificationsBell')) return fileURLToPath(new URL('./fixtures/solved-notifications.js', import.meta.url));
  } }, react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5177, strictPort: true },
});
