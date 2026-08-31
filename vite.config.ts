import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The base path is the one thing that differs between a local preview and a
// GitHub Pages project deployment. Setting BASE_PATH makes every generated
// asset URL, internal link, and static route entry point agree.
const base = normalize(process.env.BASE_PATH ?? '/');

function normalize(value: string): string {
  let path = value.trim();
  if (!path.startsWith('/')) path = `/${path}`;
  if (!path.endsWith('/')) path = `${path}/`;
  return path;
}

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    reportCompressedSize: true,
  },
});
