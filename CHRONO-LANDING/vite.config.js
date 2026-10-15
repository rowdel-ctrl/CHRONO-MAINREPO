import { defineConfig } from 'vite';
import fs from 'node:fs';

// The page shows the real size of the APK that sits in public/downloads.
// If the file is missing (for example when the APK is hosted elsewhere) the
// fallback in src/config.js is used.
function apkSize() {
  try {
    const bytes = fs.statSync(new URL('./public/downloads/chronoquest.apk', import.meta.url)).size;
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  } catch {
    return '';
  }
}

// Share links need an absolute address for the picture. Set VITE_SITE_URL, or Vercel's own
// production address is used when it is available at build time.
function siteUrl() {
  const set = process.env.VITE_SITE_URL;
  if (set) return set.replace(/[/]$/, '');
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return v ? 'https://' + v : '';
}

const shareUrl = {
  name: 'share-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl()),
};

export default defineConfig({
  plugins: [shareUrl],
  define: {
    __APK_SIZE__: JSON.stringify(apkSize()),
  },
  server: { host: '127.0.0.1', port: 5174 },
  build: { target: 'es2019' },
});
