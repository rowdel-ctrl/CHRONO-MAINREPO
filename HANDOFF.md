# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-29 (screen-fill viewport, joystick reachability, dynamic virtual width — playtest round 3, committed)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Land four playtest-driven tweaks requested together (screen-fill/no-black-bars, bigger/
further-out Jump+Attack buttons, faster walk speed, platform ceiling 110→113), then fix two
regressions the screen-fill change itself introduced once the user actually saw it on a real
device: HUD circles rendering as ovals, and the joystick sitting under the character / being
too small and too far into the corner to reach comfortably.

## 2. Current state

**Committed (`c3ca19a`, `v2-phase-1`, CHRONO-GAMEAPP):**
- `lib/game/stretch_to_fill_viewport.dart` (new) — custom Flame `Viewport` replacing
  `CameraComponent.withFixedResolution`'s `FixedResolutionViewport`. The stock viewport
  preserves the virtual 16:9 aspect ratio exactly, uniformly scaled, which pillarboxes (black
  bars) any device wider than 16:9 — effectively every phone in landscape. This one always
  sizes to the full canvas and scales the fixed 1280×720 virtual resolution onto it per-axis,
  filling edge-to-edge. `virtualSize` stays pinned to 1280×720 regardless of device, so
  `groundY`, jump physics, platform heights, and spawn distances are provably unchanged —
  only the final blit-to-screen step is. Extends `Viewport` directly (not
  `FixedAspectRatioViewport`, which has a private un-overridable `_handleResize`), reusing
  Flame's own internal `transform` field for the scale. Tradeoff, disclosed and accepted: a
  mild non-uniform stretch (~8-25% depending on device aspect ratio) on world sprites.
  Verified with `test/game/stretch_to_fill_viewport_test.dart` (4 tests: virtual resolution
  unaffected, viewport fills canvas exactly, groundY/jump math unaffected, touch-mapping
  round-trip through the transform).
- `lib/game/game_input.dart` — Jump/Attack buttons 20% bigger (diameter 90→108) and moved
  further to their screen edges; joystick repositioned off the character.
- `lib/core/constants.dart` — `PlayerComponent.forwardSpeed` 150→210 (parallax auto-adapts via
  its existing speed-ratio calculation, not a hardcoded number).
- `lib/game/components/enemy_spawner.dart` — `platformMaxHeight` 110→113, exactly
  `jumpPeak - 15`, the limit `platform_layering_test.dart` already enforces. Gravity and jump
  force untouched, as required.

**HUD-ovals fix, superseded within this same pass — see the dynamic-virtual-width entry below.**
A first attempt (from a device screenshot showing round buttons and the joystick knob
rendering as ovals, since the stretch above scaled X and Y unevenly) added a
`hudCounterScale` to `StretchToFillViewport` that cancelled only the *uneven* part of the
stretch, applied to every HUD child. It fixed the HUD but left world sprites (enemies, coins,
platforms) still visibly stretched — confirmed once the user actually saw it on-device. Rather
than layer a second fix on top, `hudCounterScale` was deleted entirely in favour of removing
the stretch at its source (below), which fixes the HUD for free too.

**Joystick reachability fix (from a second device screenshot: "still
too small" / "in the corner, hard to reach"):**
- `lib/game/game_input.dart` — joystick background/knob enlarged and margin brought in from
  the literal corner (background radius 60, knob radius 28, margin left 45/bottom 45).
- **Real geometric conflict found, not guessed at:** no joystick radius/margin combination
  comfortable enough to reach could avoid overlapping the player sprite at its old render
  position (`GameConstants.playerX = 80` — the sprite's own x-span, 80-176, sat almost
  entirely inside any reachable joystick's footprint). Fixing this by shrinking the joystick
  further would have re-broken reachability; fixing it by moving the joystick would have put
  it back in an uncomfortable corner. The actual fix was moving the player instead.
- `lib/core/constants.dart` — `GameConstants.playerX` 80→220, giving ~55 units of clear space
  between the joystick's footprint and the player regardless of joystick sizing. Forward view
  shrinks by the same 140 units (`cameraLeftEdgeX` shifts right to match) — about 12% less
  world visible ahead of the player, still well clear of `spawnInterval` (800), so nothing
  spawns already on-screen. Confirmed every reference to `playerX` in the codebase (game code
  and three test files) reads the constant symbolically, not a hardcoded literal, so this one
  change propagates everywhere correctly. 131/131 tests pass.
- Verified beyond just the unit tests: drove a real Chrome session through Chrome DevTools
  Protocol (press → held drag with `buttons:1` on every intermediate move → release, plus a
  Jump tap) against a live `flutter run -d web-server` build. Screenshots confirm the joystick
  knob visibly displaces on drag and snaps back on release, the character visibly walks (world/
  coin/platform positions shift between frames), Jump registers, and the console shows no new
  errors. This is a stand-in for the user's own on-device test, not a replacement for it — see
  Section 6.

**Dynamic virtual width — the actual fix for the remaining stretch, committed `99076c4`.**
Once the user tested the counter-scaled-HUD build on-device, world sprites (enemies, coins,
platforms) were still visibly stretched — the counter-scale only ever fixed the HUD, since it
was deliberately scoped to `viewport.children`, not the world. Recommended and implemented the
fix this was deferred in favour of at the time (see Decisions below):
- `lib/game/stretch_to_fill_viewport.dart` — `StretchToFillViewport` now takes a fixed
  `height` only, not a fixed `resolution`. Virtual width is computed live every resize as
  `height * (canvas.x / canvas.y)`, so the world-to-screen scale is always uniform
  (`transform.scale` is one scalar, not a per-axis stretch) — nothing distorts on either axis,
  on any device. `hudCounterScale` and its per-child application are gone entirely; nothing
  needs them once the source of the stretch is removed.
- `lib/game/chrono_game.dart` — constructor passes `height: GameConstants.virtualHeight` only.
- `lib/game/game_input.dart` — dropped the counter-scale application block from `setup()`.
- `lib/core/constants.dart` — removed `GameConstants.virtualWidth` (no longer a fixed value);
  `virtualHeight` (720) is unchanged and is now the only virtual-resolution constant. Confirmed
  it was referenced nowhere in `lib/` outside the viewport construction site, so removing it
  was safe.
- `test/game/fixed_resolution_test.dart`, `test/game/stretch_to_fill_viewport_test.dart` —
  updated to assert virtual width tracks each canvas's aspect ratio and the resulting scale is
  uniform (`scaleX == scaleY`), instead of asserting a fixed 1280.
- `test/game/hud_counter_scale_test.dart` — rewritten (same filename, no `hudCounterScale`
  references left) to confirm the real mounted joystick/buttons still render round and stay
  edge-anchored, now for free rather than via counter-scaling.
- 130/130 tests pass, `flutter analyze` clean. **Confirmed on-device by the user** — this is
  what unblocked the commit; see Section 6.

**Unrelated, pre-existing uncommitted change noticed but deliberately left alone (not made by
this pass, not investigated further):** `android/app/build.gradle.kts` / `pubspec.yaml` — a
`gitCommitCount()` Kotlin function overriding `versionCode` with the git commit count instead
of `flutter.versionCode`. Appears to be legitimate in-progress work from elsewhere in the repo.

## 3. Decisions made (and why)
- **Chose stretch-to-fill over letterbox/pillarbox.** Checked how similar games handle this:
  most 2D platformers/runners (and engines like Unity's Canvas Scaler "match height," Cocos2d's
  `FIXED_HEIGHT` policy) pick fixed-height/variable-width and accept some horizontal stretch or
  extra view rather than wasting screen real estate on bars — bars are more common in
  pixel-perfect or console-port genres, which this isn't.
- **Went with dynamic virtual width once the counter-scaled-HUD build still showed stretched
  world sprites on-device**, rather than trying to extend counter-scaling to the world too
  (which would have meant rendering the world into an intermediate uniformly-scaled surface —
  a much bigger change than computing one extra number per resize). This does mean the "don't
  touch the camera/world coordinate system" framing item 1 was originally scoped under no
  longer fully holds — `virtualSize.x` now varies per device — but height, and everything
  tuned against height (`groundY`, jump physics, platform heights), is still exactly fixed;
  only the horizontal view width changes, the same tradeoff Unity's "match height" and
  Cocos2d's `FIXED_HEIGHT` policy make deliberately.
- **Counter-scaled the HUD instead of moving it to a Flutter overlay outside Flame's
  viewport.** Both options were offered to the user; counter-scaling keeps the joystick/buttons
  as Flame components (so they keep using `DragCallbacks`/`ComponentViewportMargin` as-is)
  while still cancelling the visual distortion, versus a bigger rewrite to a parallel Flutter
  widget input layer.
- **Moved the player (`playerX`) rather than continuing to resize the joystick.** Calculated
  the actual overlap first and confirmed no joystick sizing could satisfy both "reachable" and
  "not overlapping the character" at once given the old player position — this was a genuine
  geometric conflict, not a tuning problem, so tuning the joystick further would not have
  fixed it.
- **Verified the joystick/jump fix with a real scripted browser interaction, not just unit
  tests or a static screenshot**, at the user's explicit request to self-test — building a
  small one-off CDP driver (`Input.dispatchMouseEvent` press/move/release, with `buttons:1` set
  on every held-drag move, which Chrome requires to treat it as a drag rather than a hover).

## 4. Things we tried that did NOT work
- First CDP interactive-drag attempt: the joystick never visibly moved even though the drag
  sequence ran and a plain Jump-button tap worked fine in the same script. Root cause: the
  intermediate `mouseMoved` events during the simulated drag omitted `buttons: 1`, so Chrome
  treated them as hover-moves rather than a continued drag. Fixed by setting `buttons: 1`
  explicitly on every held-move event.
- First screenshot attempts came back blank white despite the page reporting
  `readyState: complete`. Root cause: two separate Chrome instances existed at once (Flutter's
  own auto-launched one, actually working, and a second manually-launched CDP-debug one that
  stayed backgrounded and heavily throttled by Chrome's background-tab JS throttling) — the
  wrong one was being screenshotted. Fixed by using `flutter run -d web-server` (no
  auto-launched browser) plus exactly one manually-launched, genuinely OS-foregrounded Chrome
  instance.

## 5. Next steps (in order)
1. ~~Get the user's own on-device confirmation before committing~~ **Done.** The user tested
   the dynamic-virtual-width build (the one that actually fixes the stretch, not the
   counter-scaled-HUD-only intermediate build) and confirmed it looks right. Committed on
   `v2-phase-1` as `99076c4`.
2. Phase 2 — combat and Kaalaman, per the Phase 1 entry below.

## 6. Constraints & conventions
- Do not change gravity (900) or jump force (-480) for any future viewport work — `size.y`
  (virtual height) is fixed at `GameConstants.virtualHeight` regardless of device;
  `StretchToFillViewport` only ever changes `size.x` (virtual width) and the final canvas
  blit, never height or world coordinates.
- **`GameConstants.virtualWidth` no longer exists.** Virtual width now varies per device
  (`StretchToFillViewport` computes it from `virtualHeight * aspectRatio` every resize) — if
  something needs "the current virtual width," read `ChronoGame.size.x` / `camera.viewport
  .virtualSize.x` at the point of use, don't reintroduce a fixed-width constant.
- `hudCounterScale` no longer exists either — removed along with the stretch it used to
  correct for. Don't reintroduce per-axis HUD scaling; if HUD elements ever look distorted
  again, the bug is almost certainly in `StretchToFillViewport`'s scale computation, not
  something to patch around at the HUD layer.
- `GameConstants.playerX` is now 220, not 80 — if anything ever needs the player's render x
  again, read the constant, don't hardcode either value.
- Joystick footprint is background radius 60 + margin 45 from the left/bottom (x ∈ [45, 165]
  in virtual units) — any future player-position or HUD-layout change should re-check it
  doesn't reopen the overlap this pass fixed.
- Always send arm64-v8a APKs for this user's device, never armeabi-v7a.

---

**Date:** 2026-09-26 (GAMEPLAY-V2 revision 7 landed + Phase 1 playtest triage)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Land `GAMEPLAY-V2.md` revision 7's two code mandates (hearts reversal, crates cut) and
investigate four real-device playtest findings from the Phase 1 entry below — ground
render order, broken collision, inconsistent sprite scale, audio dropouts — before Phase 2,
which the user flagged as building directly on collision, movement, and the hearts model.
**Follow-up in the same session, before the user playtests this batch on-device:** also fix
the two remaining playtest findings (#7 character-select cropping, #8 tutorial contrast/
trigger), and get a real, tested (not just re-read) confirmation that platform landing
specifically — separate from the crate issue — actually works.

**Second follow-up, after the user actually playtested a built APK on-device:** three more
issues came back, all fixed in this same still-uncommitted pass before committing —

1. **#5, sprite scale**, previously confirmed-but-deferred above, now fixed for real: enemies,
   coins, and platform tiles brought up to the same visual register as the player/boss.
2. **Pause menu's "UMALIS" (quit) button was a dead end** — tapping it (and confirming) left
   the student stuck in gameplay with no way out. Not one of the original nine playtest
   findings; reported fresh once the user was actually testing the built APK.
3. **Platform spawn height (60-105 above ground) read as ankle-height steps, not jumpable
   ledges** — visible in a device screenshot once platforms were finally at a legible scale;
   raised to 90-110. This is a deliberate, user-requested exception to this file's own "do not
   change platform spawn heights" rule from the Phase 1 entry below — see Section 7.

## 2. Current state

**Committed to no branch yet, all in CHRONO-GAMEAPP:**

**Hearts unified** (Section 8 reversal — one shared 5-heart pool, no separate Energy):
- `lib/core/constants.dart` — `livesPerLevel` removed (the pool has one cap now,
  `maxHearts`); `heartRegenInterval` 10min → 1min.
- `lib/game/chrono_game.dart` — `lives` (level-local, reset every attempt) replaced with
  `hearts` (seeded from the persistent pool's live count) and a new `onHeartLost` callback
  fired once per `loseLife()`, so every in-level hit is pushed straight back to the same
  `HeartsState` the menu screens read.
- `lib/game/quiz_handler.dart` — **real bug fixed, not just reverted**: a wrong quiz answer
  was still calling `loseLife()`, contradicting both Section 6 ("wrong answers no longer
  cost HP") and Phase 0's own stated goal. Removed; a wrong answer now just closes the
  question with no HP consequence, same as the existing shield-absorbed branch already did.
- `lib/providers/game_provider.dart` — `consumeHeartOnLevelFailed()` renamed `loseHeart()`
  and now called once per hit (from `ChronoGame.onHeartLost`) instead of once per fully-failed
  level — the persisted pool and the in-game HUD count now move in lockstep.
- `lib/screens/game/game_screen.dart` — seeds `ChronoGame.hearts` from
  `gameState.hearts.count` at construction; wires `onHeartLost`; `onLevelFailed` no longer
  separately consumes a heart (the pool is already at 0 by the time it fires).
- `lib/game/overlays/hud_overlay.dart`, `level_select_screen.dart`, `level_failed_screen.dart`
  — Energy UI (bolt icons, "ENERHIYA" label, Filipino copy) reverted to the original hearts
  icon/copy everywhere, per Section 8's explicit instruction. `HeartsState`, the provider
  field name, and the two Hive keys were never touched, per the standing rule.
- `lib/screens/tutorial/tutorial_screen.dart` — the life-count string now reads
  `GameConstants.maxHearts` instead of the removed `livesPerLevel`; also corrected two lines
  that were now factually wrong (claimed a wrong answer costs a life, and that hearts reset
  per level — neither true anymore).
- Test fixes for the two behavior changes above (not bugs in the fix):
  `test/game/player_reactions_test.dart` (`hurtAnim` assertion → `walkAnimation`, since a
  wrong answer no longer triggers `triggerHurt()`); `test/models/hearts_state_test.dart`
  (`timeUntilNext` test's fixed 4-minute offset no longer fit a 1-minute interval).

**Crates cut entirely** (Section 5):
- Deleted `lib/game/components/crate_component.dart`.
- `lib/game/components/enemy_spawner.dart` — removed both crate timers and `_spawnCrate()`.
- `lib/game/components/player_component.dart` — removed the `CrateComponent` collision branch.
- `assets/tiles/crate.png` left on disk (unused now, not deleted — deleting assets wasn't
  asked for and is a separate, easily-reversible cleanup).

**#7 character-select cropping fixed:**
- `lib/screens/home/character_selection_screen.dart` — `_CharCard`'s content (avatar + name +
  era badge + description) has a fixed intrinsic height that could exceed the space left over
  on a short landscape phone once the header/footer take their share. Wrapped it in
  `FittedBox(fit: BoxFit.scaleDown)` + `Column(mainAxisSize: MainAxisSize.min)` — the same
  safety-net pattern `question_card.dart` already uses for the quiz card on short screens —
  so it shrinks to fit instead of overflowing/clipping.

**#8 tutorial contrast + trigger point fixed:**
- `lib/screens/tutorial/tutorial_screen.dart` — `_TutorialPage`'s panel was `Colors.black @
  55%` stacked on top of the backdrop's own 65% dark scrim, with a near-black border: two dark
  layers with almost no separation between them, unlike every other panel in the app (which
  uses the light parchment `AppColors.surface` + dark ink text pairing). Switched this panel
  to that same pairing (`AppColors.surface` fill, `AppColors.textPrimary`/`textSecondary`
  text) instead of inventing a one-off dark-on-dark style. Also bumped the "LAKTAWAN" skip
  button from `Colors.white54` to `Colors.white70`.
- Trigger moved from "on every visit to character selection until seen" (effectively on app
  open) to "the first time a level is actually started": removed the auto-push from
  `CharacterSelectionScreen.initState()` (the manual book-icon replay button is untouched);
  added `LevelSelectScreen._startLevel()`, which pushes `/tutorial` first and only then
  navigates into `/game/...` if the tutorial hasn't been seen yet. Both tutorial exit paths
  (skip and the last page's "SIMULAN NA!" / "start now") call the same `_finish()`, so either
  one now continues straight into the level that was tapped.

**#4 collision — platform landing specifically confirmed, not just re-read.** Added 5 tests
to `test/game/platform_layering_test.dart` that run `PlayerComponent.jump()` and the real
`update(dt)` loop (gravity + `resolveGroundContact()`) against an actual
`TilePlatformComponent`, the way the game really reaches one (a jump arc, not a drop from
above):
- Lands correctly at a normal 60fps frame time, at both the shortest and tallest documented
  spawn heights (`EnemySpawner.platformMinHeight`/`platformMaxHeight`, 60-105).
- Still lands correctly at a stuttery 30fps frame time.
- **Genuine (if narrow) finding:** a single ~200ms frame hitch landing at the single worst
  possible instant — already falling fast, one normal frame from the platform's 20-unit
  landing window — does tunnel the player through it. A normal 60fps frame covers ~5.5 units
  of fall there; a 200ms one covers ~66. This is a real property of the hand-rolled AABB
  check, confirmed by test rather than assumed, and it predates Phase 1 (the check itself is
  unchanged). Asserted directly in the test (with a comment pointing here) so a future fix
  updates it deliberately instead of it silently regressing back in unnoticed.

**Verified:** `flutter analyze` clean at the same 5 pre-existing info lints (none in touched
files). `flutter test test/data test/game test/models`: **111/111**, all passing (106 from
the first pass + 5 new platform-landing tests).

**Sprite scale fixed** (#5 above — this pass reverses the "not fixed here" call the first pass
made):

- `enemy_component.dart` — 60×72 → 90×108 (1.5×, matching the player's own upscale ratio).
- `coin_component.dart` — 28×28 → 42×42; spawn height now measured from the coin's own bottom
  edge (`size.y`), not a fixed `32` — at the old fixed offset the taller coin would have hung
  through the ground.
- `tile_platform_component.dart` — tiles drawn at 24px (`tileSize`) from the same 16px sheet
  (`sourceTileSize`, unchanged) — SpriteSheet cutting stays correct, only the draw size grew.
  All three hitboxes are added after `size` is set and derive from it, so they scaled with the
  sprite rather than silently keeping the old (now-mismatched) dimensions — checked with a
  real mounted `GameWidget` in `test/game/sprite_scale_test.dart`, not just re-read, since a
  bare unloaded `ChronoGame` never runs `onLoad()` and reports every size as zero.
- Ground band (`GroundSection`) and `WallComponent` were deliberately left unscaled — the
  ground's height defines `groundY`, which every jump/spawn position is measured against, and
  wall height is off this session's requested scope.

**Platform thickness bug found and fixed** (introduced by the scale change above, same pass):
a platform hangs entirely below its `surfaceY` (the landing plane), so doubling the tile size
also doubled thickness (16×2=32 → 24×2=48) — all of it eating into the gap to the ground. At
the lowest spawn height this left ~12 units of clearance, so platforms read as blocks sitting
on the floor rather than ledges. Fixed by drawing the underside as an 8px strip
(`undersideHeight`) instead of a second full tile, holding total thickness at the original 32
(`thickness = tileSize + undersideHeight`). `sprite_scale_test.dart` asserts clearance at
`EnemySpawner.platformMinHeight` stays ≥ a fifth of the player's height, so this can't silently
regress again.

**Platform spawn height raised, 60-105 → 90-110** (`enemy_spawner.dart`): a device screenshot,
taken once platforms were finally visible at a legible scale, showed the old range landing
surfaces at knee height on the 120-tall player — steps to walk into, not ledges to jump onto.
The ceiling (110) stays under the existing `jumpPeak - 15` = 113 limit
`platform_layering_test.dart` already enforces; that same test file's landing-physics tests
(60fps/30fps/frame-hitch, at both `platformMinHeight` and `platformMaxHeight`) all still pass
against the new range unchanged, confirming reachability rather than assuming it. One test's
own setup (not the physics) needed widening a 1-unit "stop just before landing" band to 12
units so it stays valid at any spawn height in range.

**Pause-menu quit fixed** (`pause_overlay.dart`, `game_screen.dart`) — two real bugs, not one:

1. `onQuit` was guarded by `if (context.mounted)` on the context Flame's `overlayBuilderMap`
   hands the builder (GameWidget's own), not the screen's — any moment that context wasn't
   mounted silently turned quitting into a no-op with no error and no feedback. Moved the
   navigation into a `GameScreen._quitToLevelSelect()` method that closes over the screen's own
   context instead.
2. The confirm dialog's quit handler called `resumeEngine()` before navigating away. Confirmed
   via a real stack trace that this restarts the game loop's ticker immediately — so frames run
   between the tap and the route actually changing, and those frames can reach
   `levelComplete()`/`showLevelFailed()`, whose own callbacks navigate somewhere else on top of
   the quit. Removed the `resumeEngine()` call (the level is being torn down, not resumed), and
   `_quitToLevelSelect()` now also nulls `onLevelComplete`/`onLevelFailed` before navigating as a
   second guard against exactly that race.

- Could not reproduce the stuck-menu symptom itself: `test/game/pause_quit_test.dart` drives the
  real `PauseOverlayWidget` through a real `GoRouter` in four arrangements (standalone, inside
  `GameWidget`, with the HUD overlay also active, with an async router redirect like the release
  build uses) and all four exited correctly even before these fixes. Both fixes above are real,
  confirmed-by-code-reading bugs in the quit path regardless; whether either one was the actual
  on-device cause is unconfirmed pending this build's playtest.

## 3. Investigation: the four playtest findings (Section 15 says Phase 2 depends on this)

**#3, ground render order — investigated, does not reproduce.** The suspected file
(`gap_component.dart`'s `GroundSection.render()`) draws the era body-color rect first
(`y ∈ [capHeight, bandHeight]` = `[9, 60]`) and the grass cap tile second
(`y ∈ [0, capHeight]` = `[0, 9]`) — non-overlapping ranges, tile already drawn after (i.e. on
top of) the body wherever they'd matter. `TilePlatformComponent`'s top/fill tiles are the
same shape (non-overlapping y-bands, correct order). No code changed. Either this was already
fixed before the Phase 0.5 audit flagged it, or the flag was a false positive — worth a real
screenshot to be sure, but nothing in the source supports the bug as described.

**#4, collision "broken" — two separate causes, neither a Phase 1 regression.**

*Obstacles ("walks straight through with no damage or blocking"):* almost certainly the
just-removed crates. `CrateComponent`'s hit response (still in place at the time of the
playtest) was `other.removeFromParent()` with **no sound, no visual effect, no HP change** —
a crate breaking is visually indistinguishable from having no collision at all, and the
spawner dropped one every ~2.7s (two overlapping timers). Now moot: crates are gone.

**Deliberately left alone, and worth being explicit about so it doesn't get "found" again
later: `WallComponent`'s collision branch (real -1 HP) has been dead code since Phase 0** —
nothing in `enemy_spawner.dart` has ever called a `_spawnWall()`; HANDOFF's 2026-09-22 entry
already flagged this, and it's still true today. **This is pre-existing, not a new regression
from crate removal or anything in this pass** — walls simply never spawn, on any commit back
to when the dead branch was first noticed. Not fixed here: `GAMEPLAY-V2.md`'s Phase 3 replaces
the entire mechanism with Gates (era walls become interactive knowledge-checks, Section 6/
Section on Gates), so wiring up bare wall-spawning now would be the same throwaway work the
crate cut and the deferred gap system already avoid. Leave it dead until Phase 3.

*Platforms ("can also pass through platforms rather than landing on them"):* the hand-rolled
AABB check (`game_collision.dart`) is byte-for-byte unchanged from before Phase 1 (only moved
into an extension file). This was flagged in the first pass as "unconfirmed, worth verifying"
rather than cleared outright — see the platform-landing bullet in section 2 above, which now
confirms it with real physics-loop tests rather than just re-reading the diff.

**#5, sprite scale inconsistency — confirmed, pre-existing, not Phase 1. Fixed in the
second follow-up, see Section 2 above.** Only the player (96×120, an explicit ~1.85x upscale
from 52×68 native art, commit `9692c48`) and the boss (120×140, ~1.5x upscale) ever got a
deliberate "read as bigger" pass. Enemies (60×72), coins (28×28), and — worst —
`TilePlatformComponent`'s tiles (rendered at literal, unscaled 16×16 `tileSize`) never did.
Nothing in Phase 1's diff touches any of these sizes; this has been true since the "bigger
player sprite" commit landed on 2026-09-22 and was simply never seen on a real screen before
now (prior verification was CDP screenshots checking tint/count/score, not relative sizing).
Originally left unfixed pending its own pass; that pass happened in the same still-uncommitted
session once the user actually playtested a build (see Section 2's "Sprite scale fixed" and
"Platform thickness bug" and "Platform spawn height raised" bullets).

**#6, audio desync/dropout — likely pre-existing, never actually human-verified before this
playtest.** Phase 0's own entry explicitly lists audio as "**Still NOT verified — needs a
human**." `AudioService._playSfx` fires a new pooled `FlameAudio.play()` per call with every
exception silently swallowed (by design, so a missing sound never crashes gameplay) — which
also means a degrading `audioplayers` pool or a BGM loop-point gap would produce exactly
"fine for several seconds, then desyncs/drops" with zero error trail. `audio_service.dart`
was not touched by Phase 1. Not fixed here — needs a human listening on a device to tell
pool exhaustion from a loop-point gap from something else, which is exactly what Phase 0's
entry already said this needed and never got.

**#7 and #8 (character-select cropping, tutorial contrast/trigger):** left open at the end of
the first pass since they were outside the user's original "investigate 3-6" scope; fixed in
the same-session follow-up — see the new bullets in section 2 above.

## 4. Decisions made (and why)
- **Fixed the wrong-answer HP bug while touching this code, rather than filing it
  separately.** It directly contradicts the exact section (8) being reverted, and leaving it
  would mean the new shared pool drains on quiz mistakes too — silently reintroducing the
  "wrong answers cost HP" behavior revision 7 explicitly reverses.
- **Did not wire up `WallComponent` spawning while removing crates**, even though that
  leaves zero ground hazards except enemies for now. Phase 3 replaces the whole mechanism with
  Gates (Section 6) — spawning bare walls now (no gate mechanic) would be the identical
  throwaway-work situation as the crate cut and the deferred gap system, not a fix.
- **Did not touch audio pooling.** Confirmed, real, pre-existing, but needs a human's ears on
  a longer session, not more static analysis — sprite scale (originally deferred alongside it
  for the same "needs its own pass" reason) was fixed later in this same session once the user
  asked for it directly; see Section 2.
- **Kept the 1.5x scale factor consistent across enemies, coins, and platform tiles** rather
  than picking a different ratio per component, so the world reads at one register instead of
  trading "enemies too small" for "coins too big."
- **Fixed platform thickness by shrinking the underside to 8px rather than reverting tileSize**
  — reverting the tile size back to 16 would have undone the scale fix entirely; the actual bug
  was thickness eating into ground clearance, not the tile size itself, so only the underside
  needed to shrink.
- **Raised the platform height floor (60→90) more than the ceiling (105→110)** — the floor is
  where the screenshot showed the problem (knee-height ledges), and the ceiling was already
  close to its jump-reachability limit.
- **Did not resume the game engine when confirming quit from the pause menu** — the level is
  being torn down, not returned to, so restarting its game loop before the route changes only
  creates a window for a stray frame to navigate somewhere else first.
- **`assets/tiles/crate.png` left on disk.** Deleting unused assets is safe but separate from
  "remove the code that uses it," and wasn't asked for.
- **Moved the tutorial's `_TutorialPage` panel to the app's existing light-parchment/dark-ink
  pairing instead of tuning alpha values on its dark-on-dark original.** The original combo
  (55% black panel over a 65% black backdrop scrim) meant the panel barely separated from its
  own background regardless of how legible any single piece of text was — matching what every
  other panel in the app already does (and already reads fine) fixes the actual cause instead
  of guessing at which alpha number was "the" problem.
- **Tutorial gate lives in `LevelSelectScreen`, not `GameScreen`.** Intercepting at the
  level-select tap (before `context.go('/game/...')`) means the Flame engine, its audio, and
  its spawner timers never start until after the tutorial is dismissed. Gating inside
  `GameScreen.initState()` instead would have meant the level was already loading and ticking
  underneath the tutorial overlay — audio starting early, enemies potentially spawning while
  the student is still reading.
- **Added platform-landing tests that assert the confirmed tunneling risk as a known fact,
  not just a passing "it works" test.** A test that only ever asserted success would have
  given no signal if this exact scenario silently broke (or got silently "fixed") later —
  asserting the actual current behavior, with a comment explaining why, means the next person
  to touch this collision code sees it fail loudly and has to make a deliberate choice about
  it either way.

## 5. Things we tried that did NOT work
- Initial platform-landing test design predicted a 300ms hitch *right at jump-off* would
  overshoot the platform — it didn't (velocity is still small that early in the arc), so the
  first version of that test asserted the wrong expected landing position. Corrected once the
  actual run showed the player landing on the platform, then added a second, properly
  adversarial test that times the hitch for the worst instant (already falling fast, one
  frame from the window) — that one does confirm the tunneling risk. Recorded here since the
  wrong first guess is itself the useful lesson: a hitch's danger depends entirely on *when*
  in the fall it lands, not just its size.
- The user's own hypothesis for the low-platform bug was a sprite anchor shifting the render
  position once tiles were scaled up. Checked and ruled out before touching any code:
  `TilePlatformComponent`'s anchor is `topLeft` and its render loop draws the top row starting
  at local y=0, so `position.y` (== `surfaceY`) was already the true top edge before and after
  scaling — confirmed against `ChronoGame.groundY`/`GameConstants.playerX` math, not just
  asserted. The real bug was thickness (see Section 2), which grows downward from that same
  correct top edge and was never about the top edge moving at all.
- First `sprite_scale_test.dart` draft used a bare, unloaded `ChronoGame` (the pattern several
  other test files in this repo use for speed) and every assertion failed with sizes of 0 —
  `onLoad()`, which is where every component's `size` and hitbox actually get set, never runs
  without a real ticking game. Rewrote to mount a real `GameWidget` and alternate
  `tester.runAsync()` (real time, for the sprite file I/O) with `tester.pump()` (which is what
  actually advances the game loop and mounts the hitbox child).

## 6. Next steps (in order)

1. ~~User is playtesting this full batch on-device~~ **Done — the user tested a built APK
   across several iterations of this pass and reported the three issues in Section 1's "second
   follow-up" (sprite scale, pause-menu quit, platform height), all fixed and re-tested in
   turn.** The platform-height fix specifically was confirmed via a device screenshot showing
   the corrected result. Committed on `v2-phase-1` at the end of this session — see Section 7
   for what's now protected going forward.
2. Phase 2 — combat and Kaalaman, per the Phase 1 entry below.
3. Whenever there's a dedicated pass to spare: get a human's ears on a longer play session for
   audio (#6, still unfixed), and consider whether the confirmed platform-hitch tunneling risk
   (severe ~200ms single-frame stall, narrow but real) is worth a fix before Phase 4's Tiled
   rewrite replaces this collision code anyway. Neither blocks Phase 2 per the user's own
   framing (only collision/movement/hearts do), and the tunneling risk is arguably not worth
   fixing given Phase 4 replaces the mechanism regardless.
4. If the pause-menu quit still doesn't work on-device after this pass's two fixes: the bug is
   somewhere neither fix reaches. Worth checking first whether **ITULOY** (resume) works at
   all — if it doesn't either, something is eating taps before either button's handler runs,
   which points away from the quit-specific logic entirely.

## 7. Constraints & conventions
- Do not rename `HeartsState`, the `GameState.hearts` field, or the two Hive keys
  (`hearts_count`, `hearts_regen_start_ms`) — unchanged rule, still applies; this pass renamed
  only the `GameNotifier`/`ChronoGame`-level method and field names around them.
- `flutter test` must stay scoped to `test/data test/game test/models` — `test/screens/`
  (`tutorial_screen_test.dart`) still hangs, unrelated to this pass.
- Do not change gravity (900) or jump force (-480) — confirmed unchanged again this pass,
  still the rule for every phase after Phase 1.
- **Platform spawn height is no longer 60-105 — it is 90-110 as of this pass**, changed at
  the user's explicit request after a device screenshot showed the old range reading as
  ankle-height steps rather than jumpable ledges. This supersedes the "do not change platform
  spawn heights" rule the Phase 1 entry below states; that rule was correct for Phase 1 itself,
  but this later, deliberate, user-requested and re-tested change is the current source of
  truth. If raised further, the ceiling must stay at or under `jumpPeak - 15` (currently 113) —
  `platform_layering_test.dart`'s "spawn no higher than the jump can reach" test enforces this
  automatically, so a future change that violates it fails loudly rather than silently.
- Platform tiles now draw at 24px (`TilePlatformComponent.tileSize`) from a 16px source sheet
  (`sourceTileSize`) — if the sheet itself is ever swapped for real Kenney art, keep both
  constants in sync with whatever the new sheet's native tile size actually is.

---

**Date:** 2026-09-26 (Phase 1 — player control)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement GAMEPLAY-V2.md Phase 1 (Section 15 prompt/criteria): refactor `chrono_game.dart`
into separate concerns, add Flame's `JoystickComponent` + two `HudButtonComponent`s (jump,
attack), unlock the player's X so movement is joystick-driven instead of a constant
auto-advance, and switch the camera to genuinely follow the player. Attack button present but
inert (Phase 2 wires it up). Enemies still open the quiz on contact — combat is Phase 2.

## 2. Current state

**Refactored**, per the Section 15 prompt — `chrono_game.dart` (now 294 lines, was 303) split
into:

- `lib/game/game_camera.dart` — `updateCamera()` extension, the pre-existing camera-follow
  line moved verbatim.
- `lib/game/game_spawning.dart` — `setupSpawning()`/`updateSpawning()` extension wrapping the
  ground/enemy spawner setup that used to live inline in `onLoad()`/`update()`.
- `lib/game/game_collision.dart` — `PlayerGroundCollision.resolveGroundContact()` extension on
  `PlayerComponent`, the hand-rolled ground/platform AABB check moved out of
  `player_component.dart`'s `update()` verbatim. This is deliberately the same code Section 11
  flags as what Phase 4's Tiled migration has to re-point — kept in its own file for that
  reason, not just line-budget hygiene.
- `lib/game/game_input.dart` — new: builds the joystick + jump/attack buttons.

**Player movement** (`player_component.dart`): `position.x += forwardSpeed * dt` (constant,
one-directional) replaced with `position.x += forwardSpeed * relativeDelta.x * dt`, reading
`game.gameInput.joystick.relativeDelta.x` every frame — signed, so both direction and speed
come from how far the knob is pulled. `forwardSpeed` (150.0) kept as the name/value of the
*cap*, not an unconditional rate. Player can't walk left of world x=0 (no ground/background
authored further left yet; Phase 4 gives levels real bounds).

**Facing direction**: a real bug, caught by `player_movement_test.dart`, not just implemented
and assumed correct. First attempt used Flame's `flipHorizontallyAroundCenter()` — confirmed
against the installed Flame source that for a non-center anchor (this player uses
`Anchor.topLeft`, the default) that method compensates by adding the full sprite width to
`position.x`. Since `position.x` *is* `worldX` here — read by the camera, the hand-rolled
ground collision, and the spawner's distance tracking — every direction change silently
teleported the player's world position by ±96 units. Fixed by mirroring only inside a
`render()` override (`canvas.translate(size.x, 0); canvas.scale(-1, 1);`, saved/restored around
just the `super.render()` call) — a pure rendering effect that never touches
`position`/`transform`, so nothing else can be affected by it.

**`enemy_spawner.dart` distance math fixed** per the Phase 1 prompt: used to accumulate
`PlayerComponent.forwardSpeed * dt` — a compile-time constant, correct only while the player
auto-advanced. Now tracks the player's furthest-right `worldX` (a high-water mark) and only
counts forward progress past the previous best, so standing still adds nothing and backtracking
over already-spawned ground never re-triggers a spawn on the way back.

**On-screen controls**: joystick bottom-left, jump/attack buttons bottom-right, added to
`camera.viewport` (not `world` or the game directly) — both `JoystickComponent` and
`HudButtonComponent` mix in `ComponentViewportMargin`, whose margin math needs a parent that
provides a size; `camera.viewport` is the `FixedResolutionViewport` this game already uses, so
margins land against the fixed 1280x720 virtual resolution rather than the raw device canvas.
**The knob/background/button art is plain Flame `CircleComponent`/`TextComponent` shapes, not
the Kenney CC0 on-screen-control art Section 3 calls for** — same "plumbing now, real asset
later" split Phase 0 used for audio. Swapping in real Kenney art is a follow-up, not blocked on
anything.

**Removed the full-screen tap-to-jump `GestureDetector`** in `game_screen.dart` — it would have
competed with the joystick/buttons' own `DragCallbacks`/`TapCallbacks` for the same touches in
the gesture arena. Jump is now only the dedicated button. Updated the HUD's first-jump hint
text (`hud_overlay.dart`) from "TAP SCREEN TO JUMP" to "JOYSTICK TO MOVE • TAP JUMP" since the
old copy described a control that no longer exists.

**Protected values untouched**: gravity (900), jump force (-480), platform spawn heights
(60-105) — confirmed unchanged, only the ground-contact *check* moved files, not its numbers.

**Tests**: `flutter analyze` clean (same 5 pre-existing info-level issues in files this phase
never touched — `login_screen.dart`, `background_history_screen.dart`). Added
`test/game/player_movement_test.dart` (movement direction/clamp/facing, ground-contact
resolution) and `test/game/enemy_spawner_distance_test.dart` (the four distance-math cases:
standing still, one full interval, backtrack-then-recross, resume past the high-water mark) —
10 new tests, all passing. Full scoped run (`flutter test test/data test/game test/models`,
per the existing convention below) — **106 tests, all passing.**

## 3. Decisions made (and why)

- **Kept `PlayerComponent.forwardSpeed`'s name and value (150.0), repurposed as a cap rather
  than a rate.** Existing code depends on the literal value for reasons unrelated to how it's
  applied: `parallax_background.dart` uses it only as a tuning-ratio reference
  (`_referenceBaseVelocity / PlayerComponent.forwardSpeed`), and that file already derives its
  actual scroll speed from real camera-position deltas each frame — so it needed zero changes.
  Renaming or changing the value would have been unnecessary churn for a value that's still
  correct as "the game's characteristic forward speed."
- **`resolveGroundContact()` reads raw `position`/`size` fields, not the hitbox/transform.**
  Confirmed this means it's unaffected by the `render()`-only facing flip (scale is never
  touched) — the two features are provably independent, not just untested-and-hoped.
- **Didn't restore crate contact damage**, even though the crate-harmless comment in
  `player_component.dart` says to "restore the damage once [Phase 1] lands." Re-read Section 5:
  the full `-1 HP` treatment is bundled with knockback and invincibility frames, both explicit
  Phase 2 deliverables (Section 14 lists "Contact damage: knockback + invincibility frames"
  under Phase 2, not Phase 1). Restoring bare damage now, without knockback, would ship a
  partial version of that spec — left for Phase 2 as written.
- **Didn't attempt to source real Kenney control art this phase.** Kenney's actual page
  structure didn't resolve cleanly through the tools available (title/URL guesses returned
  404s or an uncertain AI-summarized page), and chasing it further risked spending the session
  hunting binary assets instead of the actual player-control mechanic the phase is graded on.
  Plain Flame shapes are a fully real, functional, testable control surface — only the skin is
  a placeholder, same tradeoff Phase 0 made for audio content.

## 4. Things we tried that did NOT work

- **`flipHorizontallyAroundCenter()` for facing direction.** Looked correct, compiled clean,
  and would have shipped broken if the movement tests hadn't been written first — see Section 2.
  This is the headline finding of this phase: write the test, don't just eyeball the diff,
  especially for anything touching `position` on a component whose position is reused as
  world-authoritative state.
- **Running the full `flutter test` suite unscoped.** Confirmed (again) that `test/screens/`
  hangs — this was already documented below (2026-09-22 Tier 1 entry) and the scoped-run
  convention already existed; this session re-discovered it live by watching a `flutter test`
  invocation sit at zero output for 30+ minutes before checking process CPU deltas (static
  across checks = genuinely hung, not just slow) and bisecting down to
  `test/screens/tutorial_screen_test.dart`. No code changes needed — just don't run it unscoped.

## 5. Next steps (in order)
1. **Playtest on a real phone for ten minutes** — Section 15's own words: "the most important
   playtest in the project." Nothing here can substitute for it: does the joystick feel good
   under a thumb, is the dead zone reasonable, does the jump button's position clash with the
   joystick's reach. Fix control feel before starting Phase 2 — everything else is built on top
   of it.
2. Phase 2 — combat and Kaalaman (attack hitbox, charge system, Walker/Heavy enemies, contact
   damage + knockback + i-frames, distance-based level end). See GAMEPLAY-V2.md Section 15.
3. Swap the placeholder joystick/button shapes for real Kenney CC0 on-screen-control art
   whenever there's a spare hour — purely cosmetic, not blocking.
4. Content debt carried over (unchanged): `questions_nationalism.json`, era 4/5
   `historicalText` split, audio still needs a human ear on real files.

## 6. Constraints & conventions
- `flutter test` must stay scoped to `test/data test/game test/models` — `test/screens/`
  (`tutorial_screen_test.dart`) hangs, pre-existing, unrelated to this phase (zero diff against
  the pre-Phase-1 branch). Confirmed again this session.
- Any component that flips/scales for a visual effect and whose `position` is read elsewhere as
  world-authoritative state (this player's `worldX`) must flip via a `render()`-local canvas
  transform, never `flipHorizontally()`/`flipHorizontallyAroundCenter()` — those are
  transform-based and, for non-center anchors, mutate `position` as a side effect.
- Do not change gravity (900), jump force (-480), or platform spawn heights (60-105) — verified
  unchanged this phase, still the rule for every phase after this one too.
- Do not rename `HeartsState`, the provider fields, or the Hive keys (Phase 0 rule, still applies).

---

**Date:** 2026-09-25 (Era 3 level-count correction + real BOW weeks)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Two corrections to Phase 0.5 (previous entry, below), both driven by a `GAMEPLAY-V2.md`
revision 5 the user made after that phase shipped: Era 3 (`nationalism`) has **7** levels, not
6 — the original doc miscounted its BOW competency groups — and Section 1 now has real,
sourced BOW week numbers for every level, so `CurriculumTag.weeks` no longer needs to stay
empty.

## 2. Current state

**Not yet committed, all in CHRONO-GAMEAPP:**
- `lib/core/constants.dart` — `EraData.levelCount` (a bare `int`) replaced with
  `EraData.levelWeeks` (`List<List<int>>`, one entry per level). The era's level count is now
  simply `levelWeeks.length` — a second field that could drift out of sync with it would be the
  same mistake `boss_component.dart`'s duplicate boss-name map already was, avoided the same way.
  `nationalism`'s list gained its 7th entry (`[10]`, now the boss level); every other era's list
  is unchanged in length, only newly carrying real weeks instead of an empty array.
- `EraData.levels` (the computed getter) now builds each `CurriculumTag` with
  `weeks: levelWeeks[i]` instead of leaving it at the `CurriculumTag` default of `const []`.
- All six eras' `levelWeeks` transcribed directly from `GAMEPLAY-V2.md` Section 1's "Curriculum
  weeks, sourced" table and cross-checked twice against it value-by-value after typing them in.
- `lib/models/level.dart`, `lib/game/chrono_game.dart` — two stale doc-comment references to
  the old "10/5/6/8/8/5" count (from the previous entry, written before this correction existed)
  updated to "10/5/7/8/8/5" / "43 total".

**Verified:** `flutter analyze` clean at the same 5 known pre-existing lints. `flutter test
test/data test/game test/models`: **96/96**, unchanged — no test hardcoded era 3's old count.
`grep` confirms no remaining `levelCount: 6` or stale "42 total" references in `lib/`. Not
re-verified live over CDP this round — the registry-driven `levels` getter is the same code
path the Phase 0.5 entry already confirmed working end-to-end (including for `nationalism`
specifically), and this change only feeds it a longer list plus non-empty `weeks`, so a second
live pass would be re-testing the same mechanism rather than new risk. Worth a quick look next
time the dev server's already up: `nationalism` should show 7 level nodes with the boss on 7.

## 3. Decisions made (and why)
- **`levelCount` removed rather than kept alongside `levelWeeks`.** Keeping both would mean two
  places that have to agree on one era's level count, with nothing enforcing it — exactly the
  kind of drift this whole phase exists to eliminate. `levelWeeks.length` is the count.
- **Wrote the real weeks in, didn't leave `CurriculumTag.weeks` empty pending a "second pass."**
  The reason it was left empty originally was the absence of sourced data, not a design
  preference — now that `GAMEPLAY-V2.md` has it (transcribed from the actual DepEd BOW PDFs per
  the doc's own revision-5 note), populating it is the same "don't fabricate curriculum data"
  principle from before, applied to real data instead of missing data.

## 4. Things we tried that did NOT work
- (None — a data-shape change with no surprises once the source table was in hand.)

## 5. Next steps (in order)
1. Commit this correction to `v2-phase-0`.
2. Spot-check `nationalism` shows 7 levels (see Verified) next time CDP tooling is already up —
   not blocking, since the underlying mechanism is already proven.
3. Phase 1 — player control (see the Phase 0.5 entry below for detail).

## 6. Constraints & conventions
- Same as the Phase 0.5 entry below — nothing new this round.

---

**Date:** 2026-09-25 (GAMEPLAY-V2 Phase 0.5 — era/level registry)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement Phase 0.5 of `GAMEPLAY-V2.md` **[prerequisite]**: a `Level` data model and a single
era/level registry for the six eras from Section 1 (10/5/6/8/8/5 levels, 42 total), replacing
every hardcoded five-era list and `level == 10` boss check across the codebase. No gameplay
behaviour change — the game must play exactly as before, just driven by data instead of literals.

## 2. Current state

**Not yet committed, all in CHRONO-GAMEAPP:**
- `lib/models/level.dart` (new) — `CurriculumTag` (grade, term, weeks) and `Level` (eraId,
  index, curriculum, isBoss). No separate "question pool reference" field: a level's questions
  are already looked up by exactly its `(eraId, index)` pair via `QuestionBank.getQuestions`,
  so a third field would only duplicate that.
- `lib/core/constants.dart` — `EraData` gains `grade`, `term`, `levelCount`, and a computed
  `levels` getter (`List.generate(levelCount, ...)`, last one `isBoss: true`). `eraGradeMap` is
  gone, folded into `EraData.grade`. `allEras` reordered to Section 1's era 1-6 order and gains
  a sixth entry, **`nationalism`** (Era 3, Pag-usbong ng Nasyonalismo) — the era the old
  five-era list was missing entirely.
- 18 other files switched from hardcoded era-id lists / `== 10` checks to registry reads:
  `question_bank.dart`, `chrono_game.dart` (new `isBossLevel` getter), `hud_overlay.dart`,
  `game_screen.dart`, `era_progress.dart` (`isLevelUnlocked`, `averageLevelScore`),
  `level_select_screen.dart`, `level_node.dart`, `era_selection_screen.dart`,
  `era_complete_screen.dart`, `background_history_screen.dart`, `gap_component.dart`,
  `wall_component.dart`, `boss_component.dart`, `audio_service.dart`,
  `parallax_background.dart` (wires up the `era3Nasyonalismo` tint Phase 0 left unreachable),
  `progress_provider.dart`, `api_service.dart`.
- `test/data/question_bank_test.dart` — one test switched from `spanish` to `pre-colonial` for
  its boss-level assertion, since which level number is "the boss level" is now era-specific
  and spanish's shrank from 10 to 5 (see Decisions).

**Verified:** `flutter analyze` clean at the same 5 known pre-existing lints. `flutter test
test/data test/game test/models`: **96/96**. `grep` confirms zero remaining `== 10` boss
checks and zero remaining five-element era-id literals. Live CDP playtest against a
cache-disabled fresh build confirmed: all six eras appear in era-selection for the right grade
(pre-colonial/spanish/nationalism for grade5); level-select shows the exact Section 1 count for
every era (10/5/6/8/8/5, spot-checked all six); the boss node lands on the last level of each;
and a real Nationalism-era level plays correctly end to end — ochre tint, grey ground, no
console errors — proving every one of that era's reused-asset mappings (wall, boss, BGM, ground
colour, tint) actually resolves rather than just compiling.

## 3. Decisions made (and why)
- **The five existing era id strings (`pre-colonial`/`spanish`/`american`/`ww2`/`modern`) are
  kept exactly as they are — not renamed to match Section 1's new titles.** They're the join
  key for every already-recorded record of progress, locally (Hive) and on the backend
  (`QuizResult`/`EraProgress` documents are keyed by this string). Section 1 never actually asks
  for a rename, only for the era the old list was missing — Era 3 — which is why the only new
  id added is `'nationalism'`. Mapped onto Section 1's era numbers by best content overlap:
  pre-colonial→1, spanish→2, american→4, ww2→5, modern→6.
- **Known content gap, left deliberately alone:** Section 1 notes eras 4 and 5 each span more
  than one visual period (era 4 Spanish→American, era 5 American→WW2→Modern), and some
  narrative currently sitting in `american`'s `historicalText` (Commonwealth, 1935) arguably
  belongs on the era 4/5 boundary rather than fully inside era 4. Re-splitting that text
  accurately needs the source BOW PDFs (Appendix D), not a code change — guessing at it would
  risk shipping incorrect Philippine history in a thesis product. Left as-is; flagged here
  rather than silently "fixed."
- **`CurriculumTag.weeks` is left empty for every level.** Grade and term come straight from
  Section 1's own table, but the specific BOW week numbers per competency group aren't in
  `GAMEPLAY-V2.md` itself — only in the DepEd PDFs it cites. A fabricated week number would be
  worse than an honestly-missing one, since CHRONO-DASHBOARD would report it to teachers as fact.
- **Era 3 (`nationalism`) reuses Spanish's enemy set, wall art, ground colour, and boss
  (Governor)** — exactly what GAMEPLAY-V2.md Section 1 itself prescribes ("Era 3 reuses
  spanish_wall.png, which is period-correct"; "reuse the Governor if time runs out"). Its
  `historicalText`, subtitle, and guide (Marcelo H. del Pilar) are new, written from general
  knowledge of the Propaganda Movement / GOMBURZA / La Liga Filipina — solid, uncontroversial
  history, distinct from the exact-week curriculum mapping above that genuinely needs a source
  document. No `questions_nationalism.json` was written (that's content authoring, out of
  scope); `QuestionBank`'s existing missing-file fallback already covers it with generated
  placeholders, same as any level whose real pool runs short.
- **`ChronoGame.isBossLevel`** (`currentLevel == getEraById(currentEra).levels.length`) replaces
  three separate `currentLevel == 10` sites in one place, rather than inlining the registry
  lookup at each. `EraProgress.isLevelUnlocked`/`averageLevelScore` do the equivalent lookup
  directly since they only have an `eraId` field, not a live game reference.
- **Deleted `boss_component.dart`'s private `_getBossNameForEra` map** rather than adding a
  `'nationalism'` entry to it — it was a verbatim duplicate of `EraData.bossName` for every
  existing era, a second source of truth that could silently drift. Reads the registry directly
  now.
- **Two extra hardcoded sites fixed along the way, not in Phase 0.5's own file list:**
  `level_node.dart` printed a hardcoded `'Level 10'` label on every boss node regardless of the
  real level number (harmless while every era had 10 levels; wrong the moment one doesn't), and
  `era_complete_screen.dart` had a static "Average sa mga Level (1–9)" string. Both are now
  level-count-driven. The doc says its file list "is the starting point, but grep for others."

## 4. Things we tried that did NOT work
- (None new this session — see the entry below for the cache/auto-reload pitfalls found while
  verifying Phase 0, both now fixed permanently in `tool/cdp_shot.js`.)

## 5. Next steps (in order)
1. Commit this phase to `v2-phase-0` (or a new `v2-phase-0.5` branch, per the doc's "branch per
   phase" rule — see Constraints).
2. Phase 1 — player control: refactor `chrono_game.dart` into input/camera/spawning/collision
   files, add `JoystickComponent` + jump/attack `HudButtonComponent`s, unlock the player's X.
   Do not change gravity (900), jump force (-480), or platform heights (60-105).
3. Content debt, whenever there's time for it (not blocking, not this project's engineering):
   write `assets/data/questions_nationalism.json`, and get the BOW PDFs to re-split the
   era 4/5 historicalText boundary and fill in real `CurriculumTag.weeks` values.

## 6. Constraints & conventions
- **Era ids are now load-bearing identifiers, not display strings — never rename one without a
  migration plan.** They key Hive storage and backend documents for every player's recorded
  progress. Adding a new era (as this phase did for `'nationalism'`) is safe; renaming an
  existing one orphans that era's history.
- `flutter test` must still be scoped to `test/data test/game test/models`; `test/screens/`
  still hangs (see the 2026-09-22 Tier 1 entry, folded below).
- Do not rename `HeartsState`, the provider fields, or the Hive keys (Phase 0 rule, still applies).

---

**Date:** 2026-09-25 (GAMEPLAY-V2 Phase 0 — free wins)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement Phase 0 of `GAMEPLAY-V2.md` (revision 4): unstub audio via `flame_audio`, per-era
parallax tint, Energy rename (UI surface only), in-level HP 10 → 5, the tutorial copy string,
and the level-complete screen's fabricated results.

## 2. Current state

Correctly on `v2-phase-0` as of this entry (Phase 0 is commit `bb006ef` in CHRONO-GAMEAPP; this
doc + `GAMEPLAY.md`/`GAMEPLAY-V2.md` are `3568db6` at root) — an earlier draft of this entry's
Next Steps had this backwards, claiming it landed on `main`.

**Not yet committed, all in CHRONO-GAMEAPP unless noted:**
- `pubspec.yaml` / `pubspec.lock` — added `flame_audio: ^2.12.2` (pulls `audioplayers`).
- `lib/services/audio_service.dart` — stub replaced with a real `flame_audio` implementation.
  Same public API, so no call site changed. Notes: the asset prefix is set to
  `assets/sounds/` via `FlameAudio.updatePrefix` (flame_audio defaults to `assets/audio/`);
  plugin init is deferred to the first play call, because touching `FlameAudio.bgm` builds an
  `AudioPlayer` and `ChronoGame` creates its `audioService` as a *field initializer* — eager
  init would drag the plugin into every test that merely constructs a game. Every call is
  wrapped in try/catch, matching the parallax/sprite loaders.
- **All 18 files in `assets/sounds/` replaced with real audio** (user-supplied placeholder
  pack): 13 SFX and 5 era BGM loops, each BGM in a scale matching its era — pentatonic
  (pre-colonial), Phrygian dominant (Spanish), major (American), natural minor (WWII), minor
  pentatonic (Modern). All 18 are ID3-tagged MP3s, 1.7 KB–307 KB, replacing the 4-byte stubs
  described in Decisions. **No code change was needed to adopt them** — the filenames match
  what the service already asked for, which was the point of doing the plumbing first.
- `lib/screens/game/game_screen.dart` — added `dispose()` → `stopBgm()`, plus passes the real
  result to the completion screen via GoRouter `extra`.
- `lib/game/components/parallax_background.dart` — six Section-1 tint constants + per-era
  application through the decorator chain.
- `lib/core/constants.dart` — `livesPerLevel` 10 → 5.
- `lib/screens/tutorial/tutorial_screen.dart` — the "May 10 buhay" string now interpolates
  `GameConstants.livesPerLevel`, so it can't drift from the constant again.
- `lib/screens/game/level_select_screen.dart`, `level_failed_screen.dart` — Energy rename:
  bolt icons + "ENERHIYA" label + Filipino copy. `HeartsState`, the provider fields and the
  Hive keys are untouched, as instructed.
- `lib/screens/game/level_complete_screen.dart` — new `LevelCompleteResult`; the fake
  `widget.level % 3` getters now read the real result.
- `lib/core/router.dart` — reads `state.extra`, falling back to `LevelCompleteResult.empty`.
- `android/gradle.properties` — `kotlin.incremental=false`. **This is what makes the Android
  build work at all with audio**; see Decisions.
- `windows/flutter/generated_plugin_registrant.cc`, `generated_plugins.cmake` — regenerated by
  `flutter pub add` to register `audioplayers_windows`. Generated files, not hand-edited.

**Verified:** `flutter analyze` clean at the same 5 known pre-existing info lints (none in
touched files). `flutter test test/data test/game test/models`: **96/96**, matching the
established baseline. `flutter build web --debug` and `flutter build apk --debug` both
succeed — the APK first from a cleared module cache with no CLI flags, and again after the
real audio landed. All 18 MP3s confirmed shipping at full size in the web bundle.

**Verified visually, over CDP** (`tool/cdp_shot.js`, web build at 1280x720):
- **All five reachable era tints render and are clearly distinct** — era 1 warm green, era 2
  sepia/amber, era 4 dusty gold, era 5 desaturated blue-grey, era 6 hazy cyan. Eras 2 and 4
  are the closest pair (both warm/gold); still distinguishable, but they are the ones to
  re-check on a phone screen.
- **In-level HP is 5**, shown as five hearts in the HUD at level start.
- **Energy reads as its own system** on both level-select and level-failed: "ENERHIYA" label,
  gold bolts for available and a dim outline bolt for spent, with the regen countdown live.
  Level-failed's subtitle now says "Naubusan ng buhay" and keeps a heart icon, so the
  ran-out-of-HP cause and the Energy pool no longer share an icon.
- **The level-complete screen no longer fabricates results.** Reached without a result payload
  it shows "0/0 TAMA / +0 PUNTOS"; the old code would have shown "8/10" and "+80" at level 1
  (`7 + level % 3`), so this is a decisive check that it reads the real value.
- Incidental: the unattended auto-runner failed a level during a long wait and the Energy pool
  correctly dropped to 4/5 with a countdown — the consume path works end to end.
- **Chased down a real-looking bug that turned out not to be one.** An early screenshot showed
  the level starting at 4/5 in-level HP with the player in its hurt pose, before anything had
  been touched. Instrumented `loseLife()`/`PlayerComponent.onLoad`/`GroundSection.onLoad` with
  temporary prints and reproduced it: `loseLife()` fired at `t=0.00s` with `playerY=2894.1` —
  physically impossible from one frame of gravity (~0.25px), so the player's *starting* position
  was already wrong, not something that fell. Root cause: **Chrome was serving a stale, cached
  copy of the compiled `chrono_game.dart` module left over from before a dev-server restart**,
  mixed with fresh modules for everything else — a Frankenstein bundle where `game.size`/
  `groundY` no longer matched what the rest of the game expected. Restarting `flutter run`
  does not change the DDC module URLs, so the browser's normal HTTP cache keeps serving the old
  bytes indefinitely. Confirmed by disabling the cache (`Network.setCacheDisabled`) and
  re-running: `game.size=[1280,720]`, `groundY=660`, `position=[0,540]` — all correct — and
  `loseLife()` never fires on an idle level start. **No code changed as a result; the game was
  never actually broken.** Fixed for good in the tooling instead: `tool/cdp_shot.js` now always
  disables the cache before navigating. Debug prints were reverted.
- **Separate, pre-existing artifact surfaced along the way:** `flutter run -d web-server`
  without the Dart Debug Chrome extension retries its debug-service handshake forever, and
  reloads the page on its own roughly every 20-30s while doing so. A `shot` step landing mid-
  reload comes back black with a bare HUD; a `wait` spanning one looks like the game froze.
  Neither is a bug in the game. Documented at the top of `tool/cdp_shot.js` so it isn't
  mistaken for a regression again — retake the screenshot rather than trusting one that looks
  wrong.

**Still NOT verified — needs a human:** the audio. Nothing here can hear it. Play one level
per era and listen for jump / coin / correct / wrong / hurt, plus the era BGM starting on
entry and stopping on exit, and check the five BGM loops sound different from each other.
The *real-result* path into the level-complete screen also still needs one genuine
playthrough — only the empty-result fallback was exercised above, since scripting a full
10-question level is not practical.

## 3. Decisions made (and why)
- **The bundled sound files were 4-byte placeholders — now resolved, but worth recording.**
  Every one of the 18 was byte-identical: `FF FB 90 00`, a bare MP3 frame-sync header with no
  frame data. That is not a silent MP3 — it does not decode at all, so every
  `FlameAudio.play()` threw, got swallowed by the service's try/catch, and looked exactly like
  the old no-op stub. This made the wiring unverifiable on its own: silent files, a broken
  service, and a missing plugin were three indistinguishable outcomes. Bridged mid-session by
  hand-writing one real WAV (a canonical 44-byte RIFF/WAVE header plus a phase-accumulated
  320→920 Hz sweep) purely as proof the path worked. **Real audio has since landed for all 18
  names**, so that WAV was deleted and `playJump()` reverted to `jump.mp3` — the service is
  back to a uniform `.mp3` list with no special cases. Keep the lesson: if the sounds ever go
  quiet again, check the file sizes before suspecting the code.
- **The old stub's comment blamed an "audioplayers Kotlin compatibility issue" — it is real
  and still present, but it is not a source incompatibility.** `:audioplayers_android:
  compileDebugKotlin` fails under Kotlin 2.3.20 with "Could not close incremental caches
  ... *.tab". There are no `e:` source errors; clearing the cache reproduces it in 22s, and
  the same sources compile the instant incremental compilation is off. It's a Build Tools API
  toolchain bug. Fixed with `kotlin.incremental=false` in `android/gradle.properties`. The app
  has no Kotlin source of its own (only plugins), so the lost incrementality costs ~nothing.
  **Without this line, adding audio breaks `flutter build apk` outright.**
- **BGM stop had to be added; it did not exist.** Nothing in the app called `stopBgm()`,
  `dispose()`, `toggleSound` or `toggleMusic` — harmless while every method was a no-op,
  but once unstubbed the looping era BGM would have played forever over the menus. Hooked to
  `GameScreen.dispose()`, which covers complete, failed and quit alike.
- **The BGM filenames drop the hyphen** (`bgm_precolonial.mp3` vs the `pre-colonial` era id),
  so `playBgm` needs the same mapping `WallComponent` already applies to obstacle art. Naive
  `'bgm_$eraId.mp3'` would have silently failed on exactly one era.
- **The tint is chained onto `decorator`, not assigned over it.** GAMEPLAY-V2 section 10 says
  `component.decorator = PaintDecorator.tint(color)` works directly — that is wrong in a way
  worth knowing: `PositionComponent` declares `late Decorator decorator` and fills it in its
  own constructor with the `Transform2DDecorator` that applies the component's position and
  scale (`position_component.dart:86,122`). Assigning over it throws that transform away. Used
  `decorator.replaceLast(...)`, which appends on first call and swaps on any later one, so a
  re-load can't stack tints. **Worth correcting in the doc.**
- **Only five of the six tints are reachable today, by design.** Era 3
  (Pag-usbong ng Nasyonalismo) has no era id until the Phase 0.5 registry creates one. All six
  constants are defined; the map wires up the five ids that exist, using Section 1's own art
  table for the correspondence (1=pre-colonial, 2=spanish, 4=american, 5=ww2, 6=modern).
  Inventing era 3's content in Phase 0 would be doing Phase 0.5's job.
- **`_points` now shows the game's real accumulated score**, not the old
  `_correct * 10 + bonus` re-derivation, which silently dropped the speed bonus.
- **Crates no longer cost HP** (`player_component.dart`, post-Phase-0 tuning at the user's
  request after playtesting). They still break on contact, so nothing clips through. Reason:
  the spawner runs *two* parallel crate timers (3-7s and 4-8s, `enemy_spawner.dart:55-69`) —
  a leftover from when obstacles were a mix of walls and crates, both timers kept "to preserve
  the combined obstacle cadence" — so a crate lands every ~2.7s. Unavoidable for a one-button
  auto-runner, and dropping HP to 5 turned that from survivable into a drained bar in under a
  minute. **This deviates from GAMEPLAY-V2 section 5**, which wants hazards to deal -1 HP with
  knockback; that design assumes the Phase 1 movement controls, where the player can stop and
  time a jump. Restore the damage when those land, and place crates deliberately in Phase 4
  rather than on a timer. Net effect today: the only live damage source in a level is a wrong
  quiz answer — wall collisions and gap falls are both dead paths, since nothing spawns either.

## 4. Things we tried that did NOT work
- **Clearing `build/audioplayers_android` to fix the Kotlin failure.** Reasonable first guess
  (the error names cache files), but it reproduced in 22s from a clean cache — which is what
  proved it was the incremental machinery itself, not staleness.
- **`flutter pub add` emits a Windows "Developer Mode / symlink support" warning.** It did not
  block anything here — both web and APK builds succeed — so it was left alone.

## 5. Next steps (in order)
1. **Listen to it.** The visuals are verified (see Current state); the audio is not, and
   cannot be from here. One level per era, ears on. Also worth one genuine level completion
   to exercise the real-result path into the level-complete screen.
2. Correct the `decorator` claim in `GAMEPLAY-V2.md` section 10 (see Decisions), and the
   now-stale "sound files are silent placeholders" text in its section 10 / Phase 0.
3. Phase 0.5 — the era/level registry. It is the stated prerequisite for all gameplay phases,
   and it is what makes era 3's tint reachable.
4. Commit the crate-HP fix and the `cdp_shot.js` changes (`player_component.dart`,
   `tool/cdp_shot.js`) to `v2-phase-0` — verified but not yet committed as of this entry.

## 6. Constraints & conventions
- `flutter test` must still be scoped to `test/data test/game test/models`; `test/screens/`
  still hangs (unchanged by this session — see the 2026-09-22 entry for the root cause).
- Do not rename `HeartsState`, the provider fields or the Hive keys. The Energy rename is
  presentation only; those keys hold real regen state and renaming them resets it on upgrade.
- Do not remove `kotlin.incremental=false` without re-testing `flutter build apk`.

---

## Older entries (folded)
- 2026-09-25 (Phase 0/0.5 end-to-end CDP verification) — Confirmed Phase 0/0.5 with real measurements before Phase 1: pixel-diffed all six era tints (every cross-era pair 60-200x further apart than same-era noise), counted level-select nodes by opaque fill colour to confirm 10/5/7/8/8/5 = 43 nodes and correct boss positions across every era, and played a level to completion to confirm the displayed score matches an independently-reconstructed one (305, agreeing three ways). Added `tool/png_util.js` (dependency-free PNG decoder + pixel-diff helpers). No app code changed.
- 2026-09-22 (Tier 1: hit/idle animation, housekeeping; test hang root-caused but NOT fixed) —
  Added `PlayerComponent.triggerCheer()` on a correct answer (verified by asserting the real
  animation object in `player_reactions_test.dart`, not a screenshot — cheer reuses the jump
  pose, so a photo can't tell them apart) and an idle-avatar cycle on character selection.
  Committed `tool/` as a permanent dev tool for the first time. **Fully root-caused the
  `flutter test` hang** (`test/screens/tutorial_screen_test.dart`, still unfixed): the
  "10-minute timeout" is `pumpAndSettle()`'s own default, not a per-test limit; the thing that
  never completes is `path_provider`'s `getApplicationSupportDirectory()` platform-channel call
  inside google_fonts' font lookup, which hangs instead of throwing with no native handler
  present; faking it makes the file fail fast (~5s) but drops `test/data test/game test/models`
  from 92/92 to 64/92, because `question_card_test.dart`/`answer_feedback_test.dart` were only
  ever passing because that same hang ran harmlessly in the background. Reverted rather than
  traded one failure for 28. **Real fix**: bundle Poppins `.ttf` under `assets/fonts/` so the
  font resolves locally with no platform channel at all — blocked on no network access to fetch
  the font file. 96/96 tests (baseline 92 + 4 new).
- 2026-09-22 (outstanding-work checklist) — Wrote `NEXT_STEPS_CHECKLIST.md` at the repo root
  (a session log isn't an ongoing tracker) after verifying every item against real git/code
  state: hearts regen, the bigger sprite, and the parallax light-layer fix were genuinely
  committed; player idle/hit-reaction animation and obstacle variety were genuinely still open;
  the gap system was confirmed dead code by reading it directly, not just carried over from an
  old note. Grouped into 4 effort/independence tiers. No code changed.
- 2026-09-22 (bigger player sprite + parallax light-layer fix) — Player `size` 64x80→96x120
  (1.5x, matching the boss's own native-to-rendered upscale ratio) so the hero reads as bigger
  than regular enemies. Same session, reordered the parallax layers
  (`[back-trees, lights, middle-trees, front-trees]`) to fix light rays drawing in front of the
  mid-trees instead of behind them — also fixed their scroll speed, since Flame ties
  `velocityMultiplierDelta` to array position. Committed `9692c48`/`35b022b`, root `45241ad`.
  92/92 tests, confirmed via real CDP screenshots. Never re-verified at other aspect ratios.
- 2026-09-22 (persistent hearts regen) — Added the persistent pool that gates *starting or retrying* a level (max 5, +1 per 10 real-world minutes, accrues while the app is closed): new pure `lib/models/hearts_state.dart` (`regenerated`/`consumed`/`afterLevelFailed`/`timeUntilNext`, computed lazily from a stored epoch-ms anchor rather than a running `Timer`), two flat Hive keys (`hearts_count`, `hearts_regen_start_ms`), `GameState.hearts` on `GameNotifier`, and the level-select countdown + 0-hearts dialog. Committed `9dee494`, root `fb19d80`. 92/92 tests. Decided explicitly (with the user) that it gates attempts only and leaves in-level HP alone — that was still 10 at the time; GAMEPLAY-V2 Phase 0 later dropped it to 5 and renamed this pool to **Energy** in the UI. Also fixed `level_failed_screen.dart`'s long-standing hardcoded 3-empty-hearts bug and extracted `level_node.dart` to stay under the line budget. Its big find — `test/screens/tutorial_screen_test.dart` doesn't flake but *hard-hangs* 10 minutes at a time, so never run a bare `flutter test` — is root-caused in full in the Tier 1 entry above. Never verified: the 0-hearts branch in a real run (only its unit-tested math).
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