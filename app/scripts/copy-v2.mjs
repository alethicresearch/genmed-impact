import { cp, mkdir } from 'node:fs/promises';

// Vite is built with base:'./' so the root research page can also live on GitHub Pages.
// A static host has no SPA rewrite for /v2, so give the narrative interface its own copy of
// index.html plus the relative asset/data directories it expects. Netlify can still use its
// rewrites; this keeps the same build directly addressable on both hosts.
await mkdir('dist/v2', { recursive: true });
await cp('dist/index.html', 'dist/v2/index.html');
await cp('dist/assets', 'dist/v2/assets', { recursive: true });
await cp('dist/data', 'dist/v2/data', { recursive: true });
