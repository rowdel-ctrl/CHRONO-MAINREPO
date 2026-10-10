# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

> Dashboard (web) work has its own handoff: `CHRONO-DASHBOARD/HANDOFF.md`. This file is the game.

**Date:** 2026-10-10 (levels redesigned: real terrain and generator v2, all 37 non-boss levels; uncommitted on `v2-phase-4`, not on a phone)
**From:** Claude Code (Sonnet 5.5)
**To:** Claude Code / Chat
**Project:** ChronoQuest

---


**What changed.** The levels were a flat strip with identical floating platforms: the game could only draw one ground height and the tile layer was read as solid-or-empty. Now:
- **Engine.** Ground is a row of blocks, each at its own height (`GroundBlock`, `TerrainGrid` in `level_loader.dart`). `TerrainComponent` draws the map's tile layer (one `drawRawAtlas` call) and `WaterComponent` puts water in every pit, in front of the player (`terrain_component.dart`). Each era has its own tileset image, `assets/tiles/ground_<era>.png`, with the tileset's black fill recoloured (made by `tools/levelgen/recolor.js`; the colours are mirrored in `EraTerrain`, a test checks they match); platforms use it too. `game_collision.dart`: the player lands on the highest ground under the feet, and ground that rises more than `groundBand` (28, one 24-unit tile) above the feet is a wall (`resolveWalls`, run right after every horizontal move). A one-tile rise is walked up. Respawn puts the player on the surface of the block they last stood on; an enemy on raised ground turns at its edge (`isSurfaceUnder`); an artifact takes a `surfaceY` so it stands on the ground under it. Bosses still use the old procedural ground and spawners, so `GroundSpawner`/`EnemySpawner` stay until Phase 5.
- **Map format.** 24-unit tiles (the 16px art at 1.5x, like the player, enemies and platforms). The `ground` layer has `offsety="12"` so row 27 is the base (y 660); a column's first tile is its surface, an empty column is a pit; caps, corners, walls, fill and specks are picked by `terrain.js` when the map is written (grass or bare stone caps, orange earth or blue stone per era). Artifact `y` is the height of the ground under it. `generator` is `levelgen-v2`.
- **Generator v2** (`tools/levelgen`). Eleven set pieces (`pieces.js`: gap, fight, hill, bump, block, mesa, courtyard, pillars, bridge, tower, ridge), packed into the ten sections of each level, on top of a **ground elevation per section** (0-5 tiles, ramps in the rest areas) so a level climbs onto highlands and drops back. The six era openers are authored by hand in `openers.js` (one recipe per era); the other levels pick pieces by act, era flavour and difficulty. 60 seeded candidates per level; each is checked by `validate.js` and **played by `solve.js`**, a search over where a student can stand (walk, drop, jump with the stick held five ways) using a port of the player's movement (`sim.js`) with a 5% slower, lower jump. A level passes only if the gate is reachable and no reachable spot is a trap.
- **Tests.** `node --test tools/levelgen/test/levelgen.test.js` (32). Flutter: `terrain_parity_test` replays 14 scripted moves (`test/fixtures/terrain_parity.json`) through the real `PlayerComponent` and must match `sim.js`; `level_playthrough_test` loads every level through `LevelLoader` and replays a winning run (`test/fixtures/level_paths.json`, frame by frame) through the real player to the gate; `level_lint_test` was rewritten for the new rules (the old per-gap `jump_clearance_test` is gone, the solver supersedes it). 661 Flutter tests, 32 node tests, `flutter analyze` at the usual 5 lints.
- **Regenerate** after any change to `tools/levelgen`: `node tools/levelgen/generate.js --era all --levels all`, then `node tools/levelgen/paths.js` and `node tools/levelgen/parity.js`, then both test suites (a node test fails if a map on disk is stale). To review without a device: `node tools/levelgen/render.js --level assets/tiles/levels/era1_5.tmx --sheet s2,s3,s5,s7 --out sheet.png`, or draw it through the real game: `flutter test tool/level_screenshots_test.dart --dart-define=SHOT_LEVEL=era2_3 --dart-define=SHOT_X=13000 --dart-define=SHOT_OUT=shot.png` (`tool/trace_run_test.dart` prints a replay's positions when the game and the simulator disagree).
- **Playtest fixes, same day.** Any rise, even one tile, is now a wall that has to be jumped (`wallBand` 12 on the ground; in the air a landing up to `groundBand` 28 low still snaps up); the second-tier platform coins sit out of reach from the lower platform; pit water has no extra tile and no animation; bushes were added and then removed (they added nothing to play).
- **Known limits.** The game keeps positions as 32-bit floats and the simulator as doubles, so a replay drifts by a fraction of a unit; the saved winning runs therefore only use moves that still work if they start up to 8 units either side (`robustRun` in `solve.js`). Not yet seen on a device: the feel of the walls, the climb up the ramps, performance of the terrain draw. The tileset's crates are the `block` piece (a pile, drawn cropped) and ladders, vines, tufts and the foliage tiles are unused. The six boss levels have no map (Phase 5).

---

**Date:** 2026-10-04 (level generator, playtest fixes, settings and controls; uncommitted on `v2-phase-4`)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Phase 4's generator (all 37 non-boss levels, `era1_1` included since it was replaced) plus the fixes from the first
phone playtest of spanish 1-4.

## 2. Current state
**Uncommitted on `v2-phase-4`.** 456/456 Flutter tests, 22/22 node tests, `flutter analyze` at the
usual 5 pre-existing lints. An arm64 APK with spanish 1-4 and all the fixes was built and sent on 2026-10-04; no device feedback yet.
**2026-10-06, menu icons, Profile redesign, Test Mode (in CHRONO-GAMEAPP on branch `era-names-six-era-bow`, committed as `b8b9b74`; an arm64 APK with it was built the same day; not on a phone; mockup https://claude.ai/artifact/R822GZm6StateQeVZD4q9u):**
One icon set and one button for the menu screens. `PixelIcon` (`lib/widgets/pixel_icon.dart`) draws 14 glyphs from 12 x 12 text grids (back, profile, gear, trophy, book, move, speaker, door, coin, shield, chevron, note, speakerLow, speakerOff), tinted by use. `MenuChip` / `MenuChipFace` (`menu_chip.dart`) is the wooden chip: 40 to look at, 48 to hit, presses in. `MenuTopBar` (`menu_top_bar.dart`) is the shared header; `SettingsHeader` now wraps it. Rule: back top left, Settings the right-most chip, Profile just left of it and hidden on Profile. Applied to character select (Profile chip added; the old `_SideIconButton` is gone), era select (also the era-card book is white now: it was bookColor on a bookColor card, so invisible; the bottom bar shows the chosen hero in `CharacterPortrait`), Profile, Settings (rows, logout is a red `GameButton` with the new `leading` param), Sound (rows and slider ends), level select, leaderboard, the module screen and the level-failed BUMALIK button. Not converted: the leaderboard's refresh icon and the content icons in the module screen body. **Profile** is rebuilt (`profile_screen.dart`): parchment identity card with the hero portrait, class code, school and Puntos/Coins; a tile per era with one pip per level and the real level counts (10, 5, 7, 8, 8, 5; the old screen said /10 for all), a star when finished, a lock when out of reach (Grade 6 eras show locked to a Grade 5 student); powerups and the Kodeks below; fits 800x360, 732x320 and 640x360 without scrolling, one column when narrow. It now reads progress from `progressProvider` (as era select does) and loads it on open. **Test Mode**: the switch is now labelled "Test Mode" ("Bukas ang lahat ng panahon at level, at hindi nawawala ang puso."). The remaining temporary switch must still be removed before student builds. 611 Flutter tests.
**2026-10-06, era names, free hearts, QR size (committed in CHRONO-GAMEAPP on branch `era-names-six-era-bow`, `e77b296`, `5acfb49`, `44dd813`, on top of `1580910`; not pushed, not on a phone):**
(1) **Era names** are the six titles of Section 1 and the dashboard (`allEras` name + subtitle, no date ranges; ids, level counts and question ids unchanged); the three character cards use them too. Titles run to 47 characters, so the era cards allow 3 lines for the name and 2 for the subtitle, the level-select header shrinks to fit, and the character badge wraps. (2) **Hearts are free while the unlock-all switch is on**: `GameNotifier.heartsAreFree` (reads `StorageService.getUnlockAll()`) stops `loseHeart`, lets `canStartLevel` pass on an empty pool, and `GameScreen` starts the level on a full in-level bar. The switch and the logout button moved from Profile to Settings. (3) **QR camera** takes the height left on the screen (about 190 dp on a 360-high phone, was 136; cap 300). Question files do not match eras 3-6 yet: there is no `questions_nationalism.json` (placeholders), `american` has nothing on the Katipunan/Revolution, `ww2` lacks the American colonial government, `modern` levels 1 and 5-9 are off-topic, and every file's 22-question boss pool sits at key 10, which only era 1 reads (the boss reads the key of the era's last level). 594 Flutter tests.
**2026-10-06, level-complete card (uncommitted, not on a phone, built from a mockup the user approved, https://claude.ai/artifact/5XcfznAVkssrGqnh9Y3W3z):** the user's
screenshot showed "5/5 TAMA" on a level of ten artifacts, and the card scrolled. Cause of 5/5: `levelComplete()` scored distinct question ids
and every level has only 5 authored questions (the pool serves each twice for 10 artifacts). Now a level with artifacts is scored per artifact
(`correct = artifactsClaimed`, `total = artifactsTotal`), which also feeds stars, the perfect-level +50 and `onLevelComplete`; the POST payload is
unchanged. Cause of the scrolling: the card was 331 dp tall (382 on levels 3 and 7) on 320-360 dp screens. `LevelCompleteScreen` is now two
columns (about 190 dp) from 556 dp wide up, one column below, with a row of one dot per artifact under the score (green right, outline missed;
none above 12 artifacts or with no artifacts). Still open: 5 questions per level means every question is asked twice in a level; 5 more per level
(185 in all) need writing and teacher review. 565 Flutter tests.
**2026-10-06, after the APK of the fifth round (uncommitted, not on a phone):** from the user's first look at it. (1) **Artifacts**
(approved mockup, https://claude.ai/artifact/PGLNv4rcKdfjwgkUDVL6jx): 56 -> 72 (`artifactSize`, `physics.json`, lint; `artifactHoverHeight`
150 -> 158 keeps the middle where it was), the era tint is gone from the sprite (a spent one still goes dull), and a gold halo that
breathes plus seven sparkles is drawn behind it in `ArtifactComponent.render` (shader built once, skipped when inert or over 900 units
from the player, follows the claim fade-out). 13 levels regenerated for the new size. (2) **Hearts** no longer regenerate during a level:
`GameNotifier.enterLevel()/exitLevel()` (called from `GameScreen` initState/dispose) stop the clock and resume it where it was
(`HeartsState.resumedAfterLevel`); a loss in a level does not regenerate first. Not frozen if the app is killed mid-level. (3) **Progress
bar** is now the "mini pill" (112 x 18 dp, 78% opacity, thin gold line, 12 dp hero face, 13 dp gate, no ticks), bottom 9. 557 Flutter tests.
**2026-10-06, fifth playtest round (the user's 12 notes, Filipino; all uncommitted, not on a phone, no APK built since the QR one):**
(1) **QR card adapts**: `QrScanPanel` scales 1x-1.8x with the column and screen height (tablet), text and brackets too.
(2-4) **Login**: the screen they tested was the APK built *before* the 10-05 error fix, so its messages were the old ones. Two real
gaps remained and are fixed: "Babalik" no longer applies the 6-character rule (a short password there is a wrong one; the length
rule is "Bago" only, and `loginErrorMessage` maps a 400 password reply to "Mali ang password" when not joining), and the error
now clears when any field is edited or a QR is scanned, not only on a tab switch. (6) **Tutorial**: the corner control is a round
X (48 px, key unchanged) in place of the small "LAKTAWAN" text. (11, 13) **Module screen** (`background_history_screen.dart`):
back arrow plus the phone's back button go to the era list; the guide bubble says "Ako si" plus the chosen hero (it used `era.guide`, so a
Lapu-Lapu player read "gagabayan ni Rizal"). (12) **Settings > Tunog** (`sound_screen.dart`, route `/settings/sound`): switch and
volume slider for music and for effects, saved in Hive (`sound_enabled`, `music_enabled`, `sound_volume`, `music_volume`),
`AudioService.loadSaved()` at launch, music volume applies live. (7) **Speed 210 -> 250** and a **progress bar** at the bottom
centre (`level_progress_bar.dart`: hero face from start to the gate icon, ticks at the artifacts, polled every 100 ms).
The jump did not change, so reach is 267 (was 224). Everything derived from it was redone: gaps 192-288 (plain 240), fight gaps
352/384/416, fight platform 240 wide, ledge max 112 (rules.js, Dart lint mirror, sync test), `knockbackDistance` 160 -> 180 (the
invincibility arithmetic would otherwise have been 300 vs 306), attack box 64 -> 80 wide (at the new speed the old box left too
little time to hit an enemy; the physics replay in `jump_clearance_test` failed until this and the wider platform). All 13 levels
regenerated; levels are now about 100 s of walking, was 119. (8) **Praise**: after a right answer a cheer plays
(`assets/sounds/praise.wav`, SYNTHESISED by `tools/sfx/make_praise.js`, not a recording and not listened to by me) and a word
("WOW!", "GALING!"...) pops over the hero (`PraiseComponent`). A real voice clip would replace the wav file as is.
(9) **Enemy death**: white flash, then thrown away from the player spinning and shrinking, sparks and a shock ring, about 0.5 s
(`CombatConstants.death*`; the old three durations are gone); coins drop where it stood; a Heavy's first hit now flinches.
(10) **Attack**: the plain yellow rectangle is now a white slash that sweeps down through the swing with a spark and speed lines, and
the hitbox now travels with the hero (`follow`) instead of staying where it spawned. 541 Flutter tests, 22 node tests, same 5
analyzer lints. Not verified on a device: speed feel, fight difficulty at 250, the slash and death look, the praise sound, the
progress bar's room between the joystick and the buttons on a real phone.
**2026-10-05, login error messages (uncommitted, not on a phone):** the user saw wrong messages on the student login. Cause: the server
answers in English and one answer meant two things. "Babalik" with a mistyped username got "Real name is required for first-time join"
(the server treats an unknown username as a new student); "Bago" with a taken username got "Incorrect password". New
`lib/utils/login_errors.dart` (`loginErrorMessage(e, joining:)`, tab-aware, all Filipino, no developer text such as "check the backend and
API URL"); `ApiService.login` uses it, `AuthNotifier` shows only ready messages and has `clearError()`, called when the tab changes.
Backend NOT changed (it could return distinct codes for "unknown username" and "username taken" later). 511 Flutter tests.
**2026-10-05, QR scan on the login (built from a mockup the user approved; uncommitted, not on a phone):** the login
screen's left column now holds a scan card instead of the logo block (small CHRONOQUEST wordmark kept), camera off until tapped.
`lib/utils/join_link.dart` (`parseJoinCode`: `chronoquest://join?code=X` or a bare code, upper-cased, 2-20 of A-Z 0-9 - _),
`lib/widgets/qr_scan_panel.dart` (`QrScanPanel`, `QrScanner`, `showQrScanSheet`, `ScannerViewBuilder` so tests use a fake
camera), `login_screen.dart` (fills Class Code, which stays editable and shows a green mark only while it still holds the scanned
code; under 700 wide there is no card, so a scan button sits in the Class Code field and opens a full-screen scanner). Added
`mobile_scanner` and the CAMERA permission (`uses-feature` not required). Denied camera: message and "Subukan ulit", typing still
works; there is no "open Settings" button (no package for it). The login row is now top-aligned so the card is on the first screen.
497 Flutter tests, same 5 analyzer lints. NOT verified: the Android build with the new plugin, and a real scan. Next: build an
arm64 APK when asked and scan the dashboard's section QR from a phone. Test note: layout tests need
`tester.view.physicalSize` AND `devicePixelRatio = 1`; `setSurfaceSize` alone was ignored here, so earlier size checks that only used it
(e.g. `gate_hud_test`) ran at 800x600 logical.
**Fourth round, same day (user's playtest notes, built after a mockup they approved):** (1) **Extra wide
gate**: `CombatConstants.gateWidth` 48 -> 144 (6 tiles, height unchanged); `GateComponent` draws any
width, records its still parts once as a `Picture` and does nothing while off screen; generator
`exitMargin` 120 (was 60) so the gate fits, and a lint rule that it does. (2) **Platform fights** (the
user noticed the attack button works in the air): a 288/320/352 gap, a 192 platform, a walker on it;
1-3 per level, never in sections 1-2. Game side: `EnemyComponent.surfaceY`, `LoadedLevel.enemyStaysOnSupport`
/ `platformUnder`, `isPlatformUnder`, and the shove now clamps to a platform. Generator: `planFight`, tmx
enemy `y`, validator and Dart lint rules (mirrored). Finding worth keeping: an enemy cannot be jumped
over (146 units needed, a jump gives 105), so every enemy needs a hit or costs a heart. Tests: 456 Flutter,
22 node, same 5 analyzer lints; the shove-on-platform test was checked to fail without its fix. Not on a
phone yet: the user has not tried a fight, so the numbers (patrol 36, platform 192, 0.15 s swing window)
are first guesses. Charges: start 0, 2 per right answer, +1 per 20 s at 0 only; with 10-13 enemies a
level a student can run dry (offered to shorten the 20 s or raise the floor; not decided).
**Third round, same day (user's playtest notes), all uncommitted, not in the sent APK:** (1) every
section of every generated level now has a gap with a platform and an enemy, with a third element in
the middle sections (10-14 gaps, 10-13 enemies per level, was 7-10 and 2-7); new rules: enemy patrol at
least 160 from a gap edge, and a section-coverage check (JS validator, Dart lint, 17 node tests). The
12 generated levels were regenerated. (2) The gate unlock indicator uses a new `GateIcon`
(`lib/widgets/gate_icon.dart`, a gatehouse with an open padlock, drawn in code) on the artifact pill,
the gate distance chip and its message. (3) Frame drops in the last sections of a level, on two phones:
not reproduced. Dart-side cost per frame is flat along the level (about 0.5 ms in a debug test), so
it is not level content. Found and fixed a real leak: `AudioService` played every effect with
`FlameAudio.play`, which builds a new `AudioPlayer` per jump or coin and never disposes it; it now
reuses a pool of 3 players per sound (`AudioPool`, preloaded in `ChronoGame.onLoad`). Unconfirmed on a
device. If it still drops, ask whether it is gradual or at one spot, and profile on the phone; also
note Poppins is fetched from the network at runtime (bundling it is still unmade).
**Later the same day:** pre-colonial 2-9 (`era1_2..era1_9.tmx`) were generated (all 50/50 valid, no
Heavy since that era has no Heavy art), so 12 levels are generated. They are NOT in the sent APK.
`era1_1` was checked: it passed the physics rules but was a 3,200-unit prototype (about 15 s of
walking) with all 10 artifacts in 3,000 units and enemies on top of artifacts. **The user approved
replacing it, and it is now a generated full-length opener** (`--era pre-colonial --levels 1 --force`),
so 13 levels are generated (pre-colonial 1-9, spanish 1-4) and no hand-built map remains. The old map
is kept as `test/fixtures/hand_built_level.tmx`, which the loader, respawn, level-end and lint tests
read as a "map a person made". The `(1, 1)` hand entry was dropped from `LevelLoader.authored`; the
level 1 integration test now reads its numbers from the loaded level instead of pinning the old ones.

- **Generator:** `CHRONO-GAMEAPP/tools/levelgen/` (stdlib Node). `node tools/levelgen/generate.js
  --era spanish --levels 1-4` writes `assets/tiles/levels/era2_N.tmx` and rewrites
  `lib/game/generated_level_manifest.dart`. Only spanish 1-4 are generated so far; the other 32
  wait on a playtest of these. Tests: `node --test tools/levelgen/test/levelgen.test.js`,
  `level_lint_test.dart`, `levelgen_sync_test.dart` (pins `physics.json`/`eras.json` to the game).
  `jump_clearance_test.dart` replays the game's jump and landing rules against every level.
- **Platforms 104-112 above ground, gaps 176-240** (platformless 208 at most), `era1_1` updated
  to match. 112 is the verified ceiling (peak - 15 = 113); 104 clears an enemy's hit area (99.9).
  The jump is unchanged.
- **Respawn:** returns 300 units back along the same ground, anchored only when the whole foot
  span is over ground (never a platform). The old respawn sat on the lip and drained all hearts.
- **Stalls:** `ChronoGame.updateTree` caps a frame at 0.1s and steps in 1/60s pieces. A stall
  (internet dropping) used to run as one step and drop the player through the floor.
- **Settings > Kontrol:** joystick or left/right arrows, saved on the device
  (`controlSchemeProvider`, `GameInput.setScheme`). Gear on character select, era select and the
  pause menu. Screens in `lib/screens/settings/`. Pause is laid out compactly (Ituloy, then
  Settings and Umalis side by side) because a third stacked button would fill a 360-tall screen.
- **Hearts:** one `HeartsPill`, top right, on character select and level select only; removed from
  era select and profile. The in-level bar is untouched (user is satisfied with it).
- **Knockback:** 160 units over 0.3s with controls locked, stopped at a ledge. With 1.5s of
  invincibility that makes walking back through an enemy impossible (arithmetic pinned in
  `contact_damage_test.dart`).
- **Gate:** drawn in code (stone gatehouse, barred door, padlock and lamp that change when
  unlocked). **Gate HUD** (`gate_hud.dart`): once every artifact is answered, a chip with the
  distance in metres (100 units = 1 m) and a one-time message.

## 3. Decisions made (and why)
- The first fall in the playtest was unexplained; the 3-heart loop and the stall bug were found
  and fixed, but not confirmed on a device. The freeze at 0 hearts is probably the paused engine
  showing a frozen frame while the app moves to the level-failed screen (not reproduced).
- Platform immunity was dropped in favour of higher platforms (user's call).

## 4. Things we tried that did NOT work
- A first jump simulation counted landing back on the near ledge as clearing the gap. Fixed to
  count only the far side, with two negative controls that must fail.

## 5. Next steps (in order)
1. **Device test** of spanish 1-4 with that APK: gaps, platforms, knockback, gate, controls. Ask the user: does the first fall on solid ground still happen, and where? Open question: gear on era select as well as character select (built both). The plan file C:UsersPC.claudeplansstateful-shimmying-flask.md predates the platform/gap change (it still says 90-110 and 128-200).
2. Tune from the notes, then generate the other 24 levels (nationalism 6, american 7, ww2 7, modern 4;
   spanish 1-4 and pre-colonial 1-9 are done).
3. Remove the temporary unlock-all switch before students get a build; question bank is ~5 per
   level; bosses are Phase 5.

## 6. Constraints & conventions
- Hold fixes uncommitted until confirmed on a device; build APKs only on request, arm64-v8a.

---

**Date:** 2026-10-04 (gate asks nothing, 10 artifacts, softlock fix; uncommitted on `v2-phase-4`)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Two reports from the latest APK: the end gate still opened a question, and levels had 5
artifacts, not 10.

## 2. Current state
**Uncommitted on `v2-phase-4`.** 325/325 tests pass (~1 min), `flutter analyze` clean at the
usual 5 pre-existing lints. **Not yet on a device.** The APK last sent predates all of this.

- **Gate:** no question. `PlayerComponent.update` calls `game.passEndGate(gate)` when
  `requirementMet`, which opens it and completes the level after 350ms. `showGateQuestion`,
  `GateComponent.questionPending/lastQuestion`, `activeGate`, `gatesTotal/gatesCleared` and
  `AnswerPointKind` are gone. `GateComponent.isLevelExit` stays.
- **10 artifacts:** `artifactsPerLevel` 5 -> 10, `gatesPerLevel` 3 -> 1. `era1_1.tmx` has 10
  artifacts (five added at x=440, 800, 1450, 2250, 2700; the one at 1860 moved to 1800 because
  it floated 4px into gap 2).
- **Procedural levels (the other 42):** one end gate after ten artifacts, `isLevelExit: true`.
- **Tutorial text** no longer says a gate asks a question.
- **Testing switch (temporary):** Profile has "Buksan lahat ng panahon at level", persisted in
  Hive under `dev_unlock_all` (`unlock_all_provider.dart`). On, era selection shows all six
  eras and none are locked, and every level (boss included) is open. It only changes what is
  shown as unlocked; it awards nothing and sends nothing. Logout clears it (`clearAll`).
  **Remove it, or hide it behind a debug flag, before students get a build.**
- **Era selection layout** (found by the user after turning the switch on): the shelf was a
  Wrap of fixed 220x200 cards. A landscape phone has only ~230px between the title and the
  student bar, so six cards wrapped into two 200px rows and the second row (American, WW2,
  Modern) sat behind the bar, where children outside their parent are not hit-testable: those
  three eras could not be tapped. The normal three-era view also wrapped at 640px wide.
  `_buildShelf` now sizes at most three cards across from the space actually available and
  switches to a compact card (icon beside text) below 150px tall. `era_selection_layout_test.dart`
  checks every era is on screen and hit-testable at four phone sizes, with the switch on and off.

## 3. Decisions made (and why)
- **The softlock was mine.** On 2026-10-03 I made every gate require every artifact answered
  but only rebuilt `era1_1`'s layout. The 42 procedural levels still had three gates, the first
  at 1/4 of the level with one artifact behind it: stopped, told to find artifacts they could not
  reach. One gate after all artifacts makes that impossible by construction, and
  `answer_point_test.dart` asserts every artifact precedes the only gate.
- **10 artifacts with ~5 written questions means repeats.** Accepted by the user until the
  question bank is written; the pool recycles real questions.
- **`ArtifactComponent.counted`** is its own flag. Counting off `attempted` double-counted an
  artifact when a Shield absorbed a wrong answer, because a Shield never sets `attempted`.
- **`ChronoGame.levelEnded`** stops a level completing or failing twice (gate and exit marker
  can both fire it).

## 4. Things we tried that did NOT work
- The new "no artifact over a gap" test failed on the first run, on an artifact I had not
  touched, so it caught a real 4px overhang. Fixed in the level, not by loosening the test.

## 5. Next steps (in order)
1. **Device test.** Does 10 artifacts per level feel right, and with only 5 written questions
   do the repeats read as a bug? Is combat too easy with ~20 charges per level?
2. Wire the buy-a-heart purchase (Phase 6 in GAMEPLAY-V2.md).
3. The level generator must emit one end gate and ten artifacts.
4. Question bank: 10-15 per level, and `nationalism` still has no file.

## 6. Constraints & conventions
- Run the full `flutter test` (about a minute). Hold fixes uncommitted until confirmed on a
  device; build APKs only on request, arm64-v8a.

---

**Date:** 2026-10-03 (playtest round 2 — menu hearts, contact damage, end gate, transitions; uncommitted on `v2-phase-4`)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Four problems from the second on-device playtest of the day: no hearts on the menus, enemy
contact damage behaving erratically, gates wanted at the level end, and the screen freezing
on exit.

## 2. Current state
**Uncommitted on `v2-phase-4`.** 314/314 tests pass (~1 min), `flutter analyze` clean at the
usual 5 pre-existing lints. **Not yet on a device** — no APK built since these changes.

- **Menu hearts:** new `lib/widgets/hearts_pill.dart`, placed on character selection (top
  right, left of the book icon), era selection (bottom bar), and profile (under the stat
  boxes). One heart icon, a count like 3/5, a countdown when short, and a plus button that
  opens a buy-a-heart dialog (20 coins, `GameConstants.heartPriceCoins`). Owns a 1s ticker
  calling `refreshHearts()`. **The BILHIN (buy) button is disabled on purpose**: there is no
  local coin balance to spend, only the server's `Student.coins`. The dialog says "Hindi pa
  magagamit". Wiring it is a Phase 6 item in GAMEPLAY-V2.md.
- **Contact damage:** enemy contact moved from `onCollisionStart` to `onCollision`, and the
  i-frame window became a wall-clock `DateTime` deadline. `invincibilityDuration` 1.0 -> 1.5.
  Enemy hitbox is now `RectangleHitbox.relative(Vector2(0.55, 0.85))` instead of the full
  sprite box.
- **End gate:** `ChronoGame.artifactsAnswered` / `canPassEndGate` / `artifactsRemaining`;
  `GateComponent.isLevelExit` + `requirementMet`; new `GateLockedOverlayWidget`. `era1_1.tmx`
  now has one gate at x=3100 (the exit is 3140) instead of two mid-level gates. The HUD pill
  dropped the gate counter and now counts artifacts **answered**, with a lock-open icon when
  the gate is passable.
- **Transitions:** `_quitToLevelSelect` now calls `resumeEngine()` before navigating, and
  `dispose()` schedules `stopBgm()` off the frame instead of firing it inline.

## 3. Decisions made (and why)
- **The end gate opens on artifacts *answered*, not *answered correctly*** — the user's call,
  and the reasoning is the important part: requiring correct answers would push every student
  to 100%, leaving the teacher dashboard with no error rates, no weak-topic signal and no
  learning gain. Wrong answers still show the explanation and still reach the dashboard as
  wrong. `end_gate_test.dart` pins this so it is not "simplified" later.
- **Damage is continuous, not start-only.** The playtest reports ("standing inside an enemy is
  safe", "it only hurts when facing me") were both the same cause: `onCollisionStart` fires
  once per *new* overlap, so what varied was whether the player had separated first, not
  anything on screen. The enemy hitbox is the same box in both directions — only the sprite
  mirrors.
- **I-frames run on wall-clock time.** `pauseEngine()` stops `update()`, so a `dt` countdown
  froze for the entire time a question was open: answer for 20s, return still invincible.
  That was the "sometimes immune after answering" report. Real time cannot be banked.
- **The HUD pill counts answered, not claimed.** With the gate keyed to answers, a
  claimed-only counter would have told students they had work left when the gate was already
  open.

## 4. Things we tried that did NOT work
- **`_advancePastInvincibility` spinning frames.** Once i-frames became wall-clock, pumping
  100 frames instantly no longer expires them — the helper had to await real time. The three
  failures this caused are the proof the fix works, not a regression.
- **Asserting "no slash in the pill" to test the hidden state.** The health bar renders "4/5",
  so that matched. The test now looks for the pill's artifact icon instead.

## 5. Next steps (in order)
1. **Device test.** Nothing here has been played. Especially: does 1.5s i-frame feel right,
   and is the locked-gate notice clear enough that a student goes back for the artifact?
2. **Known risk:** with the gate as the exit, a student who cannot find their last artifact
   has no way out of the level. The HUD counter plus the notice is the agreed mitigation; a
   directional indicator is the fallback if device testing says it is not enough.
3. The other 42 levels still have no `.tmx`, so they keep the procedural path with its three
   mid-level gates and distance-based ending. The generator must emit the new one-gate shape.
4. `GAMEPLAY-V2.md` Section 6 still describes 3 gates per level as the educational floor.

## 6. Constraints & conventions
- Run the full `flutter test` (about a minute).
- Widget tests that read `gameProvider` must override it, or they hang on Hive.
- Hold playtest fixes uncommitted until confirmed on a device; build APKs only on request,
  arm64-v8a.

---

**Date:** 2026-10-03 (Phase 4 playtest round — Kaalaman rework, HUD, enemy ledges, test hang; uncommitted on `v2-phase-4`)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Act on on-device feedback after Phase 4's first half: misses burned Kaalaman and the cap of 6
felt wrong, the HUD showed no question progress, enemies floated over gaps, and a full
`flutter test` hung.

## 2. Current state
**Uncommitted on `v2-phase-4`** (`CHRONO-GAMEAPP` submodule, plus this file and `GAMEPLAY-V2.md`).
304/304 tests pass in about a minute with a plain `flutter test`; `flutter analyze` clean at the
usual 5 pre-existing lints. An arm64-v8a APK was sent for playtest **before the enemy ledge
fix**, so the build on the phone does not have it.

- **Kaalaman:** `attack()` needs a charge (`canAttack`) but `AttackHitboxComponent` spends it on
  the first enemy hit, once per swing. `grantCharges` no longer clamps; `kaalamanCap` became
  `kaalamanDisplayMax = 10`, for the HUD only. `updateKaalamanRegen` gives one charge back after
  20 s at 0 and stops at a floor of 1; it is paused during questions and the boss phase.
- **HUD:** new `lib/game/overlays/hud_widgets.dart` (health bar over a thinner Kaalaman bar,
  gate/artifact pill, shared score/coin panel). Level badge removed. `ChronoGame` tracks
  `gatesTotal/gatesCleared/artifactsTotal/artifactsClaimed`, totals set from the Tiled
  entities or the procedural constants.
- **Enemies:** `isGroundUnder` and a public `footSpanFraction` in `game_collision.dart`; walkers
  turn at a ledge in `EnemyComponent.update`. `LoadedLevel.enemyStaysOnGround` plus a builder
  warning. `era1_1` enemy 6 moved from x=900 (it sat inside gap 1) to x=600.
- **Tutorial screen:** rebuilt for landscape phones. The old vertical card overflowed below
  about 400px tall (title and body hidden), so each page is now two columns (illustration beside
  text) with a scroll fallback and a single bottom row for the dots and button. Steps moved to
  `tutorial_content.dart` and rewritten for joystick/JUMP/ATK, artifacts and gates with the HUD
  counters, Kaalaman (with a bar illustration) and the health bar: 8 pages, Filipino copy that
  still needs the user's review. `GameBackdrop` now paints its scrim behind the content; it used
  to be a `foregroundDecoration` that dimmed the whole screen by 65%. Only the tutorial passes an
  `imagePath`, so no other screen changed.
- **Tutorial wording bug found while writing the SRS:** page 5 first said a correct answer
  always gives Kaalaman and opens the gate. Only artifacts grant Kaalaman (`answer_point_handler.dart`
  calls `grantCharges` for artifacts only); a gate just opens. Fixed in the source after the
  APK built at 18:46 on 2026-10-03, so **that APK still has the wrong sentence**.
- **Tests:** new `hud_overlay_test`, `enemy_ledge_test`, `tutorial_layout_test` (every page at
  five sizes, no overflow, scrim behind the card); additions to the Kaalaman, attack, loader and
  integration tests. `test/screens/tutorial_screen_test.dart` fixed (it now taps to the last page
  instead of hard-coding the page count) and `test/flutter_test_config.dart` added.

## 3. Decisions made (and why)
- **Spend on hit, plus a regen floor of 1, not a kill recharge.** A Walker has 1 HP and a hit
  costs 1 charge, so refunding 1 on a kill makes Walker fights free forever.
- **No cap.** Content already bounds supply at 10 per level; a cap only clamped the students
  who answered the most. The bar is a fixed 10 segments, so levels 1-2 (11 charges) show 10.
- **The pill counts answer points, not the 10-question target.** `questionsPerLevel = 10` is a
  draw target; retries and the 5-question pool mean a student does not answer exactly 10.
- **Walkers turn back at a ledge rather than stopping,** and the check is skipped when already
  unsupported (otherwise bad data makes them flip every frame). No registered ground means
  unconstrained, so bare-game tests keep their old patrol behaviour.
- **A guest/skip-login toggle was analysed and dropped.** `DevFlags.skipAuth` already exists but
  is debug-only, so it does not work in the release APKs sent for testing.

## 4. Things we tried that did NOT work
- **`dart_test.yaml` `timeout:` and `flutter test --timeout`** do not shorten a widget test:
  `testWidgets` sets its own 10-minute timeout. Only a custom binding in
  `test/flutter_test_config.dart` (60 s) makes a hang fail fast.
- **The `test/screens/` hang was not google_fonts.** `GameNotifier`'s constructor fires a Hive
  write (`saveHeartsState`); inside a widget test's fake-time zone it never completes and holds
  Hive's lock, so the next Hive call and `Hive.close()` wait forever. Any widget test that reads
  `gameProvider` must override it (`_QuietGameNotifier` in the tutorial test).
- **`game.ready()` can return before an enemy's sprites load** under parallel load, leaving it
  at x=0 with no size. The ledge test failed about half the time in a full run until it awaited
  `enemy.loaded`.

## 5. Next steps (in order)
1. **Build a new APK and play it.** Check the HUD spacing and readability, whether 20 s regen
   feels right, that misses are free, and that enemies turn at the lip of the first gap. Then
   commit in `CHRONO-GAMEAPP` and bump it in the parent.
2. **Review the new tutorial on the device**, including the Filipino wording. The screenshots
   were taken with Segoe UI standing in for Poppins, which is about 10% wider, so check the
   longest pages (artifacts and gates, Kaalaman) for tight wrapping. Hearts regenerate 1 per
   minute (`GameConstants.heartRegenInterval`, GAMEPLAY-V2 §8), so "isang minuto" is correct.
3. **The generator** (Phase 4 second half). It must keep every enemy's patrol inside one ground
   span (`LoadedLevel.enemyStaysOnGround`) and append to `LevelLoader.authored`.
4. The doc comment on `ChronoGame.kaalaman` still says charges come from a debug key.
5. Content: still 5 questions per level.

## 6. Constraints & conventions
- **Run the full `flutter test`** (about a minute). This replaces the older entries below that
  say to keep it scoped because `test/screens/` hangs.
- Widget tests that read `gameProvider` must override it, or they hang on Hive.
- Hold playtest fixes uncommitted until confirmed on a device; build APKs only on request,
  arm64-v8a.

---

**Date:** 2026-10-01 (Phase 4 first half — Tiled loader; uncommitted on `v2-phase-4`)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
The first half of Phase 4 per Section 15: add `flame_tiled`, set `ground_tileset.png` up as a
Tiled tileset, write the loader for the `entities` object layer (Section 11), end the level on
the `exit` object, re-point one-way platforms at Tiled platform objects, stop culling content
behind a backtracking player, add gap respawn anchors, and carry the Section 1 curriculum
block. Build it against **one hand-made reference level** (`era1_1.tmx`). The 43-level
generator is the second half and is **not** in this entry.

## 2. Current state

**Uncommitted on `v2-phase-4`** (both repos branched from `v2-phase-1` at `43cc237` /
`fea4fc2`). 258/258 tests pass (52 new), `flutter analyze` clean at the usual 5 pre-existing
lints.

**New:**
- `assets/tiles/ground_tileset.tsx` — the one-time Tiled wrapper around the existing 112×128
  sheet (7×8 of 16px tiles). Section 11's caveat 1 said this supersedes the hand-coded
  `(row, col)` constants; those still work and are untouched.
- `assets/tiles/levels/era1_1.tmx` — the hand-built reference level. 200×45 tiles (720px tall,
  so map y *is* world y and the loader needs no vertical remapping). Two real gaps, a platform
  over each, 4 enemies, 5 artifacts, 2 gates, 8 coins, spawn and exit.
- `lib/game/level_loader.dart` — `LevelLoader` (parse) + `LevelBuilder` (instantiate), split so
  the schema is testable without a game loop. Also `LoadedLevel.isOverGround()`, which the
  generator will reuse to prove a level has no unclearable hole.
- `lib/game/level_culling.dart` — documents why culling is now "almost never", and keeps one
  deliberately enormous margin for future transient effects.
- 5 new test files: loader schema, culling, gap respawn, level end, and a real-game integration
  test.

**Changed:** `game_spawning.dart` (async; Tiled path with procedural fallback),
`chrono_game.dart` (`tiledLevel`, `levelEndX`, nullable spawners), `player_component.dart`
(`respawnAnchorX`, `respawn()` now returns to it), `enemy_component.dart` (optional `worldX` +
`patrolRangeOverride`), `constants.dart` (`eraNumberFor`). Cull checks removed from
`artifact`/`coin`/`enemy`/`tile_platform`/`gap` components.

**One-way platforms needed no collision change at all.** `TilePlatformComponent` already
registers into `game.platforms` in `onMount`, and `game_collision.dart` already iterates that
list with the `velocityY >= 0` gate — so Tiled-built platforms are one-way for free. Section
11 flagged this as "the single most likely place for platforming to silently break", so there
is an explicit test that a Tiled platform lands in `game.platforms`.

## 3. Decisions made (and why)
- **`LevelLoader.authored` is an explicit manifest, not a bundle probe.** Probing meant a
  `rootBundle.loadString` that throws for each of the 42 unauthored levels, and made "does this
  level exist" an async round-trip that widget tests cannot settle with `pump()`. The generator
  appends to this set as it writes files.
- **The curriculum block lives in Tiled map properties, not a side JSON.** Section 11 allowed
  either; map properties travel with the level, so a level can't be copied to a new file and
  silently lose the tag that makes it reportable. `weeks` is a comma-separated string because
  Tiled has no list property type. The era registry remains the fallback.
- **`GroundSpawner` is kept, not deleted.** The task said to retire it once the new path was
  proven, but it is still the *only* thing laying ground for the 42 levels with no `.tmx`;
  deleting it now ships 42 floorless levels. Its genuinely dead `update()` is gone and its doc
  comment now says it is being retired and what has to happen first.
- **A malformed or missing map falls back to the spawner rather than throwing.** A student
  mid-lesson should not get a black screen because a level file is bad.
- **Era 1's reference level has no Heavy enemy.** Era 1's two sprites (`tribal_warrior`,
  `dark_spirit`) are *both* Walkers — Section 1's art mapping gives era 1 no Heavy. Variety
  comes from a shorter patrol leash instead. A test pins that the level only names sprites era
  1 has art for.

## 4. Things we tried that did NOT work
- **Hand-writing the ground layer CSV.** It came out 8834 values against a declared 9000 and
  every reference-level test died inside `Gid.generate` with a `RangeError`. Regenerated from a
  small script that asserts `width*height` before writing. **Author the tile layer with a tool
  or a script, never by hand.**
- **Making `setupSpawning()` async broke every bare-game test** with
  `LateInitializationError: Field 'spawner'`. `update()` now runs before setup finishes, which
  `late` cannot express. Fixed by making both spawners nullable — null genuinely means "not
  spawning yet", which is the real state.
- **Mounting a fresh `GameWidget` per assertion is flaky here.** The first two mounts loaded the
  `.tmx` inside the pump budget and every later one did not, leaving `tiledLevel` null so the
  assertions silently read the procedural fallback. Each test passed alone and failed in
  sequence. Fixed by mounting **once** and asserting the whole built level, not by lengthening
  the timeout.
- **`GroundSection`'s cull was the dangerous one.** Pre-Phase-4 the only section was a single
  million-unit slab whose right edge was never behind the camera, so the check could not fire
  and the bug stayed invisible. Tiled lays one section per span — tens of units wide — so the
  same check would have deleted the floor behind a backtracking player, dropping them through
  ground still drawn in the tile layer.

## 5. Next steps (in order)
1. **Play `era1_1` on a device.** Nothing here has been seen on a screen: the gaps, the jump
   over them, and whether the two platform heights feel right are exactly what tests can't
   judge. This is the acceptance step for the first half.
2. **The generator** — second half of Phase 4: emit first-draft `.tmx` for all 43 levels
   against this now-real schema, then append each to `LevelLoader.authored`.
3. **Delete `GroundSpawner`, `EnemySpawner` and the `_setupProceduralLevel` fallback** once
   every level has a map. They are dead the moment the manifest is complete.
4. **Content:** still 5 questions per level (10-15 wanted), and `nationalism` has no file.

## 6. Constraints & conventions
- Gravity 900, jump force -480, platform heights 90-110 above the ground surface. The reference
  level's platforms sit at exactly +90 and +110 and a test asserts it.
- A 720px-tall map keeps map y identical to world y. Changing map height means teaching the
  loader to remap.
- Nothing in an authored level is culled behind the camera. If a future transient effect needs
  culling, use `LevelCulling.isFarBehindCamera`, never a bare camera-edge check.
- `LevelLoader.authored` must list every level that has a `.tmx`, and `assets/tiles/levels/`
  must stay declared in `pubspec.yaml` — a map on disk but not in the bundle passes tests
  (filesystem) and fails on device (asset bundle).

---

**Date:** 2026-09-30 (Phase 3 — artifacts, gates, Codex; committed, awaiting playtest)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement Phase 3 per Section 15: artifacts as answer points, gates from the era wall art,
the reworked question flow, `QuestionBank` as a pool, the Codex on the Profile tab, and
removal of Phase 2's debug charge key. This is the phase the design doc calls "the new game".

## 2. Current state

**Committed `43cc237` on `v2-phase-1`** (root `e247209` + the bump alongside this entry).
206/206 tests pass (14 new), `flutter analyze` clean at the usual 5 pre-existing lints.

**New:**
- `lib/data/question_pool.dart` — per-attempt question supply. Serves one unused question at
  a time, guarantees a retry differs from the question just missed (honoured even when that
  forces a recycle), and counts recycles so a content-starved level is visible. Instance
  state, not statics, so two levels in one session can't share a served-set.
- `lib/game/components/artifact_component.dart` — floats, bobs, era-tinted via
  `decorator.replaceLast` (never `decorator =`, which discards the transform decorator).
  `goInert()` / `_relight()` / `claim()`, with the reward dropping permanently after a miss.
- `lib/game/components/gate_component.dart` — full-height blocker, `open()` crumbles it.
  Deliberately never culled behind the camera: a gate that respawned closed would re-block a
  corridor the player already earned passage through.
- `lib/game/answer_point_handler.dart` — the artifact/gate question flow, kept out of
  `quiz_handler.dart` so the boss path bound by Section 12's frozen payload stays untouched.
- `lib/models/codex_entry.dart`, `lib/screens/profile/codex_screen.dart` — the Codex.
- `lib/game/era_asset_keys.dart` — the era→asset-name mapping extracted from `WallComponent`
  before deleting it, so gates and any future user can't drift from it.

**Changed:** `chrono_game.dart` (pool, active answer point, best-attempt scoring),
`player_component.dart` (artifact/gate collision, gate clamp in `update()`),
`game_spawning.dart` (lays out gates and artifacts up front), `storage_service.dart`
(`codex_<eraId>`), `game_screen.dart` (routes the overlay by answer-point kind, tutorial
freebie), `profile_screen.dart` (Codex card). **Deleted:** `wall_component.dart`.

**Verified in a browser, not just by tests:** walking into an artifact opens a real question
with the timer and power-ups intact, and level 1 starts with exactly one freebie charge —
confirming the debug key is gone and `kaalamanStart` is back to 0.

## 3. Decisions made (and why)
- **Scoring takes the best attempt per distinct question.** Agreed with the user in-session.
  Section 6 adds retries, Section 12 requires logging every attempt; together they made a
  student who answers everything right on the second try score 50% and one star. `answers`
  and the POST payload are byte-identical — only two derived numbers changed, both pinned by
  tests. This is a documented deviation from "keep the star calculation exactly as it is".
- **Gates replace `WallComponent` rather than coexisting.** A hazard that damages you and a
  gate that stops you are different objects; two things made of one sprite with opposite
  rules would have been a trap for the next reader.
- **Artifacts and gates are laid out at level start, not spawned on a distance timer.**
  Section 6 asks for exact counts ("3 gates in every level"), which a rolling timer can't
  guarantee — the level would end mid-interval having placed some other number.
- **The first answer point is always an artifact.** Charges come only from artifacts, so
  meeting a gate first would be a dead start. Asserted in a test, not just arranged.
- **Recycle real questions instead of padding with placeholders.** The old bank appended
  generated "Dagdag na tanong" filler; showing students obviously-fake questions is worse
  than repeating real ones, and `recycleCount` makes the shortfall measurable.

## 4. Things we tried that did NOT work
- **First `QuestionPool.draw()` let the excluded question through.** The exclusion was applied
  after the recycle branch, so when the only unserved question *was* the one being replaced,
  the `length > 1` guard passed it. Caught by the "exclusion holds even when it forces a
  recycle" test, which is exactly why that case was written. Fixed by filtering unserved and
  excluded together, recycling, then re-filtering.

## 5. Next steps (in order)
1. **Play a full level start to finish** — Section 15's own "then you" step for this phase.
   Judge whether the loop is fun, not just whether it works.
2. **Artifacts render small and dim** next to the coins; the per-era tint is tuned for washing
   a whole background, not a 56px sprite. Likely wants a size and tint bump.
3. **Content:** each non-boss level needs 10-15 authored questions to stop recycling; it has
   5, and `nationalism` has no question file at all. Code-side this is already handled.
4. **Phase 4 — Tiled levels**, which retires the procedural spawner entirely.

## 6. Constraints & conventions
- `answers` / `QuestionSnapshot` / the POST payload are Section 12's frozen contract. Scoring
  may derive different numbers from them; it must not filter or reshape the array.
- `QuestionPool` is per-attempt instance state. Do not make it static — levels would share a
  served-set.
- Tint sprites with `decorator.replaceLast(...)`, never `decorator = ...`, which discards the
  `Transform2DDecorator` and renders the component at the origin at the wrong size.
- Gates must never be culled behind the camera.
- Always send arm64-v8a APKs, and **only build one when explicitly asked.**

---

**Date:** 2026-09-30 (Phase 2 — combat and Kaalaman; committed `7bb909e`)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement Phase 2 of `GAMEPLAY-V2.md` per Section 15's prompt: attack hitbox with charge cost
and cooldown, the Kaalaman charge system with HUD orbs, Walker/Heavy enemy behaviours, enemy
HP, the Flame effect-sequence death animation with coin drops, contact damage with knockback
and invincibility frames, enemies no longer opening the quiz, and a distance-based level-end
rule to replace "all enemies dead". Chaser behaviour and the boss rework are explicitly out of
scope (Phase 3+).

## 2. Current state

**All uncommitted on `v2-phase-1`**, held for the user's on-device playtest per this repo's
standing workflow. 172/172 tests pass (40 new), `flutter analyze` clean at the same 5
pre-existing info lints.

**New files:**
- `lib/core/combat_constants.dart` — every Phase 2 tuning number in one place, as the phase
  prompt requires ("so they can be adjusted without hunting"). Charge cost/cap/start, attack
  hitbox size/duration/cooldown, patrol range/speed, Walker/Heavy HP, knockback force and
  duration, i-frame duration and flash interval, death-sequence sub-timings, coin-drop range,
  level `lengthUnits` default, and the debug key binding. Each carries a comment saying
  whether the value came from the design doc or is a guess to be playtested.
- `lib/game/enemy_behavior.dart` — `EnemyBehavior` enum + `enemyTypeTable`, a direct
  transcription of Section 5's table (7 Walkers, 3 Heavies across the 10 sprites), looked up
  by the same sprite-name string `_getEnemyTypeForEra()` already picks.
- `lib/game/components/attack_hitbox_component.dart` — the transient swing hitbox. Added to
  `world` rather than the player so it isn't subject to the player's render-flip transform;
  tracks a `Set` of already-hit enemies so one swing lands at most one hit per enemy even
  across several collision frames (which would otherwise two-shot a Heavy in a single swing).
- `lib/game/kaalaman_handler.dart` — `trySpendCharge()`/`debugGrantCharges()` as an extension
  on `ChronoGame`, matching the existing quiz_handler/game_spawning split.

**Modified:**
- `lib/game/components/enemy_component.dart` — dropped the `Question` constructor param and
  the `?` quiz indicator; added behaviour/HP resolution in `onLoad()`, Walker patrol movement,
  `takeHit()`/`_die()`/`_dropCoins()`, and a `render()` override that mirrors the sprite by
  patrol direction. Also `enemyTypeOverride` (`@visibleForTesting`) — every era mixes one
  Walker and one Heavy sprite and the pick is random, so `eraId` alone can't select a
  behaviour deterministically in a test.
- `lib/game/components/player_component.dart` — `attack()` (cooldown + charge gate + hitbox
  spawn); the enemy branch of `onCollisionStart` now deals contact damage instead of opening
  the quiz; new i-frame/knockback/flash state machine; `render()` skips drawing mid-flash.
- `lib/game/chrono_game.dart` — `kaalaman` field, `currentLevelData` getter, `onPlayerAttack()`,
  `KeyboardEvents` mixin + `onKeyEvent` for the debug grant, and `checkLevelEnd()` rewritten to
  the distance rule. Removed the now-unreachable `currentEnemy` field.
- `lib/game/quiz_handler.dart` — deleted `showQuestion()` outright (its only caller was the
  enemy-collision branch) and the three dead `currentEnemy?.defeat()` calls. Boss flow
  untouched.
- `lib/game/components/enemy_spawner.dart` — dropped the questions roster and the
  `spawnedCount`/`totalEnemies`/`allEnemiesSpawned` bookkeeping; enemies now spawn periodically
  off distance travelled, uncapped, the same rhythm coins and platforms already used.
- `lib/models/level.dart` + `lib/core/constants.dart` — `Level.lengthUnits`, defaulted from
  `CombatConstants.lengthUnitsDefault` at the single `EraData.levels` construction site.
- `lib/game/game_input.dart` — Attack button wired to `game.onPlayerAttack()`.
- `lib/game/overlays/hud_overlay.dart` — Kaalaman orb row, stacked under the hearts.
- `lib/game/game_spawning.dart` — `EnemySpawner` no longer takes questions; boss levels still
  split off their fight-phase questions, and the warm-up slice is now discarded.

**Verified in a real browser, not just by tests** (CDP-driven, screenshots at each step):
orbs render empty at level start and fill on the debug key; each attack spends exactly one
charge and the hitbox is visible in front of the player; an enemy died and left 2 coins in its
place; walking into an enemy cost exactly one heart; and the enemy sprite genuinely mirrors on
the return leg of its patrol. No new console errors — only the pre-existing
`questions_nationalism.json` 404.

## 3. Decisions made (and why)
- **Enemies spawn uncapped off distance rather than from a fixed roster.** Once contact stops
  opening a quiz, an enemy carries no per-instance data, so a count would have been new state
  nothing reads. Dropping the roster deleted dead bookkeeping instead of replacing it.
- **`lengthUnits` is a flat 4000 placeholder on `Level`, not a per-level authored value or a
  difficulty formula.** Levels are still fully procedural, so there is no real content to
  measure against; Section 14 says this value is explicitly temporary and Phase 4's Tiled
  `exit` object replaces it. Putting the field on `Level` costs nothing and gives Phase 3/4 an
  obvious override point.
- **Contact damage is decided only on the player's side.** `WallComponent`/`CoinComponent`
  collisions already live in `PlayerComponent.onCollisionStart`; a second handler on the enemy
  would double-process the same collision pair.
- **Invincibility and the hurt animation are tracked separately.** They are different
  durations (1.0s vs 0.6s) on different axes — one gates damage and drives a render-level
  flash, the other picks which animation plays. Both fire from one `_takeContactDamage()`
  helper that early-returns while invincible, which is what stops a wall landing a second hit
  inside an enemy's window (and vice versa).
- **The slash arc and the Kaalaman orbs are plain shapes, not art.** No such assets exist in
  the project; referencing a missing sprite would throw at runtime. Same "plumbing now, real
  asset later" split Phase 0 used for audio and Phase 1 used for the joystick.
- **The enemy sprite flip uses a render-local canvas transform, not `flipHorizontally()`** —
  that method nudges `position.x` for a non-center anchor, and here `position.x` is world state
  read every frame by the despawn check and the patrol anchor.
- **`kaalamanStart` is temporarily 3 instead of Section 4's 0.** Artifacts (the real source)
  are Phase 3 and the debug grant needs a physical keyboard, so on a phone a level starting at
  0 leaves the attack button permanently dead and combat impossible to playtest. Chosen over
  adding an on-screen debug button, which would have added a fourth control competing for
  thumb space with the joystick and two buttons already tuned for reach, plus its own removal
  pass later. Set back to 0 in Phase 3.

## 4. Things we tried that did NOT work
- **The death-sequence test cost several wrong turns, all confirmed by instrumentation rather
  than guessed.** In order: `Component.update()` does not cascade to children (`updateTree()`
  does), so the effect never ticked; a bare `ChronoGame` never reaches `isMounted`, and
  `Component._addChild` skips the lifecycle queue entirely for an unmounted parent, so the
  effect was never mounted and `ComponentEffect.target` stayed uninitialised; `tester.pump()`'s
  ticker did not reliably advance the effect where direct `game.updateTree(dt)` did; and the
  first `updateTree` call is needed just to flush the effect's own pending add before its
  controller starts advancing. The file's header documents all of this so the next person
  doesn't re-derive it.
- **`enemy.parent == null` could not be asserted after the death sequence.** `onComplete` does
  fire and `removeFromParent()` does run (both verified by temporary prints), but the detach
  stays queued in this harness no matter how many extra ticks are driven. The test asserts
  `isRemoving` instead — the state the production code actually sets — rather than testing the
  harness.
- **`eraId: 'ww2'` was assumed to yield a Heavy.** It picks randomly between `japanese_soldier`
  (Walker) and `tank` (Heavy), so a patrol-free test passed only about half the time. This
  surfaced as a test that passed alone but failed in the full suite; fixed with the
  `enemyTypeOverride` seam rather than by retrying until the right sprite appeared.
- **Contact-damage tests initially lost an extra heart.** With no `GroundSection` in a bare
  game, gravity pulled the player below the viewport within ~1s and tripped `update()`'s
  fall-in-gap check. The helper now pins the player to the ground between frames.

## 5. Next steps (in order)
1. **User playtests this batch on-device.** Everything above is uncommitted until then.
   Specific things worth a read: whether hearts drain too fast (enemies spawn often and walk
   into you), whether the attack feels responsive, and whether 3 starting charges is right.
2. **Tune `combat_constants.dart` from that feedback.** The phase prompt anticipates most of
   these numbers being wrong first pass — that file exists for exactly this.
3. **Phase 3 — artifacts, gates, quiz rework.** Makes charges earnable by answering questions,
   which is what retires the debug key and the temporary `kaalamanStart = 3`.

## 6. Constraints & conventions
- Gravity (900), jump force (-480) and the 90-113 platform range are unchanged and still
  off-limits — Phase 2 touched none of them.
- `CombatConstants` is the only place Phase 2 tuning numbers live. Do not scatter combat
  values back into `GameConstants` or into components.
- The debug charge key (`K`), `CombatConstants.debugGrantAmount`, `kaalamanStart = 3` and the
  `KeyboardEvents` mixin on `ChronoGame` are all Phase 2 scaffolding with one removal point in
  Phase 3. Delete them together.
- `EnemyComponent.enemyTypeOverride` and `PlayerComponent.isFlashVisible` are
  `@visibleForTesting` seams; production code must not read them.
- `test/game/sprite_scale_test.dart` is mildly flaky in full-suite runs (real sprite file I/O
  within a fixed number of pump/runAsync cycles). Pre-existing, unrelated to Phase 2 — re-run
  before treating a failure there as real.
- Always send arm64-v8a APKs, and **only build one when explicitly asked.**

---

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

## Older entries (folded)
- 2026-09-25 (GAMEPLAY-V2 Phase 0 — free wins) — Unstubbed `AudioService` onto real `flame_audio` (asset prefix `assets/sounds/`, plugin init deferred to first play so merely constructing a game doesn't drag the plugin into every test) and replaced all 18 sound files with real audio; added the six per-era parallax tints via the decorator chain (chained, not assigned — assigning drops the existing decorator); in-level HP 10 → 5; the Energy UI rename (presentation only — `HeartsState`, provider fields and Hive keys untouched); and fixed the level-complete screen's fabricated results by passing a real `LevelCompleteResult` through GoRouter `extra`. Committed `bb006ef` on `v2-phase-0`, root `3568db6`. Two lasting gotchas: the shipped "silent" sound files were 4-byte stubs that threw on every play and were indistinguishable from a broken service, so check file sizes before suspecting the code; and `kotlin.incremental=false` in `android/gradle.properties` is load-bearing — without it `audioplayers_android` fails to compile and `flutter build apk` breaks outright.
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