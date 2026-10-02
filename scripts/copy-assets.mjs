// Copies the runtime assets (art / audio / sprites) into the build folder after `vite build`.
// usage: node scripts/copy-assets.mjs [outDir]   (default: dist)
import { cpSync, existsSync, writeFileSync } from 'node:fs';
const out = process.argv[2] || 'dist';
if (existsSync('assets')) {
  cpSync('assets', `${out}/assets`, { recursive: true });
  console.log(`✓ copied assets/ → ${out}/assets/`);
}
writeFileSync(`${out}/.nojekyll`, '');   // GitHub Pages: serve every file as-is
