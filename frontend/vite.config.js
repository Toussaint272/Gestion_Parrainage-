import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le proxy /api → backend Express : aucun souci de CORS en développement.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
