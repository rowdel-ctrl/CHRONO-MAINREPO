# Root docs

Project-wide notes. Each chat's own notes live in its folder (`CHRONO-GAMEAPP/docs`, `CHRONO-DASHBOARD/docs`).

| File | What it is | State |
|---|---|---|
| `game/GAMEPLAY-V2.md` | The gameplay design (rules, hearts, boss, levels, terrain). Code comments cite its sections. | Main reference, long |
| `game/GAMEPLAY.md` | How the first version of the game worked (September). | Old, kept for history |
| `game/NEXT_STEPS.md` | Next steps written 2026-10-10 (Phase 4 and later). | Old, check `CHRONO-GAMEAPP/HANDOFF.md` for today |
| `audio-source/` | The music and sound files the user made (2026-11-09 to 11-10), as delivered, in four folders. The game uses renamed copies in `CHRONO-GAMEAPP/assets/sounds`. Not used by the game: `BGM IN BOSS FIGHT/BOSS FIGHT 2.mp3` (quiet, 1.8 s of silence at the end). For the dashboard chat: `BGM IN DASHBOARD/` (two background tracks, 39 s and 50 s, about the same loudness as the game music, no silent gaps). | Source files, kept |
| `game/CAMERA_REBUILD_CHECKLIST.md` | Checklist for the camera and world rebuild (September). | Done, kept for history |

`LEVEL-TOPICS.md` stays at the repo root on purpose: the dashboard script `CBACK/scripts/sync-content.js` reads it from there. Move it only together with that script.
