# HANDOFF (board for all chats)

> One page. It shows the three chats side by side. Each chat keeps its own full notes in its own folder; this board only says where things stand and what one chat needs from another.
> Last updated: 2026-10-17 by DASHBOARD.

## The three chats

| Nickname | Works on | Its own handoff | Where it stands |
|---|---|---|---|
| **GAME** | `CHRONO-GAMEAPP` (Flutter game) | `CHRONO-GAMEAPP/HANDOFF.md` | 2026-10-17 (built, tested, not committed, no APK): a test build and a student build (Test Mode only in the tester), "Forgot password?" on sign-in (game side: asks the teacher; needs the dashboard part, see the requests table), the last class code and username remembered, coins earned on the level-complete screen. Also drawn, not built: saved coins and a three-phase boss. The wording list was approved and applied. Brief written: poses for an artist. 2026-10-14: new sign-in, sign-up and change-password screens built, tested, committed and pushed. Old Claude co-author lines removed from all game and root commits (commit ids changed; re-clone elsewhere). Last APK was 1.2.0 on 2026-10-15 (still has Test Mode). The Oct 13-14 screens (leaderboard, history, shop, sign-in) have not been tried on a phone. |
| **DASHBOARD** | `CHRONO-DASHBOARD` (teacher and admin website, backend) | `CHRONO-DASHBOARD/HANDOFF.md` | 2026-10-17: merged to `main` as 562141b and pushed: students can ask their teacher for a password reset from the game, teachers answer on My Students, a reset now makes the student choose a new password, and the student-login `.*` problem is fixed. Earlier: 2026-10-16: `main` has everything up to the button look fix (not yet seen on a real phone or the live site). Also merged to `main` as c09a52e and pushed: approval emails, Decline with a reason, Forgot password, new sign-in messages, the dashboard fixed to one school (Bangbangalon ES). Emails go through a Gmail account (`chronoquest.noreply@gmail.com`, app password in Vercel). Tests pass; a real test email from Gmail arrived. Live test found that Gmail SMTP on port 587 times out from Vercel (Hong Kong): the user is trying MAIL_PORT=465; if that fails, switch to Brevo or Resend. Also merged to `main` and pushed: a Google teacher can set a password through Forgot password, a Google sign-up fix (a signed-in browser sent the wrong token), the Users table now fits without scrolling sideways (56bba7f), and confirm the email after an email sign-up ("Confirm my email" link, the admins only see the request after it is pressed, unconfirmed requests remove themselves after 3 days) and refuse throwaway email sites. Tests pass (backend 316, dashboard 153). |
| **LANDING PAGE** | `CHRONO-LANDING` (public page: APK download, screens, dashboard links) | `CHRONO-LANDING/HANDOFF.md` | 2026-10-15: LIVE at https://chronoquest-five.vercel.app (Vercel project `chronoquest`, deployed with the CLI from this PC, APK 1.2.0 inside). Team, adviser, school and email are still placeholders. Teacher and Admin buttons now point to `https://chronoquest-dashboard.vercel.app/login`. Placeholders still to fill. |

## Waiting on the user

- **GAME:** try the Oct 13-14 screens on a phone. Say when to build an APK (next is 1.3.0; there are now a student and a tester build, commands in the GAME handoff). Pass the forgot-password brief to the DASHBOARD chat. Give the pose brief (`CHRONO-GAMEAPP/docs/CHARACTER-POSES-BRIEF.md`) to whoever draws. Before the student build: bundle Poppins.
- **DASHBOARD:** after Vercel deploys, ask for a reset from the game and answer it as the teacher. Also: try Forgot password with your own email, then a sign-up with an address you own: press "Confirm my email", approve it as admin (all accounts on the live site are demo ones, so first make a real admin: sign up, approve with the demo admin, promote). Check Spam the first time. Look at the new phone layouts on a real phone after Vercel deploys (hard refresh). Take three screenshots for the landing page (item analysis, question bank, sections).
- **LANDING PAGE:** deploy to Vercel later (it will remind you). Fill the placeholders (team, adviser, school, contact email, gameplay video).

## Requests between chats

A chat adds a line here when it needs something from another chat, and deletes the line when it is done.

| From | To | Request |
|---|---|---|
| LANDING PAGE | GAME | FYI: on 2026-10-15 the user had an arm64 APK built (version 1.2.0+3, from `5d7e8bf`); the pubspec bump is committed. It still has Test Mode (the next student build will not). Also please send a phone screenshot of a quiz question and of the leaderboard for the screens row. |
| LANDING PAGE | DASHBOARD | Three screenshots: item analysis, question bank, sections (need a login and a browser: the user has to take them). The live dashboard address is settled: `https://chronoquest-dashboard.vercel.app`. |
| GAME | DASHBOARD | Score and coins sync was postponed by the user. It needs a backend change when they pick it up. The user liked the idea again on 2026-10-17 (mockup linked in the GAME handoff); no decision yet. |
| GAME | DASHBOARD | Forgot password for students is merged to dashboard `main` (562141b) and pushed, so Vercel deploys it. Path and body are exactly as in the brief: `POST /api/v1/student/password-reset-request` {classCode, username}; it always answers 200 (400 for bad fields, 429 when limited). Teachers see the requests on My Students. The student login `.*` problem is fixed there too. Delete this line when it is live. |

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
