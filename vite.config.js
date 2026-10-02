import { defineConfig } from 'vite';

// Plain Vite, no framework. `assets/` is served as-is in dev (project root)
// and copied into dist/ by scripts/copy-assets.mjs after `vite build`.
export default defineConfig({
  base: './',
  publicDir: false,
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: { target: 'es2020' }
});
