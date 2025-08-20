import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/resource': 'http://localhost:4000',
      '/': 'http://localhost:4000',
  '/ollama': 'http://localhost:11434',
  '/ollama/api/pull': 'http://localhost:11434',
  '/ollama/api/delete': 'http://localhost:11434',
    },
    port: 3000,
  },
});
