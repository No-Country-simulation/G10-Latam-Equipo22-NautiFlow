import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Un único .env en la raíz del repo para frontend y Docker.
  envDir: '..',
  server: { port: 5173, host: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    env: { VITE_API_URL: 'http://localhost:3000/api/v1' },
  },
});
