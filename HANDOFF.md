# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-22 (Tier 1: hit/idle animation, housekeeping; test hang root-caused but NOT fixed)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement Tier 1 of `NEXT_STEPS_CHECKLIST.md`: the `flutter test` hang, hit animation on correct answer, idle animation, and the 3-file housekeeping decision.

## 2. Current state

**Not yet committed in CHRONO-GAMEAPP:**
- `lib/game/components/player_component.dart` — added `triggerCheer()`, mirroring `triggerHurt()`'s exact structure (own delayed revert, not the update()-loop transition reset).
- `lib/game/quiz_handler.dart` — calls `player.triggerCheer()` on a correct answer, right after `overlays.remove('QuestionOverlay')`.
- `lib/screens/home/character_selection_screen.dart` — `_IdleAvatar` now cycles the 4 walk frames on a `Timer.periodic` (450ms/frame), on top of its existing bob `AnimationController`.
- `test/game/player_reactions_test.dart` (new, 4 tests) — asserts the animation the player is actually switched to on each quiz outcome. See Decisions for why this replaced a screenshot.
- `tool/` — staged to commit as a permanent dev tool (was untracked since it was introduced). Gained a `scroll:<x>,<y>,<dy>` step this session, which does **not** work on Flutter web (see "did NOT work").
- `CHRONO-GAMEAPP/quiz_card_phone_preview.png` — deleted (confirmed zero references anywhere via grep).

**Root repo:**
- `HANDOFF(template).md` — staged to commit (a genuine reusable blank template, not scratch).
- `NEXT_STEPS_CHECKLIST.md` — Tier 1 outcomes recorded, plus three newly-surfaced items.

**The `flutter test` hang was NOT fixed — the attempted fix was written, tested, and reverted.** It is now thoroughly root-caused instead; see Decisions. `test/flutter_test_config.dart` and the `pubspec.yaml`/`pubspec.lock` dev-dependency additions that supported it were all reverted, so the tree is back to the established baseline on that front.

**Verified:** `flutter analyze` clean at the same 5 known info lints. `flutter test test/data test/game test/models`: **96/96 pass in 23 seconds** (the 92 baseline plus the 4 new `player_reactions_test.dart` cases). The idle-avatar change was confirmed in a real CDP run at 1280×800: two screenshots ~500ms apart on character selection show Lapu-Lapu's stance genuinely change (wide stride with sword extended vs. a narrower, lower stance) — a real sprite-frame change, not just the pre-existing vertical bob.

**What's unfinished:**
- The test hang itself. `test/screens/tutorial_screen_test.dart` still hangs exactly as it did before this session. What's gained is knowing precisely why, and that the obvious fixes are dead ends — see Decisions.
- No live playtest of `triggerCheer()` — deliberately replaced with tests (see Decisions), not skipped for time.

## 3. Decisions made (and why)
- **The hang is fully root-caused, in three parts.** (1) The "TimeoutException after 0:10:00" everyone assumed was a per-test timeout is actually **`pumpAndSettle()`'s own default** (`flutter_test/lib/src/widget_tester.dart:692-695`: `Duration timeout = const Duration(minutes: 10)`) — so the symptom is "frames never stop being scheduled," not "a test is slow." (2) The thing that never completes is **`path_provider`**: before google_fonts checks `allowRuntimeFetching`, it looks for a cached font on disk via `getApplicationSupportDirectory()`, a platform-channel call with no native handler in a plain widget test, which hangs rather than throwing. Faking it (exactly as google_fonts' own suite does in `test/load_font_if_necessary_test.dart`) really does make the tutorial file fail in ~5s instead of hanging. (3) **But that fix can't land, because the 92/92 green depends on the hang.** With `path_provider` faked, font loading gets far enough to actually throw "Poppins not found and fetching disabled", and `test/data test/game test/models` drops to **64/92** — `question_card_test.dart` and `answer_feedback_test.dart` render Poppins text and had been passing only because that load hung forever in the background as a harmless dangling Future.
- **Reverted rather than shipped.** A change that trades "one file hangs" for "28 tests fail" is a regression, however well-understood. The tree is back to baseline and the finding is written down instead.
- **The real fix is to bundle Poppins `.ttf` files** under `assets/fonts/` and declare them in `pubspec.yaml`, so the font resolves locally with no network and no platform channel — which would also remove a runtime font fetch from the shipped app. Blocked here: no network, and no Poppins `.ttf` exists anywhere on this machine (checked `C:\Windows\Fonts`, the pub cache, the Flutter SDK, and the repo).
- **`triggerCheer()` verified by test, not screenshot.** It reuses the jump pose (no character has cheer art — `assets/characters/` has only `_walk_1-4`, `_jump`, `_hurt`), so a cheering player and a jumping player render an identical frame and a screenshot would prove nothing. `test/game/player_reactions_test.dart` asserts the actual animation object instead: correct → `jumpAnim` not `walkAnimation`, wrong → `hurtAnim` not `jumpAnim`, score still awarded, and cheering bails out mid-hurt. Stronger evidence than a photo, and permanent.
- **Idle animation scoped to `_IdleAvatar` only** — `tutorial_screen.dart` and `background_history_screen.dart` also show a static `_walk_1` frame, but they're smaller, secondary displays sitting behind a generic multi-asset illustration widget and a `CircleAvatar.backgroundImage` respectively; changing either cost more scope/risk than a "quick, independent" Tier 1 item should.
- **`quiz_card_phone_preview.png` deleted; `tool/` and `HANDOFF(template).md` kept and staged to commit** — the screenshot had zero references anywhere (checked via grep). The other two are genuinely useful and intentional.

## 4. Things we tried that did NOT work
- **`GoogleFonts.config.allowRuntimeFetching = false` in a `flutter_test_config.dart`.** Redundant (the affected test file already sets it itself) *and* actively harmful globally — it forces the throw path for every test that renders Poppins.
- **Suppressing the resulting exception via `reportTestException`.** Strictly worse: the exception is what *aborts* the test, so swallowing it let the test run on and `pumpAndSettle` spin its full 10 minutes. Turned a 4-second honest failure into a 10-minute hang.
- **Leaving fetching enabled so the failed fetch returns null instead of throwing.** Also fails — 5/27 on `question_card_test.dart`.
- **Diagnosing a hang by piping through `| tail -N`.** `tail` without `-f` can't know the last N lines until EOF, so it buffers everything and prints nothing until the process exits — a slow-but-working run and a truly hung one look identical. This cost real time treating "no output yet" as proof of a hang. Use no pipe, `head`, or `--reporter expanded`.
- **`Input.dispatchMouseEvent` with `type: 'mouseWheel'` to scroll Flutter web** (added as a `scroll` step to `tool/cdp_shot.js`). Flutter's web engine ignores it; the page doesn't move. `Input.synthesizeScrollGesture` is the likely fix. This blocks scripted playtests of anything gated behind a scroll, e.g. reaching level select past `background_history_screen.dart`'s "scroll down to continue".
- **Booting straight into `/game/:era/:level` via `DEV_START_ROUTE` with a fresh browser profile.** Renders blank — that route needs a character already selected in Hive, which a fresh profile doesn't have.
- **`TaskStop` alone to stop a `flutter test` run.** On Windows it stops the tracked wrapper but leaves the `dart` → `dartvm`/`dartaotruntime` → `flutter_tester` tree running orphaned; four abandoned runs accumulated before this was noticed. Kill the specific PIDs with PowerShell `Stop-Process -Id`, then confirm with `Get-Process`.

## 5. Next steps (in order)
1. Commit and push — nothing from this session is committed yet, pending user confirmation.
2. Bundle Poppins `.ttf` files (needs network) — the one fix that actually resolves the test hang, and it removes a runtime font fetch from the shipped app as a bonus.
3. Triage the three items newly surfaced in `NEXT_STEPS_CHECKLIST.md`: the crashing blank-animation fallback at `player_component.dart:70`, the non-working CDP scroll step, and the blank `/game/...` direct route.
4. Tier 2 of `NEXT_STEPS_CHECKLIST.md`: the gap system, obstacle variety.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- `flutter test` still must be scoped to `test/data test/game test/models`. `test/screens/` still hangs — unchanged by this session.
- When diagnosing a possibly-hanging command, never pipe it through `| tail`. Use no pipe, `head`, or `--reporter expanded`.
- After stopping a background `flutter test`, verify no orphaned `dart`/`flutter_tester` processes are left behind.

---

**Date:** 2026-09-22 (outstanding-work checklist)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
User asked for a full checklist of everything left to do on the project, ordered so the fastest/easiest items come first.

## 2. Current state
Wrote `NEXT_STEPS_CHECKLIST.md` at the repo root instead of folding the full list into this file — HANDOFF.md is a session log, not an ongoing tracker, and the project already has precedent for a separate standalone checklist (`CAMERA_REBUILD_CHECKLIST.md`). Before writing it, verified every item against real git/code state rather than trusting older HANDOFF prose:
- Confirmed via `git log`/`git status` in the CHRONO-GAMEAPP submodule that hearts regen (`9dee494`), the bigger sprite (`9692c48`), and the parallax light-layer fix (`35b022b`) are genuinely committed — 5 of the adviser's original 8 feedback items are done (also fixed the entry below, which still said "not yet committed" even though it already was — see its updated "Current state").
- Confirmed by reading the actual code that 3 adviser items are genuinely still open: no player-side reaction to a correct answer (`lib/game/quiz_handler.dart:39`, the `if (isCorrect)` branch only awards score and defeats the enemy/boss), no player idle animation (only `BossComponent` has a real `idleSprite`; the character-select preview at `lib/screens/home/character_selection_screen.dart:508` is a single static `_walk_1.png` frame, not a loop), and obstacle variety is thin — enemies already have 2 types per era chosen at random (`enemy_component.dart:73-81`), but every obstacle is the same `WallComponent` behavior (one reskinned PNG per era) plus one shared `crate.png`, both dealing identical damage (`player_component.dart:186-199`).
- Found the gap system is still dead code, confirmed directly (not just carried over from an old note): `GroundSpawner.update()` in `lib/game/components/gap_component.dart:176` is an empty no-op, and `spawnInitialGround()` lays down one 1,000,000-wide `GroundSection` covering the whole level — a gap is never actually left unfilled, so falling-in-a-gap is unreachable content, not just untested.
- Confirmed 3 untracked files still need a keep-or-drop decision: `tool/` (the CDP playtest script) and `quiz_card_phone_preview.png` in the CHRONO-GAMEAPP submodule, `HANDOFF(template).md` at the repo root.

No code changed this session.

## 3. Decisions made (and why)
- **A separate `NEXT_STEPS_CHECKLIST.md` file, not a section in this file** — matches the `CAMERA_REBUILD_CHECKLIST.md` precedent and keeps this file's per-session entries short, per its own stated convention.
- **Grouped into 4 tiers by independence/effort, not the adviser's original list order** — Tier 1 (hit/idle animation, the test-hang fix, the 3-file housekeeping decision) needs no new decisions from the user; Tier 2 (gap system, obstacle variety) needs one small decision first; Tier 3 (Level 10 boss playtest, quiz question content) isn't really a coding task; Tier 4 (aspect-ratio/0-hearts polish) is optional and already low-risk.

## 4. Things we tried that did NOT work
- (None — this was a read/verify/write-checklist session, no code attempted.)

## 5. Next steps (in order)
See `NEXT_STEPS_CHECKLIST.md` at the repo root — start at Tier 1, top to bottom.

## 6. Constraints & conventions
- `flutter test` gotcha still applies until Tier 1's fix lands: scope to `test/data test/game test/models`, don't run it bare.

---

**Date:** 2026-09-22 (bigger player sprite + parallax light-layer fix)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement the adviser's "bigger sprite" item, now unblocked by the fixed-resolution viewport (see the folded entries below for why it had to wait).

## 2. Current state

**Committed in CHRONO-GAMEAPP** (`9692c48`, `35b022b`) **and pushed** (`45241ad` at root, this doc + submodule bump):
- `lib/game/components/player_component.dart` — player `size` changed from `Vector2(64, 80)` to `Vector2(96, 120)` (1.5x). Nothing else in this file changed: `position = Vector2(0, game.groundY - size.y)`, ground/platform landing checks, and `respawn()` are all already expressed relative to `size.y`, and `RectangleHitbox()` (added with no explicit size) auto-fits whatever `size` is at add-time — so all of it picked up the new size with no further edits.
- `test/game/fixed_resolution_test.dart` — updated the illustrative `playerHeight` constant used by "a sprite covers the same fraction of the screen on every device" from `80.0` to `120.0`, so the test still describes a real current number instead of a stale one; the test's logic (proportional scaling holds across devices) didn't depend on the specific value either way.
- `lib/game/components/parallax_background.dart` — **separate fix, same session:** the user spotted (from a screenshot taken for the bigger-sprite check above) that the translucent light-rays layer was drawing in front of the mid-trees layer instead of behind it. Reordered the `loadParallax` list from `[back-trees, middle-trees, lights, front-trees]` to `[back-trees, lights, middle-trees, front-trees]`. This wasn't just a draw-order tweak: Flame's `ParallaxComponent` ties scroll speed to array position too (each layer scrolls faster than the one before it via `velocityMultiplierDelta`), so the old order also had the lights layer scrolling *faster* than the mid-trees — wrong for what's meant to be an ambient, distant effect. The reorder fixes both at once.

**Why 96x120, not just "somewhat bigger":** checked native asset pixel sizes across the cast — player art is 52x68, enemies 52x64 (rendered at 60x72), and the boss is 80x90 (rendered at 120x140). That meant the boss was already upscaled ~1.5x from its native art, while the player was only upscaled ~1.2x — barely more than enemies get, which is very likely *why* the adviser flagged the hero as not reading as the hero. 96x120 is exactly 1.5x the player's native 52x68 (same width:height ratio as the old 64x80, just scaled up), matching the treatment the boss already gets instead of inventing a new ratio.

**Verified:** `flutter analyze` clean at the same 5 known info lints. `flutter test test/data test/game test/models`: 92/92 pass, unchanged by either edit (no test asserts the production `onLoad()` size directly, and `parallax_background_test.dart`'s 2 tests inject an empty-layer `Parallax` to isolate the velocity math from real asset order, so the reorder didn't touch them). Confirmed both in real runs over CDP (`/game/spanish/1`, 1280×800): Rizal renders clearly larger than the approaching Spanish-soldier enemy, standing correctly on the ground with no clipping; separately, a before/after pair of screenshots confirmed the light rays now sit behind the tree trunks instead of overlapping in front of them. Also caught a jump next to a spawned platform in the same session (user asked to see one) — no clipping or landing issues from the bigger sprite there either.

**What's unfinished:**
- Did not re-verify very wide/narrow pillarboxed windows specifically for the sprite-size change — the fixed-resolution viewport should make that a non-issue (world units are device-independent), but wasn't explicitly reshot at another aspect ratio. Tracked in `NEXT_STEPS_CHECKLIST.md` (Tier 4).

## 3. Decisions made (and why)
- **1.5x scale, derived from the boss's existing native-to-rendered ratio, not a round guess** — see "Why 96x120" above. Keeps the new size defensible against "why that number" rather than picking an arbitrary bump.
- **Left `test/game/fixed_resolution_test.dart`'s constant in sync but changed nothing else test-side** — every other test that hardcodes a player size is a bare stand-in object for testing unrelated behavior (enemy despawn, camera tracking, parallax speed), not an assertion about the real player's dimensions, so leaving those at `64x80` doesn't make them wrong or stale.
- **Light rays moved to right after the back-trees layer, not just swapped with front-trees** — the user's own framing ("should be second") plus the compositional logic (an ambient layer should be near-static, closest in speed to the furthest-back layer) both pointed at position 2 of 4, not position 4.

## 4. Things we tried that did NOT work
- (None — this one was a single clean value change with no surprises.)

## 5. Next steps (in order)
See `NEXT_STEPS_CHECKLIST.md` at the repo root (written in the entry above this one) — it supersedes the numbered lists in this and every older entry below.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- Same playtest recipe as the entries below: PowerShell dev server on port 8123, `tool/cdp_shot.js` against CDP debug port 9222.
- `flutter test` gotcha from the entry below still applies: scope it to `test/data test/game test/models`, don't run it bare — `test/screens/tutorial_screen_test.dart` hard-hangs for up to 20 minutes in this sandbox.

---

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

**Update: committed and pushed** — `9dee494` in CHRONO-GAMEAPP, `fb19d80` at root (this doc + the submodule bump), both after the CDP playtest above confirmed the rendering.

**What's unfinished:**
- The 0-hearts branch specifically (disabled retry button, the level-select dialog) was never seen in a real run — only its math, via the unit tests. Reaching it for real needs 5 genuine level failures or throwaway debug scaffolding; neither seemed worth it given how directly the render/gating code reads the same tested `HeartsState`.
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
1. Remaining adviser items: hit animation on correct answer, idle animation, bigger sprite, enemy/obstacle variety.
2. Level 10 boss fight playtest.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- Same playtest recipe as the entries below: PowerShell dev server on port 8123, `tool/cdp_shot.js` against CDP debug port 9222.

---

## Older entries (folded)
- 2026-09-22 (shared 4-layer parallax background) — Replaced 5 per-era parallax background sets with one shared 4-layer forest set (`742f028`: back-trees/lights/middle-trees/front-trees, `velocityMultiplierDelta` (1.4, 1.0)), satisfying the adviser's background-depth-layer item; deleted the 10 now-unused per-era PNGs. Confirmed via a real CDP screenshot at 1280×720. Surfaced the Git-Bash-`$(pwd)`-path-mangling and blanket-`taskkill`-kills-all-Chrome gotchas later folded into this file's general playtest notes.
- 2026-09-22 (how-to-play tutorial) — Added a 6-step `PageView` tutorial (`69605d3`, character/obstacles/coins/quiz-check/hearts/power-ups), shown once on first play and replayable via a book-icon button on character selection; built entirely from existing sprites/icons, no new art. 83/83 tests. First surfaced that `tutorial_screen_test.dart`'s Skip/Done widget tests trip a `google_fonts` background font-fetch rejection under `runAsync` — later found (persistent-hearts entry) to be a full 10-minute hard-hang in this sandbox, not just an intermittent flake.
- 2026-09-22 (adaptive screen: fixed-resolution viewport + quiz card fit) — Added `CameraComponent.withFixedResolution(1280, 720)` (`6edfb47`) so every sprite covers the same screen fraction on every device instead of ~2x bigger on a phone; explicitly flagged "bigger sprite" as now unblocked by this (done in the "bigger player sprite" entry above). Also fit the quiz card to a landscape phone via a compact/regular `QuestionLayout` split plus a `FittedBox(scaleDown)` safety net (`e858348`). 79/79 tests. Surfaced but left open: the gap system still never fires, a dead `WallComponent` collision branch at `player_component.dart:181`, wide (~20:9) phones losing ~20% of width to pillarboxing (an accepted tradeoff, not a bug), and whether to keep `tool/cdp_shot.js` (still undecided).
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