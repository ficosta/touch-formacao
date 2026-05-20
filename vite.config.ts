import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: { target: 'es2022', sourcemap: true },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: { reporter: ['text', 'html'], thresholds: { lines: 80, functions: 80, branches: 75 } }
  }
});
