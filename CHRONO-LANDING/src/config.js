// Everything on the page that changes between releases or deployments.
// Override any of these with a .env file (see .env.example).
const env = import.meta.env;

export const config = {
  // Teacher and admin sign in at <dashboardUrl>/login.
  // Given by the user on 2026-10-15; /login answered 200.
  dashboardUrl: env.VITE_DASHBOARD_URL || 'https://chronoquest-dashboard.vercel.app',

  // The APK file. By default it is served by this site from public/downloads/.
  // Set VITE_APK_URL to host it somewhere else (for example a GitHub Release).
  apkUrl: env.VITE_APK_URL || '/downloads/chronoquest.apk',
  apkVersion: env.VITE_APK_VERSION || '1.2.0',
  apkSize: env.VITE_APK_SIZE || __APK_SIZE__ || '36 MB',

  contactEmail: env.VITE_CONTACT_EMAIL || 'contact@your-email.com',
};
