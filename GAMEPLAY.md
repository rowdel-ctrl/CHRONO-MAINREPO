# ChronoQuest Game — How It Currently Works

This documents the actual current implementation of the Flutter/Flame game app (Philippine history auto-runner), based on the code as it exists now. It's meant as a reference for anyone picking up the game codebase.

> Repo note: `CHRONO-GAMEAPP` is a git submodule pointing at `rowdel-ctrl/CHRONOQUEST-GAME`. This doc was written by reading that repo directly.

## 1. The Core Idea

It's a side-scrolling "auto-runner" — the player character walks automatically, you tap to jump — combined with a history quiz. Every enemy you bump into pops a multiple-choice history question instead of a fight. Get it right, the enemy dies and you keep going; get it wrong, you lose a life.

## 2. How the World Moves

The player doesn't actually move across the screen — it stays fixed at a set X position. Instead, the **camera** scrolls to the right at a constant speed (`forwardSpeed = 150` units/sec), and everything else (enemies, coins, walls, platforms, ground) is spawned ahead at fixed world positions and just sits there. That camera motion is what creates the "running forward" illusion. Off-screen stuff behind the camera gets deleted to save memory.

Ground is one enormous continuous strip — there currently aren't real gaps cut into it, even though the game has fall-through-a-gap logic (`playerFellInGap`) ready for when gaps get added.

## 3. Controls

**Single tap anywhere on screen = jump.** That's the entire control scheme — no swipe, no drag, no directional input. Jumping only works while grounded (no double-jump) and is disabled while a quiz question is on screen.

Jump physics: gravity 900, jump force -480 → the player reaches about 128 units of height at the peak. This number matters because platforms are capped just under that height so they're always reachable.

## 4. Player

- 4-frame walk cycle, single jump pose, single hurt pose — all swapped based on the selected character's sprite set.
- Getting hit (enemy hit wrong, wall, crate) triggers a hurt animation and costs a life.
- A correct quiz answer triggers a "cheer" reaction (currently just reuses the jump pose — there's no dedicated cheer sprite yet).
- Falling into a gap resets your vertical position back onto the ground but does **not** push you backward — you don't lose progress along the level, just take the fall.

## 5. Enemies, Obstacles, Collectibles

**Enemies** are the quiz trigger — each enemy that spawns carries exactly one question. There's no fighting; touching an enemy just opens the question overlay. Two enemy skins per era (soldiers, tax collectors, propaganda clouds, etc., themed to match the era).

**Obstacles** — crates and era-themed walls — are pure ground hazards. Hit one without jumping over it and you lose a life; no quiz involved.

**Coins** are the only working collectible: +5 score each, bob up and down, get vacuumed up on touch.

> Note: the game also references "artifacts" as a second collectible type (in constants and the tutorial copy) but there's no actual artifact object implemented yet — coins are the only thing you can currently pick up in the world.

Spawning is distance-based for enemies (roughly every 800 world units) and timer-based for coins/crates/platforms, so pacing feels fairly even regardless of how fast you're going.

## 6. The Quiz Loop (the actual "game" part)

1. You collide with an enemy → the world **freezes** (camera stops, spawning stops) and a question card slides up.
2. Question is 4-option multiple choice, pulled from a **local, bundled JSON file per era** (`assets/data/questions_<era>.json`) — there's no live API call to fetch questions, they ship with the app.
3. A stopwatch runs per question; answering under 10 seconds earns a small speed bonus.
4. **Correct answer:** green "TAMA!" (Correct!) flash, auto-continues after ~0.8s, enemy dies, +10 score (+5 speed bonus if fast).
5. **Wrong answer:** red "MALI!" (Wrong!) flash **plus an explanation panel** you have to read and tap through — it doesn't auto-advance, so wrong answers force you to see why. Costs a life.
6. Two power-ups can be used mid-question: **50/50** (removes 2 wrong options) and **Shield** (absorbs one wrong answer with zero life lost). Both are hidden during the boss fight. A third power-up, **Time Freeze**, exists in the data model but has no actual effect anywhere in the code — it's dead weight right now.

Every answer (right or wrong, with timing) is logged and gets bundled into the result submitted to the backend at level end.

## 7. Levels, Eras, and Progression

- **5 eras**, gated by grade level: Pre-colonial and Spanish-era for grade 5; American, WWII, and Modern for grade 6.
- **10 levels per era.** Level 10 is always a boss fight. Levels unlock sequentially — you must finish level N to open N+1; era N+1 unlocks once era N's boss is beaten.
- First time entering a new era, you're routed through a scrollable history/lore page you must read to the bottom before you're allowed to start playing (a mini history lesson before the game part).
- Level "content" (enemy/obstacle placement) isn't hand-authored — it's generated at runtime by the spawner. The only thing that's actually per-level authored data is the **question set** for that level.
- Star rating per level (1-3 stars) is based on quiz accuracy: ≥90% = 3 stars, ≥70% = 2 stars, otherwise 1.

## 8. The Boss Fight (Level 10)

Level 10 starts like a normal level (10 regular enemy/question encounters), then a boss walks in from off-screen, stops center-screen, and the fight becomes a straight quiz gauntlet: 12 more questions, one per boss "health point." A correct answer chips the boss's health down; get it low enough and the boss is defeated, ending the level. Each era has its own themed boss (e.g., the mythical Bakunawa for the pre-colonial era, a Spanish governor for the colonial era, etc.).

## 9. Lives — Two Separate Systems (important, easy to mix up)

- **In-level HP**: you get 10 hits worth of buffer per attempt (wrong answers, obstacle hits, falls). Hit 0 and the level ends in failure immediately.
- **Persistent hearts** (max 5, separate from the above): this is the "can I even start a level" gate, closer to a mobile-game energy system. Fully failing a level costs one heart; hearts regenerate over real time (10 minutes each) even while the app is closed. Run out and you're locked out of starting/retrying levels until one regenerates.

Both use the same heart icon in the UI, which is a bit confusing since they're unrelated systems.

## 10. Character Selection

Right after login, you pick from 5 historical-figure characters (Lapu-Lapu, Rizal, Luna, Bonifacio, Del Pilar) via a swipeable carousel. Characters have an "unlock cost" defined in their data, but nothing in the code currently enforces or charges for it — you can pick any character freely regardless of coins. Your pick determines the sprite set used in-game.

## 11. Progress, Saving, and Backend Sync

- **Local storage (Hive)**: cached profile, selected character, per-era level completion/stars, cached era progress, hearts state, and a queue of quiz results that failed to upload.
- **What syncs to the backend**: each level's quiz result (score, per-question answers, timing) is POSTed on completion. If offline, it's queued locally and retried automatically on next login/app launch. Official era progress (which levels/bosses are done) is fetched from the backend, with the local cache as a fallback if offline.
- Note: the level-select screen currently reads star/completion data from the **local cache**, not a fresh backend call, so it's technically possible for local and backend records to drift apart if data changes on another device.

## 12. Screen Flow

Login → Character Selection (+ one-time tutorial) → Era Selection → (first visit to an era: History/Lore page) → Level Select → Gameplay → Level Complete/Failed → back to Level Select (loop), or Era Complete after beating level 10's boss → next era unlocks.

Other screens: Leaderboard (class/school), Profile (stats + power-up inventory), forced Change Password on first login.

## 13. Known Gaps / Things Not Fully Wired Up Yet

Worth knowing if you're picking up this codebase:

- **No sound.** The audio service is a stub — every sound effect/music call is a no-op placeholder. The hooks are all in place, there's just no actual audio playing yet.
- **Artifacts** (a second collectible type) are referenced in data/UI copy but don't exist as an actual spawnable object.
- **Character unlock costs** aren't enforced — any character can be selected for free.
- **Time Freeze power-up** is inert — tracked in data but does nothing when used.
- **Power-up sync to backend** — there's a backend endpoint for it, but nothing in the app actually calls it; power-up counts are local-only.
- **Ground gaps** aren't currently spawned even though the fall-through logic exists for them.

## 14. Full Asset List

Everything currently bundled under `assets/`, by folder.

**backgrounds/** (7 files) — screen backgrounds + parallax layers
- `bookshelf_bg.png`, `character_select_bg.png`, `login_bg.png`
- `parallax-forest-back-trees.png`, `parallax-forest-front-trees.png`, `parallax-forest-middle-trees.png`, `parallax-forest-lights.png` (the scrolling in-game background layers)

**characters/** (30 files) — 5 characters × 6 sprites each (walk_1–4, jump, hurt)
- `lapu_*`, `rizal_*`, `luna_*`, `bonifacio_*`, `delpilar_*`

**bosses/** (15 files) — 5 era bosses × 3 states each (idle, attack, defeated)
- `bakunawa_*` (pre-colonial), `governor_*` (spanish), `general_*` (american), `commander_*` (ww2), `corruption_boss_*` (modern)

**enemies/** (18 files) — 9 enemy types × 2 frames each (walk animation)
- pre-colonial: `tribal_warrior_1/2`, `dark_spirit_1/2`
- spanish: `spanish_soldier_1/2`, `tax_collector_1/2`
- american: `american_soldier_1/2`, `propaganda_1/2`
- ww2: `japanese_soldier_1/2`, `tank_1/2`
- modern: `corruption_figure_1/2`, `misinfo_cloud_1/2`

**obstacles/** (5 files) — one era-themed wall each
- `precolonial_wall.png`, `spanish_wall.png`, `american_wall.png`, `ww2_wall.png`, `modern_wall.png`

**tiles/** (2 files)
- `crate.png`, `ground_tileset.png`

**collectibles/** (6 files)
- `coin.png` (the only collectible actually usable in-game)
- `artifact_1.png` … `artifact_5.png` (art exists for 5 artifact variants, but as noted in Section 13, there's no working artifact pickup in the code yet — this art is currently unused)

**powerups/** (3 files) — icons for the quiz power-ups
- `fifty_fifty.png`, `shield.png`, `time_freeze.png` (icon exists even though Time Freeze itself doesn't work — Section 13)

**ui/** (5 files)
- `heart_full.png`, `heart_empty.png` (used for both the in-level HP row and the persistent hearts pool)
- `star_full.png`, `star_empty.png` (level-select star ratings)
- `lock_icon.png` (locked level/era indicator)

**sounds/** (17 files) — actual audio files exist and are bundled, but per Section 13 the audio service that would play them is stubbed, so none of this currently plays in-game
- Music: `bgm_precolonial.mp3`, `bgm_spanish.mp3`, `bgm_american.mp3`, `bgm_ww2.mp3`, `bgm_modern.mp3`
- SFX: `jump.mp3`, `footsteps.mp3`, `coin.mp3`, `correct.mp3`, `wrong.mp3`, `player_hurt.mp3`, `enemy_defeat.mp3`, `powerup.mp3`, `boss_appear.mp3`, `boss_defeat.mp3`, `level_complete.mp3`, `level_failed.mp3`, `era_complete.mp3`

**animations/** (1 file)
- `fireworks.json` (a Lottie animation, presumably for level/era-complete celebration screens)

**data/** (5 files) — the question banks, one JSON file per era
- `questions_pre-colonial.json`, `questions_spanish.json`, `questions_american.json`, `questions_ww2.json`, `questions_modern.json`

---
*Generated by reading the current game source (`lib/game/`, `lib/screens/`, `lib/providers/`, `lib/services/`, `lib/models/`, `lib/core/`) and the `assets/` directory.*
