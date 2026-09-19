# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-19
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
