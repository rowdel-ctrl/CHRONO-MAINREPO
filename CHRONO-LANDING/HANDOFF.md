# HANDOFF (landing page)

> **Chat nickname: LANDING PAGE.** This file is for the public landing page only (`CHRONO-LANDING`). The board that shows all three chats is `../HANDOFF.md`. Game: `../CHRONO-GAMEAPP/HANDOFF.md`. Dashboard: `../CHRONO-DASHBOARD/HANDOFF.md`.
> At the end of a session add a dated entry at the top (automatically, without asking). Keep the newest entry under one page. Keep this file under about 200 lines: when it grows past that, move the oldest entries in full to `docs/handoff-archive/`.

**Date:** 2026-11-11 (later) (**student 1.11.1 public + hidden TEST 1.11.1 are LIVE**; committed on the user's "PPP deploy")
**From:** Claude Code (Sonnet 5.5)
- No board request line existed; the user asked on seeing the new files in the game `build/` folder (they came after 1.11.0, `Nov 10 21:16/21:19`). aapt2: student `com.chronoquest.chronoquest` 1.11.1 (versionCode 2224), TEST `...chronoquest.test` 1.11.1-test (label "ChronoQuest TEST"), three chips each; `libapp.so` says only "1.11.1". Student 86,255,728 bytes (sha `e00034c3…`), TEST 86,255,744 (sha `88d25c0a…`), 82 MB on the page. What changed vs 1.11.0 comes from the GAME handoff (skip button on a history story already read, UNCOMMITTED in the game); GAME has not confirmed this build.
- Page: both files swapped; `config.js` and `latest.json` 1.11.1 (first note: skip a story you have read); What's new 1.11.1 card (19 cards); tester box and hero text updated. Build passes; Chrome 5-tap test passed, no console errors.
- **Deployed at the user's "PPP deploy"** (once this time). Live check: student and TEST sha256 and byte sizes match local; live `latest.json` 1.11.1; live page shows v1.11.1 and the 1.11.1 card. Not tried on a phone or the tablet. Wide screens still from 1.9.0; level-complete picture still missing.

---

**Date:** 2026-11-11 (**student 1.11.0 public + hidden TEST 1.11.0 are LIVE**; committed on the user's "PPP deploy")
**From:** Claude Code (Sonnet 5.5)
- GAME requests 1.10.0 and 1.11.0 (both on the board); 1.11.0 is newer, so only 1.11.0 went on the page and both request lines are handled (1.10.0 was never public; the 1.11.0 What's new card covers both). aapt2: student `com.chronoquest.chronoquest` 1.11.0 (versionCode 2223), TEST `...chronoquest.test` 1.11.0-test (label "ChronoQuest TEST"), three chips each; compiled `libapp.so` says only "1.11.0". Student 86,255,728 bytes (sha `aa0d3f3b…`), TEST 86,255,744 (sha `90d21d4c…`), 82 MB on the page.
- Page: both files in `public/downloads/` (git-ignored); `config.js` 1.11.0; `latest.json` 1.11.0 (four Taglish notes); What's new 1.11.0 card (Latest, 6 bullets; 18 cards now); the tester box line and the hero/screens version text updated. Build passes; Chrome 5-tap test passed (4 taps closed, 5 open, slow taps do not count, no tester link outside the dialog, no console errors).
- **Deployed at the user's "PPP deploy"** (the CLI ran twice by my slip, same files; last alias https://chronoquest-five.vercel.app). Live check: student and TEST sha256 and byte sizes match local; live `latest.json` 1.11.0; live page shows v1.11.0 and the 1.11.0 card. Not tried on a phone or the tablet.
- **Not done:** the nine wide screens are still from the 1.9.0 web build (new 1.11.0 attacks and boss fight are not shown); level-complete picture still missing. Older entries moved to `docs/handoff-archive/2026-10-15-to-2026-11-07-landing.md`.

---

**Date:** 2026-11-10 (later) (**new landing page is LIVE**; committed and pushed on the user's "PPP DEPLOY")
**From:** Claude Code (Sonnet 5.5)
- The user disliked the page (screenshots row, dashboard section, whole page) and answered 16 questions, then approved a box sketch: dark game look but cleaner, mostly Taglish, gameplay clip in the hero, big wide screens with no phone frame, a lot of motion, one big dashboard button, What's new on its own page, Download buttons at the top jump to the Download section. Preview of the built page: https://claude.ai/artifact/5HEQeNs9RRGy69nR8bY53R (private, Download buttons dead there).
- Changed (working tree, uncommitted): `index.html` (new hero, ten wide screens, Taglish copy, teachers section cut from six steps to three plus one "Buksan ang dashboard" button, features/video/news sections removed), new `whats-new.html` (all 17 versions, flat), `src/style.css` (hero-v, wide figures, dead hero-scene/rail/features/video rules removed), `src/main.js` (video play/pause, drift on scroll, rail code removed), `vite.config.js` (two pages). Build passes; Chrome test at 1280 and 390 wide: no errors, no sideways scroll, hero clip plays.
- Pictures (from a subagent, Flutter web profile build of the current tree, 1746x786): welcome, character, eras, levels, run, boss, codex ("Kodeks"), shop, profile in `public/screens/`; `run.webm` (1.7 MB, 10.8 s, 873x393) and `poster.webp` for the hero. Old history/pause pictures deleted. Caveats: the clip does not loop cleanly (jump cut), Juan loses a heart in it, and the pictures show "Student" and 0 coins (web test mode, no sign-in).
- **Not done:** level-complete picture (needs a finished level; the page skips it until `public/screens/complete.webp` exists, then re-run the build); no phone recording; release notes on What's new stay in English; `og.jpg` and QR posters still old; the old 6-step dashboard steps 2, 3 and 6 are gone from the page (the CSS for their pictures is still there).
- **Deployed at the user's "DEPLOY"** (deployment chronoquest-b2pm068gr, production). Live check on a 390 px phone view: logo 5-tap still opens the tester dialog (tester link only inside it), student button and QR use `/downloads/chronoquest.apk` 1.9.0, hero clip plays, nine wide screens, What's new page shows 17 versions, no console errors, no sideways scroll. Student and TEST APK sha256 on the live site (`fc2c40de…`, `e60562ed…`) and `latest.json` 1.9.0 unchanged. Not looked at on a real phone. Rebuild scripts are in the session scratchpad only, not in the repo.

---

**Date:** 2026-11-10 (**student 1.9.0 public + hidden TEST 1.9.0 are LIVE**; committed `015d23f` on v2-phase-4, `7ca456f` on main, before the deploy)
**From:** Claude Code (Sonnet 5.5)
- GAME request (1.9.0 student and tester, versionCode 2217). The user: "Check board, then PPP merge after build" (no "Deploy" yet). aapt2: student `com.chronoquest.chronoquest` 1.9.0, TEST `...chronoquest.test` 1.9.0-test (label "ChronoQuest TEST"), three chips each; compiled `libapp.so` says only "1.9.0". Student 85,188,576 bytes (sha `fc2c40de…`), TEST 85,188,592 (sha `e60562ed…`), about 81 MB on the page.
- Page: both files copied into `public/downloads/`; `config.js` apkVersion and testerVersion 1.9.0; `latest.json` 1.9.0 (four Taglish notes: new screens, boss arenas, Codex, Next waits); What's new has a 1.9.0 card (Latest, eight bullets) and 1.8.1 moved into the fold ("Show 16 earlier versions"); tester box line updated. Build passes; Chrome 5-tap test passed (4 taps closed, 5 open, hrefs and sizes right, slow taps do not count, no tester link outside the dialog, no console errors).
- **Deployed at the user's "Deploy".** Live check: student sha256 `fc2c40de…` (85,188,576) and TEST `e60562ed…` (85,188,592) match local; live `latest.json` 1.9.0; live page has the 1.9.0 card, "Show 16 earlier versions" and the tester line. Not tried on a phone or the tablet.
- **Not done:** the carousel screenshots still show the 1.8.0 screens, so they are older than nine of the redesigned screens (GAME said so on the board). Retake them when the user wants.

---

**Date:** 2026-11-08 (night, later) (**student 1.8.1 public + hidden TEST 1.8.1 are LIVE**; committed on the user's "PPP")
**From:** Claude Code (Sonnet 5.5)
- GAME request (1.8.1 student and tester, versionCode 2216). The user: "Check board, PPP and merge", then "Deploy". aapt2: student `com.chronoquest.chronoquest` 1.8.1, TEST `...chronoquest.test` 1.8.1-test (label "ChronoQuest TEST"), three chips each; compiled `libapp.so` says only "1.8.1". Sizes 85,434,172 (student) and 85,434,188 (TEST), about 81 MB on the page.
- Page: both files swapped; `config.js` apkVersion and testerVersion 1.8.1; `latest.json` 1.8.1 (four Taglish notes: new art, Maria Clara, longer story before each era, parol menu); What's new has a 1.8.1 card (Latest) and 1.8.0 moved into the fold ("Show 15 earlier versions"); tester box line updated. Chrome 5-tap test passed.
- **Live check:** student sha256 `4a0f1a2d…` and TEST `9f42069e…` match local (byte sizes too); live `latest.json` 1.8.1; live page has the 1.8.1 card. Not tried on a phone or the tablet. One slip while editing: the 1.8.0 card first landed outside the fold; caught by the build check and fixed before deploy.

---

**Date:** 2026-11-08 (night) (**root clean-up at the user's request**; not committed yet)
**From:** Claude Code (Sonnet 5.5)
- **Root:** the four old game notes moved to `docs/game/` (`git mv`) with `docs/README.md`; `LEVEL-TOPICS.md` stays at the root because the dashboard script `CBACK/scripts/sync-content.js` reads it from there; `CLAUDE.md` structure list updated; stray `=` file deleted. `capstone/` (git-ignored) sorted into `srs/`, `manuscript-review/`, `final-terms/`, `presentation-guides/`, `users-manual/`, `testing/`, with a list of every move in `capstone/ORGANIZED.txt`.
- **Landing:** 7 unused Rizal and Spanish soldier sprites deleted; the two 1.4.0 QR poster PDFs untracked (ignored, files still on disk; rebuild from `posters/source`); `package-lock.json` now tracked (negation line in the root `.gitignore`).
- **Game and dashboard (user said do them too and mention on the board):** game `6889cc9` and `688c3fc` on `feat/maria-clara-artifacts` (quest scaffolding, 3 unused backgrounds, `windows/`; analyze clean, 1,430 tests pass); dashboard lockfiles on branch `chore/lockfiles` (`94e2ea1`, not merged, so no deploy). Old APKs in the game `build/` and `build/web` deleted. FYI lines added to the board requests table for GAME and DASHBOARD. The GAME chat had its own uncommitted files (`.gitignore`, `HANDOFF.md`, `tools/art-import/*`); none were touched.
- **Correction:** I said earlier my handoff was over its size limit; it is 178 lines against about 200, and the game (363) and dashboard (343) handoffs are also within their limits, so nothing was trimmed.

---

**Date:** 2026-11-08 (later) (**new pictures LIVE: game screens, hero animation, dashboard section**; committed fb1e920 on v2-phase-4, 7efb03e on main)
**From:** Claude Code (Sonnet 5.5), with two helpers (one for the game shots, one for the dashboard pictures)
- The user: "Update the screenshots, use 2 subagents if needed specially the dashboard". The user chose "Redraw to match today's dashboard" (still no real dashboard screenshots).
- **Game screens:** all nine retaken from the 1.8.0 game tree (Flutter web profile build, 873x393, branch feat/maria-clara-artifacts; only the git-ignored build/web was touched) and a tenth added, `boss.webp` (Bakunawa, "Tanong 1 ng 22"). Character shows Maria Clara and the roster of eight; run shows Juan and the dark spirit; welcome/eras/shop/profile are on the parol night. Shop and profile show zeros and "Student" (web build, no account). Intro line now says build 1.8.0; captions for hero/run/shop rewritten; boss card added after run.
- **Hero animation** (top of the page): Juan (`boy_walk_1-4`, `boy_jump`) and the dark spirit (`dark_spirit_1-2`) copied from the game assets into `public/art/` (old rizal/spanish files still there, now unused); CSS vars/aspect ratios changed, smooth scaling for those two.
- **Dashboard section (#teachers):** now six steps (Write, Time, Share, Follow, For the principal, For admins), pictures redrawn in HTML/CSS inside a drawn dashboard frame, copied from today's CDASH code (read only), made-up names only ("Sample Elementary School"). New `dz-app` CSS block in style.css; old unused dz- rules removed. Phone widths show the icon-only sidebar (the real phone bottom bar is not drawn).
- Checked: build passes, Chrome at 390 and 1280 px: no horizontal scroll, no console errors, hero and carousel look right. NOT checked: every dashboard picture at 820 px by me (helper did), phone. Still old: `og.jpg`, QR posters (1.4.0), gameplay clip and quiz screenshot placeholders.
- **Deployed and committed at the user's "PPP and deploy".** Live check: boss, run and character shots, the new sprites and both APKs have the same byte sizes as local; the live page has "build 1.8.0" and the principal step; `latest.json` still 1.8.0.
- **Waiting (user said "later"):** the user does not like the redrawn look of the dashboard pictures and asked for animated screens, a cursor that clicks and a line saying what each screen does. Mockup (game tab with the real 1.8.0 shots, dashboard tab with a rough redraw): https://claude.ai/artifact/TRBnEmU8UX8XJMgfcXZ97F . Open questions for the user: (1) dashboard source: keep the redrawn pictures, or record real clicks on a throwaway dashboard copy with fake data (the user earlier said no real dashboard); (2) replace both the "See the game" row and the dashboard section, or only the dashboard. Nothing built on the page yet.

---

**Date:** 2026-11-08 (**student 1.8.0 public + hidden TEST 1.8.0 are LIVE**; not committed)
**From:** Claude Code (Sonnet 5.5)
- GAME request (1.8.0 student and tester, version code 2210), the user: "Yes" to the swap and "And deploy". aapt2: student `com.chronoquest.chronoquest` 1.8.0, TEST `...chronoquest.test` 1.8.0-test, three chips each, compiled code has "1.8.0" and no 1.7.1 (93,563,188 and 93,563,204 bytes, shown as 89 MB). New: Maria Clara (8th hero), 60 era artifact icons, power-up fixes, star-lantern menus, all the 1.7.x art.
- Page: both files swapped; `config.js` apkVersion and testerVersion 1.8.0; `latest.json` 1.8.0 (four Taglish notes, so every older install sees the update card); What's new 1.8.0 card ("Show 14 earlier versions"; it also covers the 1.7.x art the public never had); tester box line updated. NOT done: the page's hero pictures still show the old five heroes (needs new screenshots).
- Chrome 5-tap test passed before deploy. Live: student sha256 `e955009d…` (93,563,188) and tester `c4c8397f…` (93,563,204) match local; live `latest.json` 1.8.0. Not tried on a phone or the tablet.

---


Older entries (2026-10-15 to 2026-11-07): `docs/handoff-archive/2026-10-15-to-2026-11-07-landing.md`.
