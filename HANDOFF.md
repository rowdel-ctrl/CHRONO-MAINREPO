# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-19 (late night — tile verification)
**From:** Claude Code (dev no-login mode + platform tile verification; reconciles the chat session's tile-coordinate entry)
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Run the game without logging in, use it to verify the platform/crate tiles in a real render, and settle a conflict: a chat-session entry claimed the tile coordinates were wrong, based on static analysis of `sheet.png`.

## 2. Current state

**What works:**
- `--dart-define=DEV_SKIP_AUTH=true` skips login: router redirect disabled, app opens on character selection (or `DEV_START_ROUTE`, e.g. `/game/pre-colonial/1`). Ignored in release builds (`!kReleaseMode`). Quiz results are dropped (not sent, not queued) in that mode so they can't be flushed to a real student's account.
- **Platform tile constants are correct — no change needed.** The six constants in `tile_platform_component.dart` (lines 25–30), all **(row, col)** into `ground_tileset.png`: topLeft (1,1), topMid (0,1), topRight (1,2), fillLeft (1,3), fill (1,4), fillRight (1,5). Verified by pixel comparison, not by eye:
  - A 3-tile platform composed from exactly these six tiles matches the in-game screenshots with **0 of 1,485 opaque pixels differing**, in three separate frames (two undimmed, one under the quiz overlay). A 4-tile platform matches ~97%; the residue is 1–2 px columns per tile (sub-pixel camera position), and shifting it ±1 px makes it far worse.
  - All six are the orange palette (0 teal pixels each). The teal variant is rows 2–3 of the tileset; nothing in the code uses it.
  - Fill (1,4) is exactly (39,32,52), identical to the body colour of the other five tiles, so there is no seam.
  - (1,1) renders as the left end of the grass block, (0,1) as a grass-topped strip tile (not blank).
- Crates render fine. 30/30 tests pass; analyzer has no warnings/errors (5 pre-existing `info` lints in `login_screen.dart` / `background_history_screen.dart`, untouched).
- Question randomization is **done** (see the next entry).

**What's broken or unfinished:**
- Lowest platforms spawn `groundY - 60` (`enemy_spawner.dart` `_spawnPlatform`), so they can overlap the player's head. Not changed — depends on intended jump/platform gameplay.
- Windows desktop build fails without Windows Developer Mode (plugin symlinks); web build works.

**Earlier chat entry ("tile coordinate correction") — SUPERSEDED, do not apply.** It read the code's (row, col) constants as (col, row). Transposed, its three claims hold exactly: code (0,1) → tile r1c0 is the near-empty one, (1,4) → r4c1 is the crate icon, (1,2) → r2c1 is the teal-palette tile. But the code uses (row, col), and the tiles it really renders are right. Its proposed replacements are also (col, row): pasted into the code as (row, col), "(0,0),(1,0),(2,0)" becomes orange grass + a dark blob tile + teal grass — the palette mix it warned about. Its fill pick (5,5) is (55,44,83), lighter and bluer than the body (39,32,52), and would show as a patch. One finding of that entry does stand, corrected below.

**Source-sheet fact worth keeping:** `ground_tileset.png` is `sheet.png` cropped at **pixel x=111, y=0** (pixel-exact, 0 of 14,336 differ). That is *not* the 16px-aligned "col+7" (x=112): a tile read at `x=16*(c+7)` is 1 px off. To find a tileset tile in the sheet, use x = 111 + 16·col, y = 16·row.

**Files touched:**
- `CHRONO-GAMEAPP/lib/core/constants.dart` — new `DevFlags` (`skipAuth`, `startRoute`)
- `CHRONO-GAMEAPP/lib/core/router.dart` — initialLocation + redirect honor `DevFlags`
- `CHRONO-GAMEAPP/lib/services/api_service.dart` — `submitResult` no-ops in skip mode
- `CHRONO-GAMEAPP/lib/game/components/tile_platform_component.dart` — fill-row wall tiles, non-AA paint (constants unchanged this session)

## 3. Decisions made (and why)
- **Left the six constants alone** — decided by pixel-matching the render, which is the ground truth, over static sheet analysis.
- **Compile-time flag instead of editing/removing auth** — login flow unchanged in normal builds; nothing to revert before shipping.
- **Drop results in skip mode** — a queued result would be flushed to whichever account logs in next.
- **Fill row uses wall tiles (1,3)/(1,5) at the ends, (1,4) in the middle** — (1,4) is interior only; at the ends it made the side border stop after one row.
- **Non-anti-aliased, unfiltered paint for tiles** — tiles are drawn separately at fractional camera positions; AA blended each tile edge with the background, leaving seams. The art is fully opaque, so it was a render issue, not an art issue.

## 4. Things we tried that did NOT work
- **`flutter run -d windows`** — needs Developer Mode; used `-d web-server`.
- **`chrome --headless --screenshot --virtual-time-budget`** — captured only the loading bar; drove Chrome over CDP with a real-time wait instead.
- **Static analysis of `sheet.png` alone (the chat entry)** — tile (row, col) vs (col, row) was ambiguous and nothing checked it against the render.

## 5. Next steps (in order)
1. (Optional) Add a comment above the tile constants: coordinates are (row, col) in `ground_tileset.png`; rows 0–1 orange, 2–3 teal; the tileset is `sheet.png` cropped at x=111 (not col+7).
2. Decide platform gameplay: raise the minimum platform height or make them non-blocking.
3. Write more questions per level (see the next entry).
4. (Optional) Refactor `chrono_game.dart` below 300 lines.

## 6. Constraints & conventions
- **All tile coordinates in this repo are (row, col), 0-indexed from the top-left.** State the order whenever writing a coordinate.
- **Run without login:** `flutter run -d web-server --web-port 8123 --dart-define=DEV_SKIP_AUTH=true --dart-define=DEV_START_ROUTE=/game/pre-colonial/1` (use debug/profile, not release).
- **Do not touch:** `.env` files (live credentials), quiz/HUD behavior.

## 7. Open questions
- Should low platforms stay as-is, or be moved higher / made pass-through?
- Enable Windows Developer Mode so desktop builds work?
- A teal (per-era) platform variant would need its own fill choice, since (3,4) is not a flat tile.
- `sheet.png` (the original sheet) was deleted from the repo on purpose; the game never used it. Re-download from the source link below if needed.

## 8. Attachments / references
- Source art: "A platformer in the forest" by Buch, CC0 — https://opengameart.org/content/a-platformer-in-the-forest (17×8 grid of 16px tiles, 272×128).
- Commits: see git log in `CHRONO-GAMEAPP` (dev no-login mode + tile fixes) and root repo.

---

**Date:** 2026-09-19 (late night — question randomization)
**From:** Claude Code (per-attempt question randomization)
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Stop replays of a level from showing identical questions/option order (HANDOFF next step #1), keeping questions bundled in JSON (offline-first).

## 2. Current state

**What works:**
- `QuestionBank.getQuestions(era, level, {Random? random})` now draws a random subset of the level's pool (up to the level's target), appends placeholders last if the pool is short, and reshuffles every question's options **per call** (per attempt).
- `Question.withShuffledOptions([Random?])` returns a new copy with relabelled A–D and `correctAnswer` remapped by option *position* (the old constructor matched by text, which broke on duplicate option texts). The cached pool is never mutated.
- Analyzer: no issues in changed files (5 pre-existing `info` lints remain in `login_screen.dart` / `background_history_screen.dart`, untouched). 30/30 tests pass (8 existing + 22 new).

**What's broken or unfinished:**
- **No real question variety yet.** Levels 1–9 have 5 questions per JSON but `GameConstants.questionsPerLevel = 10`, so every attempt still pads 5 "Dagdag na tanong…" placeholders; level 10 is 22 of 22. Replays currently only get reordered questions + reshuffled options. Real draws start once a level's JSON has more than 10 questions (level 10: more than 22). User will write the content.
- Not verified in a running game (quiz overlay needs the player to hit an enemy); covered by unit tests, including a test against the real bundled JSON.

**Files touched:**
- `CHRONO-GAMEAPP/lib/models/question.dart` — constructor no longer shuffles; added `withShuffledOptions`
- `CHRONO-GAMEAPP/lib/data/question_bank.dart` — `selectQuestions`, `_targetCount`, placeholder helper, per-call shuffle
- `CHRONO-GAMEAPP/test/models/question_test.dart`, `test/data/question_bank_test.dart`, `test/data/question_bank_loaded_test.dart` (new)

## 3. Decisions made (and why)
- **Plain random draw, no "recently seen" tracking** — would need Hive persistence; not worth it until pools are larger.
- **Kept `questionsPerLevel = 10`** — user will add questions instead of shortening levels.
- **Shuffle the whole level-10 pool, then let `chrono_game.dart` split warm-up/boss** — all level-10 questions are `medium` and untagged, so there is no warm-up/boss distinction to preserve. `chrono_game.dart` untouched.
- **Corrected earlier wording**: the spawner never repeats a question within one run; the real issue was identical replays. Options were already shuffled, but only once per app launch (constructor + cached pool).

## 4. Things we tried that did NOT work
- Nothing failed this session.

## 5. Next steps (in order)
1. Write more questions per level in `assets/data/questions_<era>.json` (target: more than 10 for levels 1–9, more than 22 for level 10). Source `correctAnswer` can stay "A" — it is reshuffled at runtime.
2. Decide platform gameplay (low platforms overlap the player's head) — still open (see the tile verification entry above).
3. (Optional) Refactor `chrono_game.dart` below 300 lines.

## 6. Constraints & conventions
- Run without login: see the tile verification entry above.
- **Do not touch:** `.env` files, quiz/HUD behavior.

## 7. Open questions
- Same as the tile verification entry above: platform height; Windows Developer Mode.

---

## Older entries (folded)
- 2026-09-19 (evening) — Added ground/crate tile art, registered the root repo submodules in `.gitmodules`, unified git identity. Its tile coordinates were later checked in a real render and are correct (see top entry).
- 2026-09-19 (baseline) — Camera/world rebuild (Phases 0–5) finished: player `worldX`, camera follow, parallax speed fix, level-end fix. 8 tests passing. `chrono_game.dart` is still over the 300-line budget.

<!-- Older entries, folded to one line each, go here once the file gets long:
- 2026-09-10 — Set up auth flow, decided on JWT over sessions
-->

---

# Copy-paste prompts

**End of a chat session (ask Claude in chat):**
> Fill in a new dated HANDOFF.md entry from this conversation, for Claude Code. Be concise. Include exact file paths, decisions with reasons, and what failed. Output it as a single markdown block I can paste in at the top of the file.

**Start of a Claude Code session:**
> Read HANDOFF.md (top entry = most recent) and CLAUDE.md first. Summarize the goal and next steps in 3 lines, then start on step 1.

**End of a Claude Code session:**
> Add a new dated entry at the top of HANDOFF.md: what changed (files), what's working, what's broken, decisions made, and next steps. Keep it under one page. If there are more than 4 entries, fold the oldest into a one-line summary at the bottom.

**Start of a chat session (paste the file, then say):**
> Here's my HANDOFF.md from Claude Code — top entry is the latest. Continue from it. Help me with: ...

---

# CLAUDE.md starter (permanent context; changes rarely)

```
# Project
Name / one-line description

# Stack
Languages, frameworks, versions

# Conventions
Naming, folder structure, state management, testing

# Commands
How to run, test, build

# Current priorities
Top 3 goals (update when they change)

# Rules
- Read HANDOFF.md (top entry) at the start of every session.
- Add a new dated entry to the top of HANDOFF.md before ending a session.
```
