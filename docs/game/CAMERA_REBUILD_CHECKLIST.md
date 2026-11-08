# ChronoQuest — Camera/World Rebuild Checklist

Follow this checklist top to bottom, one phase at a time. Do not skip ahead to a later phase until the current one is confirmed working. Follow the conventions in `.claude/skills/flutter-flame-gamedev/SKILL.md` and this project's `CLAUDE.md` throughout.

---

## Phase 0 — Setup (do once, before anything else)

- [x] Confirm `.claude/skills/flutter-flame-gamedev/SKILL.md` exists (rename from `SKILL-1.md` if not already done)
- [x] Confirm `.claude/skills/flutter-flame-gamedev/references/golden-testing.md` exists

---

## Phase 1 — Diagnostic (read-only, no changes)

Read the current player, enemy, obstacle, and ground components. **Do not change anything in this phase.**

Report back:
1. Every file that references `worldScrollSpeed` or any hardcoded per-frame movement constant
2. Every place the player's x-position is fixed and the world moves instead
3. Every place enemies/obstacles spawn relative to `game.size.x` and move left (screen-scroll model)
4. Whether any camera component already exists
5. How the current `enemy_spawner.dart` error relates to this scroll-speed model, if at all

Output a plain list. Stop and wait for confirmation before moving to Phase 2.

- [x] Diagnostic complete and reviewed
- [x] Interim cleanup (outside checklist scope, verified via `flutter analyze` — no issues): removed unused duplicate `GameConstants.worldScrollSpeed`/`GameConstants.enemySpeed`; `EnemyComponent` now uses `ChronoGame.worldScrollSpeed` instead of its own private `moveSpeed = 90.0`, fixing the enemy/ground-speed desync noted in the diagnostic. Enemies still use the fixed-constant screen-scroll model — this is not the Phase 2 world-position/dt-scaled rebuild.

---

## Phase 2 — Core rebuild: camera + world positions

1. Give the player component a real world x-position (`worldX`) that increases over time based on forward speed × `dt` — not a fixed screen position.
2. Add a `CameraComponent` (or Flame's built-in camera) that follows the player's `worldX`, with the player rendered at a fixed screen offset.
3. Convert enemies, obstacles, and ground segments to spawn at real world positions ahead of the camera, not at `game.size.x` with a leftward screen-scroll subtraction.
4. Replace every hardcoded `worldScrollSpeed` subtraction with `dt`-scaled movement (`update(double dt)` using `dt`, not a fixed per-frame constant).
5. Keep each file under 200–300 lines — split into separate components if a file grows past that (e.g. keep world-position logic separate from rendering).
6. Do **not** touch quiz/HUD/UI logic in this pass — movement and camera only.

After the change: summarize which files were touched, and flag any file where collision detection still references screen-relative rather than world-relative coordinates.

- [x] Player has real `worldX`, camera follows it
- [x] Enemies/obstacles/ground use world positions, not screen-scroll
- [x] All movement is `dt`-scaled, no fixed per-frame constants remain
- [ ] No file exceeds 200–300 lines — `chrono_game.dart` is 388 lines (was 370 before this phase, already over budget; +18 lines from camera wiring). Not split in this pass since splitting it means reorganizing quiz/level-state logic, which is out of scope for "movement and camera only." Flagged for a decision, not silently deferred.
- [x] Quiz/HUD/UI untouched in this phase

---

## Phase 3 — Parallax re-anchor

Re-anchor the parallax background layers to the new camera/world-position system. Each layer should move at a fractional speed relative to camera `worldX` movement (not the old screen-scroll subtraction). Preserve the existing depth-layer opacity/asset setup — only change how each layer's offset is calculated. Scope this to the parallax component files only.

- [x] Parallax layers move at fractional speed relative to camera, not old scroll subtraction — extracted the inline `_addParallaxBackground()`/`_backgroundAssetKeyForEra()` logic from `chrono_game.dart` into a new `ParallaxBackground` component (`lib/game/components/parallax_background.dart`). Each frame it computes `cameraVelocityX = (game.cameraLeftEdgeX - lastCameraX) / dt` and assigns it to `Parallax.baseVelocity.x`; the existing per-layer `velocityMultiplierDelta` (2.2, 1.0) then applies as before. Previously `baseVelocity` was a hardcoded `Vector2(20, 0)` disconnected from the camera — it only looked right by coincidence because `PlayerComponent.forwardSpeed` is constant. Now it's derived from real camera movement every frame, so it can't drift out of sync even if forward speed ever changes.
- [x] Depth/opacity/assets unchanged — same `{era}_far.png`/`{era}_near.png` pair per era (confirmed both files exist and are distinct per era, not duplicates), same `velocityMultiplierDelta`, `LayerFill.height`, `ImageRepeat.repeatX`, `priority: -10`, and the solid-color fallback if assets fail to load.
- [x] No files outside parallax components touched — only `chrono_game.dart` (removed the inline background-loading code and the now-unused `flame/parallax.dart` import, replaced with `add(ParallaxBackground())`) and the new `parallax_background.dart`. Bonus: this dropped `chrono_game.dart` from 388 to 351 lines (still over the 200–300 budget flagged in Phase 2, not resolved here — that requires reorganizing quiz/level-state logic, out of scope for "parallax component files only").

---

## Phase 4 — Collision check

Audit collision detection between the player, enemies, and obstacles. Confirm collisions are computed from actual world positions (`player.worldX` vs `enemy.worldX`) rather than screen-relative bounding boxes left over from the old scroll model. Fix any that still use the old model. Do **not** change collision response logic (heart loss, quiz trigger) — only the position math feeding into it.

- [x] Collision detection uses world positions, not screen-relative boxes — audited player↔enemy/coin/wall (Flame hitbox/`CollisionCallbacks`, unaffected by `world` nesting since Flame's collision broadphase registers hitboxes regardless of tree depth) and player↔ground (`groundSections` manual math in `player_component.dart`, compares `position.x`/`position.y` which are both world-space on each side). No screen-relative leftovers found; no changes needed here.
- [x] Collision response logic (heart loss, quiz trigger) unchanged — not touched.
- [x] **Bug found and fixed (regression from Phase 2, not new scope)**: `checkLevelEnd()` in `chrono_game.dart` checked `children.whereType<EnemyComponent>()`, but `children` is direct children only (Flame doesn't recurse) and enemies have lived under `world` since Phase 2's `game.world.add(enemy)` change — so the check was always empty and every level ended (or boss fight started) the instant the last question spawned, without waiting for it to be answered. Fixed to `world.children.whereType<EnemyComponent>()`. `flutter analyze lib/game/` clean after the fix.

---

## Phase 5 — Golden/widget tests

Following `references/golden-testing.md` in the flutter-flame-gamedev skill, write or update golden/widget tests that verify:
- Player renders at the correct fixed screen offset regardless of `worldX`
- Camera follows player smoothly
- Parallax layers stay visually anchored

Run the tests and report pass/fail — don't just write them.

- [x] Golden/widget tests written per skill reference — full-game pixel-diff goldens are still blocked by the pre-existing `flame_test` version conflict with `riverpod_generator`/`hive_generator` (documented in `scroll_sync_golden_test.dart`'s file header), so per the skill's "logic-only test" pattern, all three files instead drive a bare, unloaded `ChronoGame` directly: `HasGameReference.game` has an explicit test setter, so components can resolve `game` without running the real async `onLoad()` (audio/API/full asset pipeline). Rewrote:
  - `test/game/enemy_component_test.dart` — enemies stay at a fixed world position (no self-movement), don't despawn while in/ahead of camera view, do despawn once the camera passes them.
  - `test/game/scroll_sync_golden_test.dart` — player renders at the fixed screen offset regardless of `worldX`, camera viewfinder tracks the player every frame (checked across 120 simulated frames), `cameraRightEdgeX`/`cameraLeftEdgeX` stay exactly one screen-width apart.
  - `test/game/parallax_background_test.dart` (new) — `Parallax.baseVelocity` is derived from actual camera movement each frame (via an injected empty-layer `Parallax`, isolating the math from real image decoding) and correctly tracks a changing camera speed frame-to-frame, proving it's no longer a hardcoded constant.
- [x] Tests run and pass — `flutter test test/game/`: **8/8 passed**. `flutter analyze test/`: no issues.
- [x] Any failures diagnosed and fixed before closing this checklist — two issues surfaced and were fixed during writing, not left in: (1) missing `TestWidgetsFlutterBinding.ensureInitialized()` broke real sprite loading in the despawn test; (2) calling `game.update()` while an enemy inside the same tree removed itself mid-cascade tripped Flame's tree iterator ("Concurrent modification during iteration") — fixed by calling the enemy's own `update()` directly for that specific assertion instead of cascading through the full game tree.

---

## Done criteria for this checklist

All boxes above checked, tests passing, and no regressions in quiz/HUD/UI behavior (verify manually by running the game after Phase 5). Only then move on to the next priority: repeat-play question randomization.

### Manual playtest findings (post-Phase 5)

- **Bug found: parallax background scrolled too fast.** `ParallaxBackground.update()` (Phase 3) fed the camera's *full* speed (150 units/sec) directly into `Parallax.baseVelocity.x`. Combined with the existing `velocityMultiplierDelta: Vector2(2.2, 1.0)`, the far layer scrolled at 330 units/sec and the near layer at 726 units/sec — both faster than the world itself, inverting the parallax depth illusion (background should look slower/further away, not faster). The pre-Phase-3 code avoided this by using a small hardcoded `baseVelocity: Vector2(20, 0)` as its reference, which — even after the same multipliers — stayed under the 150 unit/sec world speed. Fixed by scaling `cameraVelocityX` down by that same `20/150` ratio (`ParallaxBackground._referenceBaseVelocity`) before assigning it, so the visual speed matches what was there before Phase 3, just correctly camera-driven now instead of independently ticking. Updated `test/game/parallax_background_test.dart` to assert the scaled value and that background speed stays below world speed. `flutter test test/game/`: 8/8 passed after the fix.
