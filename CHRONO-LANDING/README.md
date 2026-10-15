# ChronoQuest landing page

Public page for ChronoQuest: APK download (with a QR code for computer visitors), real game screens, links to the teacher and admin dashboard, install steps, FAQ, updates, team, privacy and contact.

Plain HTML, CSS and JavaScript built with Vite. No React: the page has almost no state, and the looping hero scene and scroll effects are CSS.

## Run it

```bash
cd CHRONO-LANDING
npm install
npm run dev        # http://127.0.0.1:5174
npm run build      # output in dist/
npm run preview
```

## What to change between releases

All in `src/config.js` (or a `.env`, see `.env.example`):

| Setting | What it does |
|---|---|
| `VITE_DASHBOARD_URL` | Teacher and Admin buttons go to `<url>/login`. Default is the live dashboard, `https://chronoquest-dashboard.vercel.app`. |
| `VITE_APK_URL` | Where the APK is. Default is this site, `/downloads/chronoquest.apk`. |
| `VITE_APK_VERSION` | Shown on the buttons and in the install card. |
| `VITE_CONTACT_EMAIL` | Shown in the contact card. |

The APK size is read from `public/downloads/chronoquest.apk` at build time.

Text that is written by hand in `index.html`: the **What's new** list, the **FAQ**, the **Team** names, the **Privacy** list, and the hero feature lines. Search for `Member name`, `Adviser name`, `School name` and `contact@your-email.com` to find the placeholders.

## New APK

1. Build it in the game repo (`flutter build apk --split-per-abi`, raise the pubspec version first).
2. Copy `build/app/outputs/flutter-apk/app-arm64-v8a-release.apk` to `public/downloads/chronoquest.apk`.
3. Set `VITE_APK_VERSION`, update **What's new** in `index.html`, deploy.

The APK is in `.gitignore` (36 MB per version would bloat the repo). Two ways to ship it:

- **Vercel CLI from this PC** (`npx vercel --prod`). `.vercelignore` is set so the APK is uploaded even though git ignores it. A deploy triggered by a git push will not contain the APK, so the download button would 404.
- **Host it elsewhere** (for example a GitHub Release) and set `VITE_APK_URL` to that link.

## Screens

`public/screens/*.webp` are real screenshots (873x393) from the Flutter web build, taken with `CHRONO-GAMEAPP/tool/cdp_shot.js`. Navigate with a full page load per screen (`nav:about:blank;nav:http://127.0.0.1:PORT/#/shop`), because hash-only navigation does not re-route in the game. Build the web bundle with `flutter build web --profile --dart-define=DEV_SKIP_AUTH=true` (release builds ignore that flag).

Still placeholders: the gameplay video box, the three dashboard pictures, a quiz question screen and the leaderboard (the web build cannot reach the server without an account).

## Art

`public/art/` holds copies of sprites from `CHRONO-GAMEAPP/assets/`. They are drawn with `image-rendering: pixelated`.

## Share picture

`public/og.jpg` (1200x630) is the card shown when the link is shared in Messenger or Facebook. The tags are in `index.html`. They need an absolute address: on Vercel it is found automatically (`VERCEL_PROJECT_PRODUCTION_URL`), elsewhere set `VITE_SITE_URL`. Without either, the tag is just `/og.jpg` and some apps will not show it. After deploying, test the link in the Facebook Sharing Debugger.

## Live site

https://chronoquest-five.vercel.app (Vercel project `chronoquest`). Deploy or redeploy from this folder:

```bash
npx vercel deploy --prod
```

The project is linked in `.vercel/` (git-ignored; run `npx vercel link --project chronoquest` on a new PC). The site is not connected to GitHub, so a push does not deploy it.

## Dashboard pictures

`public/screens/dash-*.webp` (item analysis, question bank, sections) show the real dashboard with **demo data**: a fictional school and fictional students from the dashboard's own seed (`CBACK/src/utils/seed.js`). No real student appears. To retake them: run the seed against a throwaway in-memory MongoDB, start CBACK and CDASH locally on spare ports (not the live database), sign in as `teacher1.bangbangalon@chronoquest.dev`, and screenshot at 1200x800 (scale 1.5). Tap a picture on the page to enlarge it.
