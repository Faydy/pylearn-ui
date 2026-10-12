import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [{ name: 'password-fixture', enforce: 'pre', resolveId(source) {
    if (source.endsWith('/supabaseClient')) return fileURLToPath(new URL('./fixtures/password-supabase.js', import.meta.url));
  } }, react()],
  server: { host: '127.0.0.1', port: 5182, strictPort: true },
});
