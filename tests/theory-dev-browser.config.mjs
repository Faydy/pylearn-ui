import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const disabled = process.env.THEORY_DEV_TEST_DISABLED === 'true';
export default defineConfig({
  define: { 'import.meta.env.VITE_ENABLE_THEORY_DEV_TOOLS': JSON.stringify(disabled ? 'false' : 'true'), 'import.meta.env.VITE_API_URL': JSON.stringify('/fixture-api') },
  plugins: [{ name: 'theory-dev-fixture', enforce: 'pre', resolveId(source) {
    if (source.endsWith('/AuthContext')) return fileURLToPath(new URL('./fixtures/solved-auth.js', import.meta.url));
    if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/theory-supabase.js', import.meta.url));
    if (source.endsWith('/NotificationsBell')) return fileURLToPath(new URL('./fixtures/solved-notifications.js', import.meta.url));
    if (source.endsWith('/layouts/MainLayout')) return fileURLToPath(new URL('./fixtures/dev-layout.jsx', import.meta.url));
  }, configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url === '/fixture-api/run') {
        let body = '';
        request.on('data', (chunk) => { body += chunk; });
        request.on('end', () => {
          const { code, input } = JSON.parse(body);
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ success: true, output: `Cerere verificată: stdin=${JSON.stringify(input)}\n${code}\n` }));
        });
        return;
      }
      if (request.url?.startsWith('/dev/teorie')) request.url = '/tests/theory-dev-browser.html';
      next();
    });
  } }, react(), tailwindcss()],
  server: { host: '127.0.0.1', port: disabled ? 5180 : 5179, strictPort: true },
});
