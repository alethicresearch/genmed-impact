import { cp, mkdir } from 'node:fs/promises';

// Vite is built with base:'./' so versioned research pages can also live on GitHub Pages.
// Static hosts have no SPA rewrite for versioned routes, so each route gets its own copy of
// the built entry point plus the relative asset/data directories it expects. Netlify can still
// use its rewrite rules; this keeps the same build directly addressable on both hosts.
for (const version of ['v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8']) {
  await mkdir(`dist/${version}`, { recursive: true });
  await cp('dist/index.html', `dist/${version}/index.html`);
  await cp('dist/assets', `dist/${version}/assets`, { recursive: true });
  await cp('dist/data', `dist/${version}/data`, { recursive: true });
}
