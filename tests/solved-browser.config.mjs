import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [{ name: 'solved-fixtures', enforce: 'pre', resolveId(source) {
    if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/solved-supabase.js', import.meta.url));
    if (source.endsWith('/AuthContext')) return fileURLToPath(new URL('./fixtures/solved-auth.js', import.meta.url));
    if (source.endsWith('/NotificationsBell')) return fileURLToPath(new URL('./fixtures/solved-notifications.js', import.meta.url));
  } }, react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5176, strictPort: true },
});
