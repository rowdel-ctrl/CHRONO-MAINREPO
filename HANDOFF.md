# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-22 (adaptive screen: fixed-resolution viewport + quiz card fit)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Finish the adaptive-screen work the entry below only diagnosed: make the game world actually scale to the device, then fix the quiz card so it fits a phone.

## 2. Current state

**Committed in CHRONO-GAMEAPP (not pushed):**
- `6edfb47` — **fixed 1280×720 virtual resolution.** `ChronoGame` now builds with `CameraComponent.withFixedResolution(width: 1280, height: 720)`. Flame scales that virtual canvas to the real device, so an 80px sprite covers the same screen fraction everywhere (11%, matching the desktop window that already looked right) instead of ~22% on a phone. `ParallaxBackground` moved to `camera.backdrop` — a direct game child renders in raw canvas pixels and would drift from the scaled world. `groundY`/`cameraRightEdgeX` needed no code change: `FlameGame.size` is the viewport's virtual size in this Flame version, so both became device-independent automatically.
- `e858348` — **quiz card fits a landscape phone.** It was a fixed 500px column in a scroll view, tuned for ~720px windows; at ~360-412px phone heights it scrolled, leaving options C/D below the fold with the timer still running. `QuestionLayout` (new) picks compact metrics below a 560px overlay height and regular ones above it, so the desktop card is pixel-identical to before. `QuestionCard` (new) also wraps the card in `FittedBox(scaleDown)` as a safety net for whatever compact still doesn't cover — a long explanation, a large system font; it only shrinks, never grows, and taps still land through the transform. Split `question_overlay.dart` (275→140 lines) into `question_layout.dart` and `question_card.dart`; `question_widgets.dart`'s existing widgets now take an optional `QuestionLayout` (default `regular`), so its own tests needed no changes.

**Verified on both:** analyzer at the 5 known `info` lints; 79/79 tests (4 new in `fixed_resolution_test.dart`, 27 new in `question_card_test.dart` — including a mutation check: forcing `regular` onto phone heights drops the wrong-answer card to 0.64-0.67 scale and fails the suite, confirming the tests catch the original bug). Confirmed in real runs: the world measured 699×393 centred with 87px bars at a real 873×393 viewport; the quiz card shows all 4 options with no scroll before answering, and after a wrong answer the MALI! badge, marked options, explanation and SUSUNOD button are all on screen at once — tapping SUSUNOD advances the level normally.

**What's unfinished:**
- The gap system still never fires (`GroundSpawner.update()` is empty) — unrelated to this work, carried from the entry below.
- Dead `WallComponent` collision branch at `player_component.dart:181` — cosmetic, carried from the entry below.
- Level 10 boss fight still not playtested.
- Wide phones (~20:9) lose about 20% of screen width to pillarbox bars under the fixed 16:9 viewport — the tradeoff of this approach, not a bug. Fitting height only would fill the screen but needs re-checking spawn timing, since `cameraRightEdgeX` would then vary by device.
- Uncommitted: `CHRONO-GAMEAPP/tool/cdp_shot.js` (now scripted: `--viewport WxH --steps "wait:N;click:x,y;shot:file.png"`) and `quiz_card_phone_preview.png`.

## 3. Decisions made (and why)
- **`GameConstants.virtualWidth/Height` were added, then the `chrono_game.dart` getters that used them were reverted to plain `size.x`/`size.y`.** Flame 1.37's `FlameGame.size` is `camera.viewport.virtualSize`, not the device canvas — once the viewport is set, `size` already *is* 1280×720 everywhere. A second hardcoded copy would silently diverge if the resolution ever changed in one place and not the other.
- **Compact-layout threshold is a 560px overlay height, not a device list** — a phone in any orientation or a small desktop window both get the phone treatment, which is correct either way.
- **`FittedBox(scaleDown)` kept as a second layer under the compact/regular split, not relied on alone** — scaling everything down for every phone would make already-short questions needlessly tiny; the two presets cover the common case, the FittedBox only catches the tail (long explanations, accessibility font sizes).

## 4. Things we tried that did NOT work
- **Hardcoding `virtualWidth`/`virtualHeight` into `groundY` and `cameraRightEdgeX`** — worked, but was redundant once traced into the Flame source (`flame-1.37.0/lib/src/game/flame_game.dart:121`); reverted to reading `size` directly, see section 3.
- **Judging pillarbox width from a screenshot without checking its actual pixel dimensions** — an early phone-size Chrome window screenshotted at 796×280 (2.84:1, not the requested 812×375), which exaggerated the bars. `--window-size` includes browser chrome and isn't 1:1 with the page viewport. Switched `cdp_shot.js` to `Emulation.setDeviceMetricsOverride` for exact dimensions, confirmed by measuring the output PNG's pixels directly.

## 5. Next steps (in order)
1. Remaining adviser items (see the living checklist entry below for current status): hit animation on correct answer, idle animation, background depth layer, bigger sprite (now unblocked), hearts regen, tutorial, enemy/obstacle variety.
2. Level 10 boss fight playtest.
3. Decide whether to keep `tool/cdp_shot.js` (untracked; useful for future playtesting without a person).

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- **Definition of perfect** (see entries below): real run + all tests + no new analyzer issues + nothing else broken + line budgets. One item at a time.
- Playtest without a person: start the dev server from PowerShell (not Git Bash), wait for `lib\main.dart is being served`, launch headless Chrome with `--remote-debugging-port=9222`, then `node tool/cdp_shot.js --viewport WxH --steps "wait:N;click:x,y;shot:file.png"` (steps run in order; omit `--viewport` to use the window's own size).

---

**Date:** 2026-09-21 (screen-size finding + crate obstacles + tiled ground)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Answer why the ground was not tiled like the platforms, swap obstacle art to crates, and check whether the game adapts to screen size (user: too big on their phone).

## 2. Current state

**Committed in CHRONO-GAMEAPP (not pushed):**
- `022221a` — **all ground obstacles are crates.** `_spawnWall()` and the `wall_component.dart` import are gone from `enemy_spawner.dart`; both timers (`_crateTimerA` 3–7 s, `_crateTimerB` 4–8 s) spawn `CrateComponent`, so the combined obstacle cadence is unchanged. `WallComponent` and the 5 `obstacles/*_wall.png` stay in the repo, unused — easy revert.
- `04bc0a1` — **the ground is tiled.** `GroundSection` (`gap_component.dart`) draws the grass cap from `ground_tileset.png` over a flat per-era body; `GroundComponent` is deleted.

**Verified on both:** analyzer at the 5 known `info` lints, 48/48 tests (9 new in `test/game/ground_tiling_test.dart`), and each seen in a real run over CDP — not tests alone.

**Screen size: the game does NOT adapt.** No fixed-resolution viewport, no camera zoom; the world uses raw device pixels. Hardcoded logical px: player 64×80, enemy 60×72, boss 120×140, crate 36, coin 28, ground band 60; jump peak ~128; platform heights 60–105. Only the layout stretches (`groundY` from canvas height; width capped at `maxAspectRatio`, `game_screen.dart:81`). A landscape phone is ~360–412 logical px tall, so the 80 px player is ~22% of the phone screen vs ~11% at 1280×720 — that is the "too big". The quiz card is capped at 500 px wide with fixed fonts (`question_overlay.dart:131`), over 100% of a phone's height.

**What's unfinished:**
- **Adaptive screen — next step, not started** (section 3).
- **The gap system never fires.** `GroundSpawner.update()` is empty and one section spans the whole level, which is why falling into a gap has never been playtested. Deleting `GroundComponent` unblocked it — a gap would previously have been painted over by the screen-space band.
- Dead `WallComponent` collision branch at `player_component.dart:181`.
- Level 10 boss fight still not playtested. `level_failed_screen.dart` shows 3 empty hearts while the game gives 10.
- Uncommitted: `CHRONO-GAMEAPP/tool/cdp_shot.js` (CDP screenshot driver) and two scratch PNGs (`ground_tiled_preview.png`, `ground_cap_preview.png`).

## 3. Decisions made (and why)
- **Adaptive screen = `FixedResolutionViewport` at 1280×720**, the resolution everything was tuned at. Every device then renders like the desktop window that already looks right; all hardcoded sizes stay and scale together. `game.size` becomes constant, so `groundY` stops being device-dependent. Wide phones (~20:9) letterbox. **Do this before the "bigger sprite" adviser item** or that gets tuned twice. HUD and quiz overlay are Flutter widgets on top and still need their own `MediaQuery` pass.
- **Only the top 9 px of the ground cap tile is drawn.** From row 9 down, tile (0,1) is flat (39,32,52), and a dump of all 56 tiles showed the sheet has **no dirt tile at all** — every body tile is dark purple/navy. Tiling the full 60 px band made the ground read as a black void and flattened all five eras to one colour, so the body keeps the per-era colour instead.
- **`GroundComponent` deleted, not tiled.** It rendered on top of the world (added after `world`), so it would have hidden the tiled ground; a screen-space texture would sit frozen while the level scrolled; and it painted over any gap. Its field was never read and `updateSize()` never called.
- **Ground starts at world x = -200** (`GroundSpawner.startX`): the camera opens at `-playerX`, so ground starting at 0 leaves a strip of empty background under the player.
- **Crates keep two timers** instead of merging into one, to preserve the original combined cadence exactly.

## 4. Things we tried that did NOT work
- **Tiling the whole ground band** with the sheet's fill tile — near-black slab, era colours lost. Replaced with cap-over-body before committing.
- **Judging the ground from a screenshot with the quiz overlay up.** The overlay's dimming scrim makes everything look dark; a clean shot after answering was needed to tell art from scrim.
- **HANDOFF's "nothing is committed yet" for steps 1-2 was stale** — `2bd73e6` and `722d14c` were already in and root `e2cb13c` had bumped the submodule. Check `git log` before trusting that line.

## 5. Next steps (in order)
1. **Adaptive screen:** `FixedResolutionViewport(1280, 720)`. Then recheck platform heights, landing and `platform_layering_test.dart`, and look at the quiz card in a phone-shaped window.
2. Remaining adviser items: hit animation on correct answer, idle animation, background depth layer, bigger sprite, hearts regen (5 max), tutorial, enemy/obstacle variety (a real crate/barrel/rock set, since every obstacle is now the same crate).
3. Decide whether to keep `tool/cdp_shot.js`.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- **Definition of perfect** (unchanged, see the entry below): real run + all tests + no new analyzer issues + nothing else broken + line budgets. One item at a time.
- Playtest without a person: start the dev server (command in the tile verification entry, from PowerShell not Git Bash), wait for `lib\main.dart is being served`, launch headless Chrome with `--remote-debugging-port=9222`, then `node tool/cdp_shot.js <out.png> [waitSeconds] [clicks] [x] [y]`.

---

**Date:** 2026-09-21 (adviser items: step 1 refactor + step 2 answer feedback)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal

Do plan steps 1 and 2: get `chrono_game.dart` under 300 lines, then replace text-only right/wrong feedback with icons.

## 2. Current state

**What works:**

- **Step 1 (refactor):** `chrono_game.dart` is 357 → 280 lines. The question flow (`showQuestion`, `showBossQuestion`, `handleAnswer`) moved unchanged to `lib/game/quiz_handler.dart` as an extension. The three duplicated life-loss blocks are now one `loseLife()` (returns true when the level failed). Playtested level 1: obstacle hits, correct answers, wrong answers and running out of hearts all behave as before.
- **Step 2 (feedback icons):** after answering, a pop-in "TAMA!" (green check) or "MALI!" (red X) badge appears centred in the question header. The correct option gets a check and a wrong pick gets an X in the button's corner. Sounds, 800 ms auto-close on correct, and the wrong-answer explanation are unchanged. Playtested both paths in a real run.
- `question_overlay.dart` was already 440 lines, so the answer button, explanation panel, timer chip and power-up button moved to `lib/game/overlays/question_widgets.dart` (overlay now 275).
- 39/39 tests pass (6 new in `test/game/answer_feedback_test.dart`). Analyzer: only the 5 old `info` lints.

**What's unfinished:**

- Not playtested: the level 10 boss fight (10 warm-up questions first; its code moved unchanged) and falling into a gap (none came up).
- `level_failed_screen.dart` shows 3 empty hearts while the game gives 10 (pre-existing; fix in the hearts step).
- ~~Nothing is committed yet.~~ **Committed** as planned: `2bd73e6` (refactor) and `722d14c` (answer feedback) in CHRONO-GAMEAPP, with root `e2cb13c` bumping the submodule. `build/` is gitignored (`.gitignore:33`), so the APK was never staged. Not pushed.

**APK:** a release APK was built from this state (85.6 MB, `CHRONO-GAMEAPP/build/app/outputs/flutter-apk/app-release.apk`) for playtesting on a phone. It talks to the deployed backend `chronoquest-backend.vercel.app` (not checked that it's up), so it needs a real student login; `DEV_SKIP_AUTH` only works in debug builds. Still 10 hearts per level. Signed with the debug key unless a release keystore exists. Not yet tried on a device: check touch, screen size, and whether the quiz card feels cramped (only checked at 1280x720).

**Files touched (CHRONO-GAMEAPP):**

- `lib/game/chrono_game.dart`, `lib/game/quiz_handler.dart` (new)
- `lib/game/overlays/question_overlay.dart`, `question_widgets.dart` (new), `answer_feedback.dart` (new)
- One import line each in `lib/game/components/boss_component.dart`, `player_component.dart`, `lib/screens/game/game_screen.dart`
- `test/game/answer_feedback_test.dart` (new)

## 3. Decisions made (and why)

- **Max hearts will be 5** (user decision), regenerating 1 per 10 minutes (50 min for a full set). The code currently gives 10 per level (`GameConstants.livesPerLevel`), not 3 as the entry below assumed.
- **Answer icons sit in the button corner, not beside the text.** Beside the text they took 44 px of width and made options wrap or truncate sooner.
- **The badge is no taller than the header chips**, so it doesn't push the card down when it appears.
- **Widget tests set `GoogleFonts.config.allowRuntimeFetching = false`**: tests have no network.

## 4. Things we tried that did NOT work

- **Rewriting a Dart file with PowerShell `Get-Content`/`Set-Content`** corrupted the UTF-8 box-drawing characters in comments. Use the Edit tool or `sed` from Git Bash.
- **`getMaxScaleOnAxis()` to read a scale-0 transform** returns 1 (it counts the z axis). Read `transform.storage[0]` instead.

## 5. Next steps (in order)

1. User: playtest the APK on the phone (level 10 boss included), then OK steps 1-2. Then commit as planned above.
2. Step 3: hit animation on correct answer (`EnemyComponent.defeat()`).
3. Then idle animation, background depth layer, bigger sprite, hearts regen (5 max), tutorial, enemy variety.

## 6. Constraints & conventions

- Same as the entry below. Playtesting without a person: run the dev server from PowerShell, start headless Chrome with `--remote-debugging-port=9222`, and drive it over CDP (screenshot + mouse clicks). Wait for `lib\main.dart is being served` first; the first question appears about 30 s after load.

---

**Date:** 2026-09-21 (adviser feedback review)
**From:** Claude chat (planning only, no code changed)
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Turn the adviser's game-mechanics feedback into an ordered plan, checked against the current codebase.

## 2. Current state

**What works:**
- Nothing changed in code this session. Codebase is as in the 2026-09-19 entries (33/33 tests, randomization done, platform layering fixed).

**Adviser's list (status checked against the code on 2026-09-21; 1 of 8 done):**
- [ ] Tutorial screens like other games — not started (no tutorial or "How to play" code exists)
- [ ] Hit/attack animation when an enemy is beaten with the correct answer — not started (`EnemyComponent.defeat()` only plays the sound and calls `removeFromParent()`)
- [ ] Hearts/lives regenerate over time (not jump back to 3) — not started (`GameConstants.livesPerLevel = 10`, no regen logic; decided max is 5)
- [ ] More enemy/obstacle variety — not started, and currently *less* varied: all ground obstacles are now the same crate (`022221a`)
- [ ] Bigger character sprite — not started; no longer blocked, its viewport prerequisite is done
- [ ] Simple 2D idle animation for the character — not started (the only idle animation is the bobbing avatar on the character selection screen, not the in-game player)
- [ ] Extra translucent/low-opacity background depth layer — not started
- [x] Visual/icon feedback for right/wrong answers instead of plain text — **done** (`722d14c`: check/X icons and TAMA!/MALI! badge)

Related, not on the adviser's list: the fixed 1280×720 virtual resolution is **done** (`6edfb47`), the prerequisite for the bigger-sprite item — platform heights and `platform_layering_test.dart` needed no change, since that tuning was already in world units and the viewport only changes how those units map to the screen. The quiz card also **now fits a landscape phone** (`e858348`).

**Still unfinished from before:** question content. Levels 1-9 have 5 questions each but need more than 10; level 10 needs more than 22. Until then replays still pad with placeholders.

**Files touched:** none.

## 3. Decisions made (and why)
- **The "do not touch quiz/HUD behavior" rule is lifted for the adviser items only** (feedback icons, hit animation, tutorial). They cannot be done without touching quiz/HUD. This overrides the older entries below.
- **Refactor `chrono_game.dart` before the UI work.** It is over the 300-line budget (351 last recorded; recheck) and the feedback icons and hit animation touch the quiz logic in that file.
- **Bigger sprite is not a quick win.** Platform heights were tuned for an 80 px player and a ~128 px jump peak (`platformMaxHeight = 105`, and `test/game/platform_layering_test.dart` requires a 15 px margin). After resizing, recheck spawn heights, ground landing, and those tests.
- **Background depth layer must stay behind platforms and slower than the world.** Platforms draw at `renderPriority = -1`, parallax layers at -10. Faster than the world would invert the depth again (the Phase 3 bug).
- **Hearts regen: 1 heart every 10 minutes** (30 minutes for a full 3). Keep it as a single constant so it is easy to change after playtesting.
- **Regen timer: backend is the source of truth, with a local copy.** Store the heart count and the time it last changed (no live countdown); on app open, work out how many hearts came back since then. When online and logged in, use the backend value so changing the phone clock can't cheat it. Keep a local copy (Hive) for offline play and for `DEV_SKIP_AUTH` testing, and sync to the backend when online. Check whether CBACK already stores hearts; if not, add a field and endpoint.
- **Tutorial: show on first play, and also replayable** from a "How to play" button in a menu. Same screens for both. Build it from existing sprites and Flutter icons; no new art needed.

## 4. Things we tried that did NOT work
- Nothing failed this session.

## 5. Next steps (in order)
**Rule: one step at a time. Do not start the next step until the current one is perfect (see "Definition of perfect" in section 6).**

1. User writes more questions in `assets/data/questions_<era>.json` (can run alongside the code work).
2. Check the current line count of `chrono_game.dart`, then refactor below 300 lines (extract level/quiz-state logic).
3. Quick wins: right/wrong visual feedback, hit animation on correct answer, idle animation, background depth layer.
4. Bigger sprite, then recheck platform heights, landing, and the platform_layering tests.
5. Hearts regen and tutorial screens (decisions are in section 3).
6. Enemy/obstacle variety: start with 2-3 new ones. (Optional: coins or crates on platforms, still open from before.)

## 6. Constraints & conventions
- **Do not touch:** `.env` files (live credentials).
- Quiz/HUD may be changed only for the adviser items above.
- **Work one item at a time, in order.** Do not move to the next item until the current one is perfect. Also do not mix two items in one change.
- **Definition of perfect:** it works in a real run (screenshot or playtest, not just tests), all tests pass, analyzer has no new issues, nothing else broke (quiz, HUD, hearts, level flow), and every file stays within the line budget. If any check fails, fix it before moving on. When it passes, report what was checked and wait for the user's OK before starting the next item.
- Tile coordinates stay (row, col). Run the no-login dev command from PowerShell (see the tile verification entry).

## 7. Open questions
- None right now. Heart regen time, tutorial behavior, and timer location are decided in section 3.

## 8. Attachments / references
- Adviser consultation list is copied in section 2 above.

---

## Older entries (folded)
- 2026-09-19 (tile verification) — Confirmed by pixel comparison (0 of 1,485 opaque pixels differ) that the platform tile constants in `tile_platform_component.dart` were already correct as (row, col) into `ground_tileset.png`; a chat-session entry claiming otherwise had transposed the coordinates and was superseded. Added `DevFlags`/`DEV_SKIP_AUTH` for no-login testing (results dropped in that mode, so they can't be flushed to a real account). Worth keeping: `ground_tileset.png` is `sheet.png` cropped at pixel x=111 (not the 16px-aligned x=112); tiles are drawn non-anti-aliased to avoid seams between fractional-position draws. 30/30 tests.
- 2026-09-19 (platform height and layering) — Platforms were never solid; `player_component.dart` only lets the player land on top, so the head overlap was purely a draw-order bug. Fixed with `TilePlatformComponent.renderPriority = -1` and by narrowing spawn heights to `platformMinHeight = 60` / `platformMaxHeight = 105` (the jump peaks at ~128 px = jumpForce²/2·gravity), guarded by `test/game/platform_layering_test.dart`. Decided to keep platforms one-way and not to touch jump force. Two gotchas worth keeping: run the dev command from PowerShell, since **Git Bash rewrites `--dart-define=DEV_START_ROUTE=/game/...` into `C:/Program Files/Git/game/...`** and the router 404s; and never screenshot before the log prints `lib\main.dart is being served`, or the page stays blank white until the server is restarted.
- 2026-09-19 (question randomization) — `QuestionBank.getQuestions` now draws a random subset per attempt and reshuffles options per call (`Question.withShuffledOptions` remaps `correctAnswer` by position). No real variety yet: levels 1–9 have 5 questions but need >10, level 10 has 22 of 22, so replays still pad placeholders until the user writes more content. 30/30 tests. Files: `models/question.dart`, `data/question_bank.dart`, + new tests.
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