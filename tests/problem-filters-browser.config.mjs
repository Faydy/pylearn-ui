import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [{ name: 'problem-filter-fixtures', enforce: 'pre', resolveId(source) {
    if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/problem-filters-supabase.js', import.meta.url));
    if (source.endsWith('/AuthContext')) return fileURLToPath(new URL('./fixtures/solved-auth.js', import.meta.url));
    if (source.endsWith('/NotificationsBell')) return fileURLToPath(new URL('./fixtures/solved-notifications.js', import.meta.url));
  }, configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (/^\/(probleme|rezolvare)(\/|\?|$)/.test(request.url)) request.url = '/tests/problem-filters-browser.html';
      next();
    });
  } }, react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5179, strictPort: true },
});

