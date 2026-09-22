# ChronoQuest — Next Steps Checklist

Everything outstanding as of 2026-09-22, ordered so the fastest and most independent items come first. Sources: the adviser's original 8-item feedback list (`HANDOFF.md`, 2026-09-21 "adviser feedback review") plus bugs and loose ends surfaced in later sessions. Every open item below was checked against real git history and current code in this session — not just carried over from old notes. Follow the conventions in `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` and this project's `CLAUDE.md` for anything that touches game code.

Update this file's checkboxes as items land. Point new `HANDOFF.md` entries here instead of re-listing everything.

---

## Already done (5 of 8 adviser items)

- [x] Answer feedback icons (TAMA!/MALI! on quiz answers)
- [x] Tutorial screens, replayable from a menu button (`69605d3`)
- [x] Background depth layer — shared 4-layer parallax with translucent light rays (`742f028`)
- [x] Persistent hearts regen, 1 per 10 min, capped at 5, gates level attempts (`9dee494`)
- [x] Bigger player sprite, 1.5x native art, plus a parallax draw-order bug fixed while verifying it (`9692c48`, `35b022b`)

---

## Tier 1 — quick, independent, no new decisions needed

- [ ] **Fix the `flutter test` hang — root-caused, but NOT fixed (attempted fix reverted).** Three findings worth keeping, all verified in a real run:
  1. **The "TimeoutException after 0:10:00" is `pumpAndSettle()`'s own default timeout**, not a per-test one (`widget_tester.dart:692-695`: `Duration timeout = const Duration(minutes: 10)`). So the hang is "frames never stop being scheduled," not "a test is slow."
  2. **The thing that never completes is `path_provider`.** Before google_fonts ever checks `allowRuntimeFetching`, it looks for a cached font on disk via `getApplicationSupportDirectory()` — a platform-channel call with no native handler in a plain widget test, which hangs rather than throwing. Faking it (the way google_fonts' own test suite does, in `test/load_font_if_necessary_test.dart`) does make the tutorial file fail in ~5s instead of hanging 10+ minutes.
  3. **But that fix can't land as-is: the 92/92 green depends on the hang.** With `path_provider` faked, font loading gets far enough to actually throw "Poppins not found in assets and fetching is disabled" — and `test/data test/game test/models` drops from **92/92 to 64/92**, because `question_card_test.dart` and `answer_feedback_test.dart` render Poppins text. Leaving fetching enabled doesn't help either (tried: still 5/27 on that file). Suppressing the exception via `reportTestException` is actively worse — the exception is what *aborts* the test, so swallowing it lets `pumpAndSettle` spin the full 10 minutes.
  **The actual fix is to bundle Poppins `.ttf` files under `assets/fonts/` and declare them in `pubspec.yaml`**, so the font resolves locally with no network and no platform channel. That also removes a runtime font fetch from the shipped app. It needs the font files, which needs network access — none in this sandbox, and no Poppins `.ttf` exists anywhere on this machine (checked `C:\Windows\Fonts`, the pub cache, the Flutter SDK, and the repo).
- [x] **Hit animation on correct answer.** Added `PlayerComponent.triggerCheer()` (`lib/game/components/player_component.dart`), wired at `lib/game/quiz_handler.dart:39`. No dedicated "cheer" art exists, so it reuses the already-loaded jump pose as a stand-in reaction, mirroring `triggerHurt()`'s exact structure (including its own delayed revert, not the update()-loop transition reset). **Verified by test, not screenshot** — since it reuses the jump pose, a cheering player and a jumping player render the same frame, so a screenshot proves nothing. New `test/game/player_reactions_test.dart` (4 tests) asserts the animation the player is actually switched to: correct answer → `jumpAnim` and not `walkAnimation`, wrong answer → `hurtAnim` and not `jumpAnim`, score still awarded, and cheering bails out mid-hurt.
- [x] **Idle animation.** `_IdleAvatar` in `lib/screens/home/character_selection_screen.dart` already bobbed up and down but showed a frozen `_walk_1` frame while doing it. It now also cycles all 4 existing walk frames on a slow `Timer.periodic` (450ms/frame — much slower than the in-level 150ms walk speed), so the character-select hero reads as genuinely idling instead of floating mid-stride. **Verified in a real run**: two CDP screenshots ~500ms apart on character select show Lapu-Lapu's stance genuinely change (wide stride with sword extended vs. a narrower, lower stance) — a real sprite-frame change, not just the pre-existing vertical bob. Scoped to this one widget — `tutorial_screen.dart` and `background_history_screen.dart` also show a static `_walk_1` frame but are smaller, secondary displays not worth the same treatment in this pass.
- [x] **Housekeeping.** `CHRONO-GAMEAPP/tool/` kept, staged for commit as a permanent dev tool. `CHRONO-GAMEAPP/quiz_card_phone_preview.png` deleted (unreferenced anywhere). `HANDOFF(template).md` kept, staged for commit (it's a genuine reusable blank template, not scratch).

### Surfaced while doing Tier 1 (new, not yet triaged)

- [ ] **The "emergency blank animation fallback" in `player_component.dart:70` would itself crash.** If every walk frame fails to load, `onLoad()` falls back to `SpriteAnimation.spriteList([], stepTime: 1.0)` — but Flame asserts `frames.isNotEmpty`, so the fallback throws instead of degrading gracefully. Found by hitting the same assert while writing `player_reactions_test.dart`. Needs a decision on what the fallback should actually be (a 1x1 placeholder sprite, or let the load failure propagate).
- [ ] **`tool/cdp_shot.js` can't drive Flutter web scrolling.** Added a `scroll:<x>,<y>,<dy>` step this session; it dispatches `Input.dispatchMouseEvent` with `mouseWheel`, which Flutter's web engine ignores. `Input.synthesizeScrollGesture` is the likely fix. This blocks scripted playtests of any screen gated behind a scroll — e.g. `background_history_screen.dart`'s "Mag-scroll pababa para magpatuloy", which is how you reach level select.
- [ ] **Booting straight to `/game/:era/:level` needs a character already in storage.** With a fresh browser profile (empty Hive, no character selected) that route renders blank, so `DEV_START_ROUTE=/game/...` only works if the profile has already been through character selection. Worth either a dev-flag default character or a note in the playtest recipe.

## Tier 2 — needs one small decision, then bounded work

- [ ] **Fix the gap system (currently dead code).** `GroundSpawner.update(dt)` at `lib/game/components/gap_component.dart:176` is an empty no-op, and `spawnInitialGround()` lays down a single 1,000,000-wide `GroundSection` covering the entire level — so a gap is never actually left unfilled. Falling in a gap (and the heart-loss path tied to it) is currently unreachable content, not just untested. Needs a decision on gap frequency/width before writing the real spawn loop.
- [ ] **Obstacle variety.** Enemies already vary — 2 types per era, picked at random (`enemy_component.dart:73-81`). Obstacles don't: every era's obstacle is the same `WallComponent` behavior (one reskinned PNG per era) plus one shared `crate.png`, both dealing identical damage on hit (`player_component.dart:186-199`). The adviser's note is more actionable here than on enemies — needs new obstacle art/behavior, not just a reskin.
- [ ] **Add controllers for character movements.** Currently the player only auto-runs forward and jumps on tap. Add on-screen or keyboard/gamepad controllers to let players move the character left/right, duck, or perform other movement actions. Needs design decision on which movement types and which input method (touch buttons, keyboard, gamepad, all three).
- [ ] **Ensure platforms do not clip into character head.** The fixed-resolution viewport and bigger sprite (96x120) may have changed platform spawn heights or collision detection boundaries. Verify that no platform graphics clip into or overlap the character's head during jumping, landing, or standing idle. Check platform_layering_test.dart and visual playtesting.

## Tier 3 — needs real playtesting or content authoring, not just code

- [ ] **Level 10 boss fight playtest.** Carried across every session in `HANDOFF.md` — never actually played through for real.
- [ ] **Quiz question bank content.** Levels 1–9 have only 5 questions each but need more than 10 for the existing randomization (`QuestionBank.getQuestions`) to give real variety across replays; level 10 already has 22/22. This is content-writing, not a coding task.

## Tier 4 — low-priority polish (already low-risk, optional)

- [ ] See a real 0-hearts run in the app (the retry-blocked dialog, the disabled "ULIT" button) — currently only verified via `hearts_state_test.dart`'s unit tests, never a live run.
- [ ] Reverify the bigger player sprite at very wide/narrow pillarboxed aspect ratios — low risk since world units are device-independent under the fixed-resolution viewport, but not explicitly reshot at one.

---

## Suggested order

1. Tier 1, top to bottom — each item is small and none depend on each other.
2. Tier 2 — pick a gap frequency/width and an obstacle idea, then implement both.
3. Tier 3 — playtest and content-writing, likely worth a session (or a person) of its own.
4. Tier 4 — whenever there's spare time; safe to skip entirely.
