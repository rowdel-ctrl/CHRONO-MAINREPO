# Root docs

Project-wide notes. Each chat's own notes live in its folder (`CHRONO-GAMEAPP/docs`, `CHRONO-DASHBOARD/docs`).

| File | What it is | State |
|---|---|---|
| `game/GAMEPLAY-V2.md` | The gameplay design (rules, hearts, boss, levels, terrain). Code comments cite its sections. | Main reference, long |
| `game/GAMEPLAY.md` | How the first version of the game worked (September). | Old, kept for history |
| `game/NEXT_STEPS.md` | Next steps written 2026-10-10 (Phase 4 and later). | Old, check `CHRONO-GAMEAPP/HANDOFF.md` for today |
| `game/CAMERA_REBUILD_CHECKLIST.md` | Checklist for the camera and world rebuild (September). | Done, kept for history |

`LEVEL-TOPICS.md` stays at the repo root on purpose: the dashboard script `CBACK/scripts/sync-content.js` reads it from there. Move it only together with that script.
