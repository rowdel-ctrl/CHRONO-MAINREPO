# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-22 (persistent hearts regen)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement the adviser's "hearts regen" item: a persistent pool of hearts (max 5, +1 every 10 minutes of real time, survives app restarts) that gates starting or retrying a level. Decided in an earlier session ("hearts regen at 1/10min capped at 5" — see the folded entries below) but not yet built.

## 2. Current state

**Not yet committed in CHRONO-GAMEAPP:**
- New `lib/models/hearts_state.dart` — a pure, unit-tested `HeartsState` (an `int count` + a nullable regen-anchor epoch-ms timestamp) with `regenerated(now)`, `consumed(now)`, `afterLevelFailed(now)` (regen-then-consume in one step, so call sites can't forget the ordering), and `timeUntilNext(now)`. Regen is computed lazily from the stored timestamp against `DateTime.now()` rather than a running `Timer`, so it keeps accruing while the app is closed — this codebase had no prior wall-clock-persisted-timer pattern (repo-wide `DateTime.now()` grep was previously empty; the only existing `Timer` was `question_overlay.dart`'s per-widget 1s countdown, which doesn't survive being closed).
- `lib/core/constants.dart` — added `GameConstants.maxHearts = 5` and `GameConstants.heartRegenInterval = Duration(minutes: 10)`.
- `lib/services/storage_service.dart` — two new flat Hive keys (`hearts_count`, `hearts_regen_start_ms`), matching the existing `hasSeenTutorial`/`markTutorialSeen` style exactly (no `@HiveType` adapter — nothing else in this file uses one either).
- `lib/providers/game_provider.dart` — added `GameState.hearts`, loaded once in `GameNotifier`'s constructor (regen applied immediately on app open, mirroring the existing `_loadCharacter()` pattern), plus `refreshHearts()` (re-applies regen, for a live countdown), `canStartLevel`, and `consumeHeartOnLevelFailed()`.
- `lib/screens/game/game_screen.dart` — `onLevelFailed` now calls `consumeHeartOnLevelFailed()` before navigating, alongside the existing `awardPowerUp` call on the complete path.
- `lib/screens/game/level_select_screen.dart` (now `ConsumerStatefulWidget`) — shows the hearts row plus a live "Susunod: M:SS" countdown (a 1s `Timer.periodic` calling `refreshHearts()`, mirroring `question_overlay.dart`'s countdown); tapping a progression-unlocked level at 0 hearts shows a dialog instead of navigating (styled like `pause_overlay.dart`'s existing quit-confirm `AlertDialog`).
- `lib/screens/game/level_failed_screen.dart` (now `ConsumerWidget`) — **also fixes the long-standing bug** where this screen hardcoded `List.generate(3, ...)` empty hearts regardless of the real count (noted in three prior HANDOFF entries); now shows the actual persistent-pool count out of 5, and disables "ULIT" with a countdown message at 0 hearts.
- `lib/screens/game/level_node.dart` — the per-level-node widget extracted out of `level_select_screen.dart`, which the above pushed to 364 lines (over this project's 200-300 budget); pure refactor, no behavior change, brought it back to 273.
- New `test/models/hearts_state_test.dart` — covers regen timing (partial progress preserved across calls, multiple elapsed intervals applied at once, capping at max), consume (floors at 0, doesn't reset an already-running countdown on a second consume), and `afterLevelFailed`'s regen-before-consume ordering.

**Explicit design decision (asked the user — the old "capped at 5" note didn't say how this interacts with in-level mistakes):** in-level HP (`GameConstants.livesPerLevel`, still 10, still resets every attempt) is **unchanged** — wrong quiz answers, obstacle hits, and gap falls behave exactly as before. The new persistent pool only loses a heart when a level is *fully* failed, and only gates *starting or retrying* a level, not individual in-level mistakes. Explicitly rejected shrinking the existing per-mistake pool from 10 to 5 directly, since obstacles spawn every 3-8 seconds and would have drained a shared 5-heart pool almost immediately, risking locking a classroom out for up to 40 minutes mid-lesson.

**Verified:** `flutter analyze` clean at the same 5 known info lints (3 new info lints introduced by this work — 1 missed `const` in `hearts_state.dart`, 2 in the new test file — were fixed before landing at that baseline). `flutter test test/data test/game test/models`: **92/92 pass**, including all 13 new `hearts_state_test.dart` cases. Confirmed in real runs over CDP (1280×800, `DEV_SKIP_AUTH`+`DEV_START_ROUTE`): `/level-select/spanish` renders 5/5 full hearts with no countdown text (pool full → `timeUntilNext` correctly null); `/level-failed/spanish/1` renders the real heart count via the asset icons instead of the old hardcoded 3 empty `Icons.favorite_border`, with "ULIT" enabled. Did **not** force the pool down to 0 for this playtest — reaching that branch for real needs either 5 genuine level failures (no fixed click coordinates to script blindly through 10 HP of quiz/obstacle mistakes) or throwaway debug scaffolding, neither of which seemed worth it given `HeartsState`'s exhaustive unit tests already cover that branch's math and the render/gating code is a direct, symmetric read of the same tested object.

**New finding — `test/screens/tutorial_screen_test.dart` doesn't just flake, it hard-hangs in this environment:** running the full unscoped `flutter test` cost 20 minutes for nothing — its first two tests each hit a full `TimeoutException after 0:10:00: Test timed out after 10 minutes`, then a third was killed mid-run. The parallax-background entry below already documented this file's `google_fonts` real-network-font-fetch issue as an *intermittent, fast-rejecting* flake; in this sandbox (no network route) it instead hangs for the entire 10-minute test timeout, twice in a row, before anything else in the file gets a chance to run. It also has a nasty side effect: because `flutter test` doesn't guarantee alphabetical file order, `test/models/hearts_state_test.dart` (this session's new file) never even started before the 20 minutes were up — it only got verified by explicitly re-running `flutter test test/data test/game test/models`, which skips `test/screens/` entirely. **Until this is fixed, don't run a bare `flutter test` and wait — scope it to specific directories, or expect to lose up to 20 minutes per run.**

**What's unfinished:**
- No real playtest yet: still need to confirm a level failure actually decrements the count shown on `level_failed_screen.dart`, that the level-select countdown ticks, and that the 0-hearts dialog/disabled button actually appear. Forcing 0 hearts needs either 5 real failures or a temporary debug hook; plan is to trust the unit-tested math above and confirm the wiring via one real failure, since all 5 would exercise the identical `consumeHeartOnLevelFailed()` path.
- Not committed, not pushed.
- **`test/screens/tutorial_screen_test.dart`'s network-fetch hang is not fixed** — likely needs `GoogleFonts.config.allowRuntimeFetching = false` set somewhere tests actually load (e.g. a `flutter_test_config.dart`, which doesn't exist yet), but that's unrelated to hearts regen and wasn't attempted here. Flagging as a strong candidate for its own session given it now costs a full 20 minutes whenever someone runs the unscoped suite.
- Remaining adviser items (4 of 8 once this lands): hit animation on correct answer, idle animation, bigger sprite, enemy/obstacle variety.
- Level 10 boss fight playtest — still never done, carried across every entry below.

## 3. Decisions made (and why)
- **Hearts gate level attempts only, not in-level mistakes** — see the design-decision paragraph above; the user picked this explicitly over "hearts replace in-level HP entirely" and "track hearts, never block play."
- **Regen math lives on a pure `HeartsState` model (`regenerated`/`consumed`/`afterLevelFailed`), not inline in the provider or inside a Hive `TypeAdapter`** — keeps the timing math unit-testable without Hive/Flutter bindings, and matches this codebase's existing pattern of pure transform methods on models (`Question.withShuffledOptions` remaps `correctAnswer` by position the same way).
- **`GameNotifier` owns hearts state, not `ChronoGame`** — hearts need to be visible on `level_select_screen.dart`, outside any live `ChronoGame` instance, and `GameNotifier` already had the "load from `StorageService` in the constructor" pattern (`_loadCharacter`) to mirror.
- **`level_select_screen.dart` split into `level_node.dart`** — see "Current state" above; a pure extraction to stay under the line budget, not a behavior change.

## 4. Things we tried that did NOT work
- (None yet — this entry is implementation-only; real-run verification is still pending, see "What's unfinished.")

## 5. Next steps (in order)
1. Confirm `flutter test` is green (it was still running in the background when this was written).
2. Real CDP playtest: fail a level once, confirm `level_failed_screen.dart` shows 4/5 hearts (not the old hardcoded 3), confirm the level-select countdown displays and ticks down.
3. Commit and push.
4. Remaining adviser items: hit animation on correct answer, idle animation, bigger sprite, enemy/obstacle variety.
5. Level 10 boss fight playtest.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- Same playtest recipe as the entries below: PowerShell dev server on port 8123, `tool/cdp_shot.js` against CDP debug port 9222.

---

**Date:** 2026-09-22 (shared 4-layer parallax background)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Replace the per-era parallax background art with one shared 4-layer background (user-supplied) used across all eras — this also satisfies the adviser's "extra translucent/low-opacity background depth layer" item.

## 2. Current state

**Committed in CHRONO-GAMEAPP:**
- `742f028` — `lib/game/components/parallax_background.dart` now loads 4 fixed layers for every era instead of per-era `_far`/`_near` pairs: `parallax-forest-back-trees.png`, `parallax-forest-middle-trees.png`, `parallax-forest-lights.png` (the new depth layer — translucent light rays), `parallax-forest-front-trees.png`, all in `assets/backgrounds/`. `velocityMultiplierDelta` changed from `(2.2, 1.0)` (tuned for 2 layers) to `(1.4, 1.0)` (4 layers), per the user's supplied snippet. Removed the now-dead `_backgroundAssetKeyForEra` era lookup; the dynamic camera-re-anchoring `update()` logic (drives `baseVelocity` from real camera movement each frame) is unchanged. Deleted the 10 now-unused per-era PNGs: `precolonial/spanish/american/ww2/modern` × `_far`/`_near`.
- `pubspec.yaml` needed no change — `assets/backgrounds/` was already declared as a whole folder.

**Verified:** analyzer at the same 5 known `info` lints; `parallax_background_test.dart` (2/2) unaffected — it injects an empty-layer `Parallax` directly, so it covers only the velocity math, not asset loading. Confirmed in a real run: a CDP screenshot at 1280×720 on the Spanish-era level 1 shows all 4 layers rendering with correct depth (far trees + glowing sky, mid trees, translucent light rays, big dark front trunks). Full suite otherwise green; one pre-existing failure in `tutorial_screen_test.dart` belongs to separate uncommitted tutorial-screen work already sitting in the tree before this session (`lib/screens/tutorial/`, `test/screens/`, edits to `router.dart`/`storage_service.dart`/`character_selection_screen.dart`) — not touched here.

**What's unfinished:**
- Not pushed yet.
- Only checked at 1280×720 — not explicitly reverified at phone aspect ratios this session (the fixed-resolution viewport from the entry below should make this a non-issue).

## 3. Decisions made (and why)
- **One shared background for all eras, not five separate sets** — user-directed: supplied a single 4-layer forest set to replace the per-era pairs entirely rather than matching it into the old per-era naming scheme.
- **Old per-era PNGs deleted, not left unused** (user decision) — a single shared background no longer needs per-era lookup, so keeping them around had no benefit.
- **`velocityMultiplierDelta` set to `(1.4, 1.0)`**, per the user's supplied snippet, so each of the 4 layers scrolls a bit faster than the one behind it.

## 4. Things we tried that did NOT work
- **`--viewport WxH` with `$(pwd)` as the `cdp_shot.js` output path** — Git Bash path-mangling turned `$(pwd)` into a doubled `F:\f\CHRONO\...` path. Use a relative filename instead.
- **`taskkill /IM chrome.exe` during cleanup** — kills *all* Chrome processes system-wide, not just the headless instance started for the screenshot. Find the specific PID instead (`netstat -ano` on the debug port) and kill that.

## 5. Next steps (in order)
1. Push this commit (and the tutorial-screens one in the entry below).
2. Remaining adviser items: hit animation on correct answer, idle animation, bigger sprite, hearts regen, enemy/obstacle variety.
3. Level 10 boss fight playtest (carried from the entry below).

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- Playtest without a person: start the dev server from PowerShell on **port 8123**, not any other port — `tool/cdp_shot.js` hardcodes `:8123` for the game and `:9222` for the CDP debug port. Wait for `lib\main.dart is being served`, launch headless Chrome with `--remote-debugging-port=9222`, then `node tool/cdp_shot.js --viewport WxH --steps "wait:N;shot:file.png"` (relative output path, not `$(pwd)`).

---

**Date:** 2026-09-22 (how-to-play tutorial)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement the adviser's "tutorial screens" item: shown on first play, replayable from a menu button, same screens for both.

## 2. Current state

**Committed in CHRONO-GAMEAPP:**
- `69605d3` — new `lib/screens/tutorial/tutorial_screen.dart` (322 lines), a 6-step `PageView` (character, obstacles/enemies, coins/artifacts, quiz check/X, hearts, power-ups), built entirely from sprites and icons that already exist elsewhere in the game, including the real TAMA!/MALI! check/X icons from `answer_feedback.dart` — no new art. `lib/services/storage_service.dart` gets `hasSeenTutorial()`/`markTutorialSeen()`, mirroring the existing `getCharacter`/`saveCharacter` Hive pattern. `lib/core/router.dart` gets a `/tutorial` route. `lib/screens/home/character_selection_screen.dart` auto-launches it once (checked in `initState` via a post-frame callback) and adds a "How to play" book-icon button (top-right) to replay it anytime.

**Verified:** 83/83 tests pass (4 new in `test/screens/tutorial_screen_test.dart`), analyzer at the same 5 known `info` lints. Confirmed in a real run over CDP: all 6 steps render with real sprites; first-play auto-launch works; "SIMULAN NA!" on the last step lands on character selection; the book icon reopens the tutorial; "LAKTAWAN" (Skip) pops back to character selection correctly.

**What's unfinished:**
- Not pushed yet.
- `tool/cdp_shot.js` and `quiz_card_phone_preview.png` still uncommitted/undecided (carried from the entry below).
- Remaining adviser items (5 of 8 now open): hit animation, idle animation, bigger sprite, hearts regen, enemy/obstacle variety.
- Level 10 boss fight still not playtested.

## 3. Decisions made (and why)
- **First-play detection is a Hive flag checked in `CharacterSelectionScreen.initState`**, not a router redirect — it's a one-time UX nudge, not an auth gate, and matches `EraSelectionScreen`'s existing pattern for post-build side effects.
- **Skip and Done share one `_finish()`**: `pop()` if reachable (pushed from the How-to-play button), else `go('/character-selection')` (first-play auto-launch has nothing to pop to).

## 4. Things we tried that did NOT work
- **Widget-testing Skip/Done by asserting on the destination screen's content.** Hive's `box.put()` only commits its in-memory value after the real disk-write Future resolves (confirmed by reading Hive's source), so `_finish()`'s `await` needs real async time to ever reach `pop()`/`go()` — `tester.runAsync()` is required. But `google_fonts` schedules its own real background font-load Future per weight, which rejects when the font isn't bundled (expected with `allowRuntimeFetching = false`); normally that stays harmlessly dangling for a fake-time test, but `runAsync` gives it real time to actually reject, surfacing as a spurious, intermittent failure unrelated to navigation (this is the pre-existing `tutorial_screen_test.dart` flake noted in the parallax-background entry above — not reproducible on demand, not caused by that session). Settled on testing the storage-flag side effect only (reliable) and verifying real navigation via a CDP playtest instead, per this file's own "Definition of perfect".

## 5. Next steps (in order)
1. Push this commit (and the parallax-background one in the entry above).
2. Remaining adviser items: hit animation on correct answer, idle animation, bigger sprite, hearts regen, enemy/obstacle variety.
3. Level 10 boss fight playtest.

## 6. Constraints & conventions
- Same as the entry above.

---

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

## Older entries (folded)
- 2026-09-21 (adviser feedback review) — Turned the adviser's 8-item feedback list into an ordered plan (tutorial screens, hit animation, hearts regen, idle animation, background depth layer, bigger sprite, enemy/obstacle variety; answer feedback icons already done); decided hearts regen at 1/10min capped at 5, tutorial replayable from a menu button, background depth layer must stay slower than the world, `.env` files off-limits. No code changed that session. By 2026-09-22 both background depth layer and tutorial screens were done too (3 of 8) — hit animation, idle animation, bigger sprite, hearts regen, and enemy/obstacle variety remain.
- 2026-09-21 (adviser items: step 1 refactor + step 2 answer feedback) — Refactored `chrono_game.dart` (357→280 lines) by moving the question flow into `lib/game/quiz_handler.dart` and collapsing three duplicated life-loss blocks into one `loseLife()`. Added pop-in TAMA!/MALI! answer feedback icons. Committed `2bd73e6`/`722d14c`, root `e2cb13c` bumped the submodule. 39/39 tests. Built a signed-debug release APK for phone playtesting (not yet tried on a device at that point). Decided max hearts will be 5, regenerating 1 per 10 minutes.
- 2026-09-21 (screen-size finding + crate obstacles + tiled ground) — Found the game didn't adapt to screen size at all (raw device pixels, no viewport scaling — the 80px player was ~22% of a phone screen vs ~11% at 1280×720), which the next entry's `FixedResolutionViewport` fixed; switched all ground obstacles to crates (`022221a`) and tiled the ground with a grass cap over an era-coloured body (`04bc0a1`), deleting the screen-space `GroundComponent` that had been silently painting over any gap. 48/48 tests. Also surfaced two bugs: the gap system never fires (`GroundSpawner.update()` is empty — status as of the last check, not since revisited), and `level_failed_screen.dart` hardcoded 3 empty hearts regardless of actual lives (fixed in the 2026-09-22 "persistent hearts regen" entry above).
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