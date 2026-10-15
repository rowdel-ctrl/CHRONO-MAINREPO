# HANDOFF (landing page)

> **Chat nickname: LANDING PAGE.** This file is for the public landing page only (`CHRONO-LANDING`). The board that shows all three chats is `../HANDOFF.md`. Game: `../CHRONO-GAMEAPP/HANDOFF.md`. Dashboard: `../CHRONO-DASHBOARD/HANDOFF.md`.
> At the end of a session add a dated entry at the top (automatically, without asking). Keep the newest entry under one page. Keep this file under about 200 lines: when it grows past that, move the oldest entries in full to `docs/handoff-archive/`.

**Date:** 2026-10-14 (public landing page, new folder `CHRONO-LANDING`; its own chat; committed locally as dcff197 on `v2-phase-4`, not pushed)
**From:** Claude Code (Sonnet 5.5)
- **What:** a separate public site (Vite, plain HTML/CSS/JS, not React): hero scene, gold era ticker, student features, real screens carousel, gameplay video box, how it works, dashboard highlights with Teacher and Admin buttons, install steps with a QR code, What's new, FAQ, team, privacy and contact. Game look with animations; phone to wide desktop. Mockup (3 versions, final is the third link) https://claude.ai/artifact/FBFL5iRptaspu7gr3MaYUU
- **Settings:** `CHRONO-LANDING/src/config.js` and `.env.example`. Dashboard URL is `https://chronoquest-dashboard.vercel.app` (given by the user 2026-10-15; its `/login` answered 200). Both portal buttons go to `<url>/login` (the dashboard has one sign-in for both roles).
- **APK:** `public/downloads/chronoquest.apk` is a copy of the Oct 11 arm64 build (1.1.0, 36 MB), not the newest game. It is git-ignored; deploy with the Vercel CLI (`.vercelignore` lets it upload) or set `VITE_APK_URL`. See `CHRONO-LANDING/README.md`.
- **Screens:** 7 real screenshots in `public/screens/` from a Flutter web profile build (welcome, eras, levels, run, history, shop, profile). No quiz question and no leaderboard (needs an account and server). The game repo was not changed; `CHRONO-GAMEAPP/build/web` was created (git-ignored).
- **Placeholders to fill:** team names, adviser, school, contact email, gameplay video, three dashboard pictures. "What's new" lists the question timer, leaderboard, history and new sign-in under "Next build" because no APK has them yet; update it when one is built. Privacy list was written from the Student model: check it.
- **Not done:** not deployed, no Vercel project yet, not pushed. Not opened on a phone. No Open Graph image.
