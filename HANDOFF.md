# HANDOFF (board for all chats)

> One page. It shows the three chats side by side. Each chat keeps its own full notes in its own folder; this board only says where things stand and what one chat needs from another.
> Last updated: 2026-10-15 by LANDING PAGE.

## The three chats

| Nickname | Works on | Its own handoff | Where it stands |
|---|---|---|---|
| **GAME** | `CHRONO-GAMEAPP` (Flutter game) | `CHRONO-GAMEAPP/HANDOFF.md` | 2026-10-14: new sign-in, sign-up and change-password screens built, tested, committed and pushed. Old Claude co-author lines removed from all game and root commits (commit ids changed; re-clone elsewhere). Last APK was 1.1.0 on 2026-10-11. The Oct 13-14 screens (leaderboard, history, shop, sign-in) have not been tried on a phone. |
| **DASHBOARD** | `CHRONO-DASHBOARD` (teacher and admin website, backend) | `CHRONO-DASHBOARD/HANDOFF.md` | 2026-10-14: all of today's work is merged to `main` and pushed (new filter bar and phone layouts, Sections cards, Question Bank switch, Top students 10, Points and phone student cards, generated password on reset, per-level question timer, duplicate section names blocked, Users export). Tests and build pass. Not looked at on a real phone or the live site. |
| **LANDING PAGE** | `CHRONO-LANDING` (public page: APK download, screens, dashboard links) | `CHRONO-LANDING/HANDOFF.md` | 2026-10-15: built and checked in screenshots, committed locally as dcff197 (not pushed), not deployed. Teacher and Admin buttons now point to `https://chronoquest-dashboard.vercel.app/login`. Placeholders still to fill. |

## Waiting on the user

- **GAME:** try the Oct 13-14 screens on a phone. Say when to build a new APK. Before the student build: remove Test Mode and bundle Poppins.
- **DASHBOARD:** look at the new phone layouts on a real phone after Vercel deploys (hard refresh). Take three screenshots for the landing page (item analysis, question bank, sections).
- **LANDING PAGE:** deploy to Vercel later (it will remind you). Fill the placeholders (team, adviser, school, contact email, gameplay video).

## Requests between chats

A chat adds a line here when it needs something from another chat, and deletes the line when it is done.

| From | To | Request |
|---|---|---|
| LANDING PAGE | GAME | A fresh arm64 APK when the download should be the newest build (raise the pubspec version first). A phone screenshot of a quiz question and of the leaderboard for the screens row. |
| LANDING PAGE | DASHBOARD | Three screenshots: item analysis, question bank, sections (need a login and a browser: the user has to take them). The live dashboard address is settled: `https://chronoquest-dashboard.vercel.app`. |
| GAME | DASHBOARD | Score and coins sync was postponed by the user. It needs a backend change when they pick it up. |

## Rules for every chat

1. At the start: read this board, then the top entry of your own handoff.
2. Work only in your own folder. If you need something from another chat, add a line to the requests table instead of doing it. The user can allow an exception for one chat (the LANDING PAGE chat was allowed to touch both).
3. At the end of a session: add a dated entry at the top of your own handoff and update your row here. Do it automatically, without asking.
4. Never commit, push or build an APK unless the user says so. Commits show only the user as author.
5. Use plain words: say what changed, what was checked, what was not checked, and the next step.

## Size limits

| File | Keep under | When it grows past that |
|---|---|---|
| This board | about 80 lines | Delete finished requests and old state lines. |
| `CHRONO-GAMEAPP/HANDOFF.md` | about 400 lines | Move the oldest entries in full to `CHRONO-GAMEAPP/docs/handoff-archive/` and leave a one-line pointer. |
| `CHRONO-DASHBOARD/HANDOFF.md` | about 300 lines | Same, into `CHRONO-DASHBOARD/docs/handoff-archive/`. |
| `CHRONO-LANDING/HANDOFF.md` | about 200 lines | Same, into `CHRONO-LANDING/docs/handoff-archive/`. |
| One entry | one page | Put detail in the code, tests or a design doc, and link to it. |

Blank entry format: `HANDOFF(template).md`.
