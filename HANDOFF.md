# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:** 2026-09-25 (Phase 0/0.5 end-to-end CDP verification, before Phase 1)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Before starting Phase 1, verify Phase 0/0.5 end-to-end with actual measurements instead of
eyeballed screenshots: pixel-diff the six era tints, confirm level counts and boss positions
match Section 1 exactly, and confirm the level-complete score matches a real computed result
rather than just some plausible-looking display text.

## 2. Current state

**New, committed to `tool/`:**
- `tool/png_util.js` — dependency-free PNG decoder (Node's built-in `zlib` only) with
  `meanRGB`/`rgbDistance`/`pixelDiff` helpers. Turns a `cdp_shot.js` screenshot into real pixel
  values instead of something only a human can eyeball.
- `tool/cdp_shot.js` — gained `--port` (test a plain-static `flutter build web` bundle instead
  of the dev server), a `console:`/`clearconsole` step (read back `debugPrint` output — how a
  script can learn a shuffled quiz question's correct-answer letter without knowing it in
  advance), and now always calls `Page.bringToFront` before running steps.

**Verified, all against a `flutter build web --profile` bundle on a plain static file server
(no DWDS) — see Decisions for why:**
- **Tints**: mean background colour sampled from all six eras' actual game canvas (not
  level-select) plus a same-era reshoot as a noise-floor control. Every cross-era pair differs
  by 23.5-79.3 in RGB distance; the same-era control (two shots of pre-colonial ~1.5s apart)
  differs by 0.38 — every era is 60-200x further from every other era than from itself. Full
  pixel-diff agrees: ~98-99% of sampled pixels differ beyond threshold cross-era vs 14.7% for
  the control (background dust-particle animation, not colour). Incidental finding: spanish vs
  nationalism is the closest pair (23.5), not spanish vs american (33.9) as Phase 0's eyeballed
  note guessed — expected, since nationalism deliberately reuses spanish's palette, but the two
  eras' own tints (sepia/amber vs warm ochre) still read as distinct on top of it.
- **Level counts and boss positions**: counted level-select nodes directly from screenshot
  pixels (classifying each x-position by exact match against the three *opaque* node-fill
  colours — `AppColors.primary`/`Colors.grey.shade700`/`AppColors.accent` — which render
  identically regardless of era, unlike the alpha-blended connector and border colours, which
  blend with each era's own background gradient and so differ per era; matching only the
  opaque constants is what makes one classifier work across all six colour schemes with no
  per-era tuning). Counted exactly 10/5/7/8/8/5 = 43 nodes across the six eras, matching
  Section 1 exactly, and the last node in every era is 54px wide vs 42px for the rest — the
  boss node, always last, confirming `isBoss` position for every era, not just eyeballed for one.
- **Level-complete score**: played pre-colonial level 1 to completion for real — all 10
  questions answered correctly via temporary `debugPrint`s revealing each shuffled question's
  correct-answer letter (removed after). Recorded each answer's real elapsed time and the
  final coin count from the trace, then independently reconstructed the expected score from
  the documented rules alone (10 base × 10 questions, 0 speed bonuses since real answering
  latency was never under 10s, +50 perfect bonus, +5 × 31 coins collected along the way) =
  **305**. That number matches both the engine's own internal `score` at `levelComplete()` and
  the level-complete screen's displayed "+305 PUNTOS" exactly — three independent sources
  (manual reconstruction, internal state, UI) agreeing, not just "a number is shown."

**Not re-verified this round:** audio (still needs a human, per the Phase 0 entry) and the
other five eras' full level-complete flow (only pre-colonial was played to completion; the
other five share the same code path, so this wasn't repeated five more times).

## 3. Decisions made (and why)
- **Tested against a static `flutter build web --profile` bundle, not `flutter run
  -d web-server`.** The dev server's periodic self-reload (documented in `cdp_shot.js`,
  ~20-30s) would have wiped a 10-question, multi-minute playthrough partway through with no
  warning. A static build has no DWDS, no reload, and (once the one-time Flutter/CanvasKit
  bootstrap finishes) loads in ~1-2s instead of the dev server's 45-55s per full reload — worth
  doing for any verification longer than a couple of screenshots. Built via PowerShell, not Git
  Bash, to avoid the documented `--dart-define=DEV_START_ROUTE=...` path-mangling gotcha.
- **A second, worse freeze cause found and fixed in the tooling: OS-level window focus, not
  just the CDP tab.** `Page.bringToFront` selects the right *tab* but does nothing if the
  Chrome *window* itself isn't the foreground OS window — this session's Chrome was launched
  detached and had no window focus at all, so the game sat completely frozen (`elapsedSeconds`
  climbing, `dt` not) through several minutes of waits until the actual window was raised via
  PowerShell's `SetForegroundWindow`. `cdp_shot.js`'s existing rAF-throttling note only covered
  the tab-level case; now documents both.
- **The question overlay's timer keeps running in real wall-clock time while the Flame engine
  is paused.** `QuestionOverlayWidget`'s `Timer.periodic` is a plain Flutter timer, independent
  of `pauseEngine()` — so `elapsedSeconds` (and therefore the speed bonus) reflects genuine
  real-world seconds since the question appeared, including any gap between separate script
  invocations while a human or agent is reading a screenshot. This is *why* every one of the 10
  answers in the score verification missed the <10s speed bonus (real per-question turnaround
  was 18-59s) — correctly reflected in the final score, not a bug in the timer or the test.
- **Coin income was not scripted or predicted in advance, only measured after the fact.** Coins
  auto-collect on contact with no player action, so their count over a run is a function of
  spawn-timer luck, not something to forecast. Reading the final `playerCoins` from the same
  debug trace that reported the answers is enough to reconstruct the exact expected score
  without needing to control or predict coin timing.
- **`png_util.js`'s node classifier matches exact opaque RGB constants, not a background-
  relative brightness threshold.** The first version classified by absolute brightness/hue and
  worked for the spanish/pre-colonial screenshots (dark brown gradient) but collapsed american
  and modern (blue/indigo gradients) into "1 giant node," because the connector and border
  colours are `.withValues(alpha:...)` and blend with whatever gradient is behind them — a
  different RGB per era. The three fill colours are plain opaque `color:` values with no alpha,
  so they're the one thing genuinely constant across all six screenshots.

## 4. Things we tried that did NOT work
- **Classifying level-select nodes by absolute background brightness + one hardcoded connector
  RGB.** Correct for the two eras it was tuned against, silently wrong (a single merged "node")
  for the other four with different background gradients — see Decisions.
- **Trying to answer questions quickly enough for the speed bonus, across separate script
  invocations.** Real wall-clock time passes between "read the screenshot" and "send the next
  click" regardless of how fast that happens in agent-time; every answer landed past 10s. Not a
  failure of the verification — the expected-score formula was built to use whatever elapsed
  time actually happened, not to assume a bonus that testing conditions couldn't reliably hit.

## 5. Next steps (in order)
1. Phase 1 — player control (see the Phase 0.5 entry below for detail). This entry's
   verification is the explicit prerequisite check the user asked for before starting it.
2. Content debt carried over from Phase 0.5 (unchanged): `questions_nationalism.json`, the
   real BOW-PDF-sourced era 4/5 historicalText split.
3. Audio still needs a human (Phase 0 entry, unchanged).

## 6. Constraints & conventions
- For any CDP-scripted verification longer than a couple of screenshots, prefer a static
  `flutter build web --profile` bundle on a plain static server (`tool/cdp_shot.js --port`)
  over the dev server — see Decisions.
- Before a scripted run with waits longer than a few seconds, confirm the Chrome *window* has
  real OS focus (not just the CDP tab) — see Decisions. `cdp_shot.js` handles the tab; the
  window is on you.
- `flutter test` must still be scoped to `test/data test/game test/models`; `test/screens/`
  still hangs (see the 2026-09-22 Tier 1 entry, folded below).
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