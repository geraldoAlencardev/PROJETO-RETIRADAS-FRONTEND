import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Em desenvolvimento, /api/* é repassado para a API (PROJETO-RETIRADAS) sem o prefixo.
// Assim front e API ficam na mesma origem e o cookie de sessão funciona sem CORS.
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ''),
      },
    },
  },
});
