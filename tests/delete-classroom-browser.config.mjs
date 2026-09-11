import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [{ name: 'delete-classroom-fixtures', enforce: 'pre', resolveId(source) {
    if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/delete-classroom-supabase.js', import.meta.url));
    if (source.endsWith('/AuthContext')) return fileURLToPath(new URL('./fixtures/solved-auth.js', import.meta.url));
    if (source.endsWith('/NotificationsBell')) return fileURLToPath(new URL('./fixtures/solved-notifications.js', import.meta.url));
  }, configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (/^\/clase(\/|\?|$)/.test(request.url)) request.url = '/tests/delete-classroom-browser.html';
      next();
    });
  } }, react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5181, strictPort: true },
});
