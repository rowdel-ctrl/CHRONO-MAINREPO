# ChronoQuest — Next Steps

Written 2026-10-10 from `GAMEPLAY-V2.md` (Section 14), `HANDOFF.md` (top entries) and the code.
Supersedes the stale `NEXT_STEPS_CHECKLIST.md` (2026-09-22). Updated the same day after the level redesign.

Phase status: 0, 0.5, 1, 2, 3 done. **Phase 4: all 37 non-boss levels are built (terrain engine, generator v2, solver-checked); waiting on a phone review.** Phases 5 and 6 not started.

---

## 1. Finish Phase 4 (levels)

Done on 2026-10-10: all 37 non-boss levels have a map, redrawn with real terrain (raised ground, hills, mesas, courtyards, pillars over water, bridges, towers, a landscape that climbs per section). A search over every level proves it can be finished and has no trap, and the game's own player replays a winning run on each (see `HANDOFF.md`).

- [x] Maps for all 37 non-boss levels (`node tools/levelgen/generate.js --era all --levels all`)
- [x] The six era openers are authored by hand, one recipe per era (`tools/levelgen/openers.js`)
- [ ] **Review every level on a phone**: the feel of the walls and ramps, whether a hop is too hard, enemy placement, frame rate with the terrain draw
- [ ] Tune from that review: piece sizes and weights live in `pieces.js` / `build.js`, rules in `rules.js`; regenerate, then `paths.js` and `parity.js`
- [ ] Optional polish: ladders, vines and grass tufts in the tileset are unused (crate piles and bushes are in)
- [ ] Build the 6 boss-level maps (needed before Phase 5; the boss arena depends on the boss fight)
- [ ] Delete `GroundSpawner`, `EnemySpawner` and `_setupProceduralLevel` once the boss levels have maps (they are the only users left)
- [ ] Update the status header in `GAMEPLAY-V2.md` (done for revision 14; recheck at Phase 5)

## 2. Check on a real phone (nothing below has been seen on a device)

- [ ] Fifth playtest round: speed 250, progress bar, Tunog (sound) screen, slash and death animations
- [ ] Artifact glow, mini progress pill, hearts not regenerating mid-level
- [ ] Level-complete card (two columns, per-artifact dots)
- [ ] Profile redesign, menu icons, Settings, Test Mode
- [ ] QR scan: permission prompt, scan fills the Class Code, bad QR message, denied-camera fallback
- [ ] Platform fights (gap + platform + walker) at the new speed
- [ ] Frame drops in the last sections of a level (audio pool fix is unconfirmed)
- [ ] Build an arm64 APK only when asked

## 3. Question content

- [ ] Write real questions for era 3 (`nationalism` has no question file at all)
- [ ] Era 4 `american`: nothing on the Katipunan / Revolution
- [ ] Era 5 `ww2`: missing the American colonial government
- [ ] Era 6 `modern`: levels 1 and 5-9 are off-topic
- [ ] Boss question pools sit at key 10, which only era 1 reads; fix so each era reads its own last level
- [ ] 5 questions per level means each is asked twice; write 5+ more per level (185 in all), then teacher review
- [ ] Replace the synthesised praise sound with a real voice clip (drop in as `assets/sounds/praise.wav`)

## 4. Phase 5: boss fights

- [ ] Countdown bar and 6 questions
- [ ] Minions between questions
- [ ] Time Freeze wired to the timer (currently does nothing)
- [ ] Boss maps exist (see section 1)

## 5. Phase 6: economy and polish

- [ ] Save a local coin balance (earned in levels, minus spent)
- [ ] `GameNotifier.buyHeart()` (20 coins) and enable the disabled BILHIN button
- [ ] Enforce character unlock costs
- [ ] Power-up purchasing and in-level use of 50/50 and Shield
- [ ] Call the existing power-up sync endpoint
- [ ] Level select reads fresh backend progress, not only the local cache
- [ ] Score and coins sync (deferred by you): game points vs the server's 10 per correct answer. Needs a backend change; recommended design is in the `score-and-coins-sync-deferred` memory
- [ ] Verify the leaderboard screen works (an earlier note said it was not built; HANDOFF suggests a screen exists)

## 6. Before a student build

- [ ] Remove the temporary Test Mode switch
- [ ] Bundle the Poppins font instead of fetching it at runtime
- [ ] Decide how to charge a student who runs out of Kaalaman charges (open question from the playtest)

## 7. Housekeeping

- [ ] Re-write the presentation guide with accurate facts (all 37 levels now have maps; bosses do not) if still needed
- [ ] Decide on `CAMERA_REBUILD_CHECKLIST.md` and `NEXT_STEPS_CHECKLIST.md` (stale; three test-file comments mention the first)
- [ ] Commit the uncommitted game work when you say so (nothing is committed or pushed without your go)
- [ ] Dashboard work is tracked in `CHRONO-DASHBOARD/HANDOFF.md`
