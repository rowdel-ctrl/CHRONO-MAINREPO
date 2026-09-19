# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-19 (evening)
**From:** Claude Code (asset integration + repo architecture)
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Integrate ground and crate tile assets into the game, correct sprite-sheet tile coordinates from visual inspection, and establish submodule architecture for the root repo so fresh clones work cleanly.

## 2. Current state

**What works:**
- Ground and crate tile assets added to `CHRONO-GAMEAPP/assets/tiles/` (crate.png 16×16, ground_tileset.png 112×128)
- Tile platform coordinates corrected in `tile_platform_component.dart` (lines 24–27) based on upscaled grid inspection
- Both repos committed and pushed (GAMEAPP `3fe421f`, root `e997223`)
- Git identity now consistent across all three repos (Rodel <rodellanoche@gmail.com>)
- Root repo now uses `.gitmodules` for clean submodule cloning

**What's broken or unfinished:**
- **Platform tiles not yet visually verified in-game** — corrected coordinates based on sprite sheet inspection, but need playtest to confirm they render correctly (if wrong, adjust `_topLeftCol/_topMidCol/_topRightCol/_fillCol` in tile_platform_component.dart lines 24–27)
- Next priority still: repeat-play question randomization

**Files/folders touched (this session):**
- `CHRONO-GAMEAPP/lib/game/components/tile_platform_component.dart` — corrected tile coordinates (row/col constants)
- `CHRONO-GAMEAPP/assets/tiles/ground_tileset.png` (new) — 7×8 grid of 16px tiles
- `CHRONO-GAMEAPP/assets/tiles/crate.png` (new) — 16×16 crate sprite
- `CHRONO/.gitmodules` (new) — registered subprojects + GitHub remotes
- Root repo — stopped tracking stray `.git_commit_msg.txt`

## 3. Decisions made (and why)
- **Chose option 1 for nested repos** — kept three separate git repos with `.gitmodules` submodule registration instead of flattening into one; maintains separate histories (GAMEAPP 14 commits, DASHBOARD 27), allows independent releases, fresh clones need `--recurse-submodules` flag
- **Corrected tile coordinates from grid inspection** — previous guess had fill tile at (1,2) which has grass on top; switched to grass-topped set: left cap (1,1), mid (0,1), right (1,2), fill (1,4)
- **Unified git identity to rodellanoche@gmail.com** — set locally in CHRONO-GAMEAPP; global config still uses school address so other projects unchanged

## 4. Things we tried that did NOT work
- **Initial tile coordinate guess** — comment in code said coordinates were best-effort before PNG was available; rendered upscaled grid showed fill tile had grass stripes (would look wrong under platforms) and caps came from different tile styles
- **First attempt at platform rendering** — coords were (0,1), (0,2), (0,5), (1,2); corrected to (1,1), (0,1), (1,2), (1,4) based on visual inspection of actual PNG

## 5. Next steps (in order)
1. **Playtest platforms in-game** — run game, check if floating platforms and crates render correctly; if tile colors/shapes look wrong, adjust those four constants in tile_platform_component.dart and re-test
2. **Implement question randomization** — same quiz can appear multiple times in a run; add shuffle/random-draw per attempt
3. (Optional) Refactor `chrono_game.dart` below 300-line budget — extract level-state logic

## 6. Constraints & conventions
- **Git architecture:** three repos (root tracks subprojects via `.gitmodules`); clone with `git clone --recurse-submodules`
- **Assets:** ground_tileset.png is 7 cols × 8 rows, tiles are 16×16px, 0-indexed from top-left
- **Do not touch:** `.env` files (live credentials), quiz/HUD behavior

## 7. Open questions
- Do the platform tiles look correct in-game? (Need visual confirmation before moving on)
- Should refactor happen before or after question randomization?

## 8. Attachments / references
- Commits: GAMEAPP `3fe421f` (assets + coordinates), root `e997223` (submodules)
- GitHub: [rowdel-ctrl/CHRONOQUEST-GAME](https://github.com/rowdel-ctrl/CHRONOQUEST-GAME), [rowdel-ctrl/CHRONO-MAINREPO](https://github.com/rowdel-ctrl/CHRONO-MAINREPO)

---

**Date:** 2026-09-19 (baseline assessment)
**From:** Claude Code (baseline assessment)
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Establish baseline status of ChronoQuest codebase after major game camera/world rebuild. Identify what's stable and ready for the next feature (repeat-play question randomization).

## 2. Current state

**What works:**
- Full auth flow (JWT + Google OAuth) — backend/frontend integrated
- Game camera + world-position system — Phases 0–5 complete (player has real `worldX`, camera follows, enemies/obstacles use world positions, movement is dt-scaled)
- Parallax background — fixed parallax speed regression (was 330/726 units/sec, now correctly scaled to match pre-Phase-3 visual speed)
- Collision detection — uses world positions, no regressions found
- Teacher dashboard — class management, student performance, analytics
- Admin dashboard — user management, audit logs, system settings
- Game physics — ground collision, enemy spawning, coin/obstacle behavior
- Flutter test suite — 8/8 passing (player screen offset, camera tracking, parallax velocity, enemy despawn)

**What's broken or unfinished:**
- `chrono_game.dart` still over budget (388 lines, target 200–300) — quiz/level-state logic mixed with movement/camera (out of scope for rebuild, flagged for next refactor)
- **Next priority (not started):** repeat-play question randomization — same quiz can appear multiple times on one run, no randomization per attempt

**Files/folders touched (Phase 2–5):**
- `CHRONO-GAMEAPP/lib/game/components/player_component.dart` — added `worldX`, forward speed scaling
- `CHRONO-GAMEAPP/lib/game/components/enemy_component.dart` — world positions, removed private `moveSpeed`
- `CHRONO-GAMEAPP/lib/game/components/parallax_background.dart` (new) — camera-driven parallax
- `CHRONO-GAMEAPP/lib/game/chrono_game.dart` — camera integration, level-end fix
- `CHRONO-GAMEAPP/test/game/` (3 test files) — golden tests for scroll sync, parallax, enemy behavior

## 3. Decisions made (and why)
- **Deferred `chrono_game.dart` refactor** — splitting it requires reorganizing quiz/level-state, out of scope for "movement and camera only" phase; flagged but left as-is to avoid regressions
- **Parallax scaling via `_referenceBaseVelocity`** — preserves pre-Phase-3 visual speed by scaling down camera velocity (20/150 ratio), keeps background visually slower than foreground
- **Test framework used logic-only approach** — golden pixel-diff tests blocked by pre-existing `flame_test` version conflict; workaround: drive components with test-injected game reference instead of full async pipeline

## 4. Things we tried that did NOT work
- **Parallax at full camera velocity** — Phase 3 first pass fed full camera speed (150 units/sec) to `Parallax.baseVelocity`, combined with existing `velocityMultiplierDelta: Vector2(2.2, 1.0)` it inverted depth illusion (background faster than foreground); fixed by scaling velocity ratio
- **`checkLevelEnd()` on `children` only** — Phase 4 found enemies lived under `game.world`, so direct `children` check was always empty and every level ended instantly without waiting for quiz answer; fixed to `world.children`

## 5. Next steps (in order)
1. **Implement question randomization** — same quiz can appear multiple times in a run; add shuffle/random-draw per attempt so it doesn't repeat within the same level
2. (Optional) Refactor `chrono_game.dart` below 300-line budget — extract level-state logic to separate component/service
3. Manual playtest on device — verify no regressions in HUD, quiz trigger, heart loss, level transitions after question randomization

## 6. Constraints & conventions
- **Stack:** Flutter 3.2+, Flame 1.17, Riverpod 2.5, Hive for persistence; Express.js 4.19, Mongoose 8.4, MongoDB Atlas; React 18.3, Vite 5.3
- **Game conventions:** Follow flutter-flame-gamedev skill — lifecycle callbacks in components, no frames-per-second constants (use `dt`), collision via Flame `hitbox`/`CollisionCallbacks`, state via Riverpod providers
- **Do not touch:** `.env` files (have live MongoDB/OAuth credentials), quiz/HUD/UI behavior (out of scope for this cycle)

## 7. Open questions
- Should `chrono_game.dart` refactor happen before or after question randomization? (Randomization doesn't depend on it, but refactoring helps readability; defer = faster feature delivery, refactor first = cleaner codebase)

## 8. Attachments / references
- **Detailed checklist:** [CAMERA_REBUILD_CHECKLIST.md](CAMERA_REBUILD_CHECKLIST.md) — read this for full Phase 0–5 audit trail and all bug fixes
- **Game skill:** [CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev/](CHRONO-GAMEAPP/.claude/skills/) — component patterns, lifecycle, test patterns

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
