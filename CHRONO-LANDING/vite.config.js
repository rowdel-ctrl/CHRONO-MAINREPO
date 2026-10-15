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

export default defineConfig({
  define: {
    __APK_SIZE__: JSON.stringify(apkSize()),
  },
  server: { host: '127.0.0.1', port: 5174 },
  build: { target: 'es2019' },
});
