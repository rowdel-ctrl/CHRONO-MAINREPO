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

**Date:** 2026-09-22 (Tier 1: hit/idle animation, housekeeping; test hang root-caused but NOT fixed)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement Tier 1 of `NEXT_STEPS_CHECKLIST.md`: the `flutter test` hang, hit animation on correct answer, idle animation, and the 3-file housekeeping decision.

## 2. Current state

**Not yet committed in CHRONO-GAMEAPP:**
- `lib/game/components/player_component.dart` — added `triggerCheer()`, mirroring `triggerHurt()`'s exact structure (own delayed revert, not the update()-loop transition reset).
- `lib/game/quiz_handler.dart` — calls `player.triggerCheer()` on a correct answer, right after `overlays.remove('QuestionOverlay')`.
- `lib/screens/home/character_selection_screen.dart` — `_IdleAvatar` now cycles the 4 walk frames on a `Timer.periodic` (450ms/frame), on top of its existing bob `AnimationController`.
- `test/game/player_reactions_test.dart` (new, 4 tests) — asserts the animation the player is actually switched to on each quiz outcome. See Decisions for why this replaced a screenshot.
- `tool/` — staged to commit as a permanent dev tool (was untracked since it was introduced). Gained a `scroll:<x>,<y>,<dy>` step this session, which does **not** work on Flutter web (see "did NOT work").
- `CHRONO-GAMEAPP/quiz_card_phone_preview.png` — deleted (confirmed zero references anywhere via grep).

**Root repo:**
- `HANDOFF(template).md` — staged to commit (a genuine reusable blank template, not scratch).
- `NEXT_STEPS_CHECKLIST.md` — Tier 1 outcomes recorded, plus three newly-surfaced items.

**The `flutter test` hang was NOT fixed — the attempted fix was written, tested, and reverted.** It is now thoroughly root-caused instead; see Decisions. `test/flutter_test_config.dart` and the `pubspec.yaml`/`pubspec.lock` dev-dependency additions that supported it were all reverted, so the tree is back to the established baseline on that front.

**Verified:** `flutter analyze` clean at the same 5 known info lints. `flutter test test/data test/game test/models`: **96/96 pass in 23 seconds** (the 92 baseline plus the 4 new `player_reactions_test.dart` cases). The idle-avatar change was confirmed in a real CDP run at 1280×800: two screenshots ~500ms apart on character selection show Lapu-Lapu's stance genuinely change (wide stride with sword extended vs. a narrower, lower stance) — a real sprite-frame change, not just the pre-existing vertical bob.

**What's unfinished:**
- The test hang itself. `test/screens/tutorial_screen_test.dart` still hangs exactly as it did before this session. What's gained is knowing precisely why, and that the obvious fixes are dead ends — see Decisions.
- No live playtest of `triggerCheer()` — deliberately replaced with tests (see Decisions), not skipped for time.

## 3. Decisions made (and why)
- **The hang is fully root-caused, in three parts.** (1) The "TimeoutException after 0:10:00" everyone assumed was a per-test timeout is actually **`pumpAndSettle()`'s own default** (`flutter_test/lib/src/widget_tester.dart:692-695`: `Duration timeout = const Duration(minutes: 10)`) — so the symptom is "frames never stop being scheduled," not "a test is slow." (2) The thing that never completes is **`path_provider`**: before google_fonts checks `allowRuntimeFetching`, it looks for a cached font on disk via `getApplicationSupportDirectory()`, a platform-channel call with no native handler in a plain widget test, which hangs rather than throwing. Faking it (exactly as google_fonts' own suite does in `test/load_font_if_necessary_test.dart`) really does make the tutorial file fail in ~5s instead of hanging. (3) **But that fix can't land, because the 92/92 green depends on the hang.** With `path_provider` faked, font loading gets far enough to actually throw "Poppins not found and fetching disabled", and `test/data test/game test/models` drops to **64/92** — `question_card_test.dart` and `answer_feedback_test.dart` render Poppins text and had been passing only because that load hung forever in the background as a harmless dangling Future.
- **Reverted rather than shipped.** A change that trades "one file hangs" for "28 tests fail" is a regression, however well-understood. The tree is back to baseline and the finding is written down instead.
- **The real fix is to bundle Poppins `.ttf` files** under `assets/fonts/` and declare them in `pubspec.yaml`, so the font resolves locally with no network and no platform channel — which would also remove a runtime font fetch from the shipped app. Blocked here: no network, and no Poppins `.ttf` exists anywhere on this machine (checked `C:\Windows\Fonts`, the pub cache, the Flutter SDK, and the repo).
- **`triggerCheer()` verified by test, not screenshot.** It reuses the jump pose (no character has cheer art — `assets/characters/` has only `_walk_1-4`, `_jump`, `_hurt`), so a cheering player and a jumping player render an identical frame and a screenshot would prove nothing. `test/game/player_reactions_test.dart` asserts the actual animation object instead: correct → `jumpAnim` not `walkAnimation`, wrong → `hurtAnim` not `jumpAnim`, score still awarded, and cheering bails out mid-hurt. Stronger evidence than a photo, and permanent.
- **Idle animation scoped to `_IdleAvatar` only** — `tutorial_screen.dart` and `background_history_screen.dart` also show a static `_walk_1` frame, but they're smaller, secondary displays sitting behind a generic multi-asset illustration widget and a `CircleAvatar.backgroundImage` respectively; changing either cost more scope/risk than a "quick, independent" Tier 1 item should.
- **`quiz_card_phone_preview.png` deleted; `tool/` and `HANDOFF(template).md` kept and staged to commit** — the screenshot had zero references anywhere (checked via grep). The other two are genuinely useful and intentional.

## 4. Things we tried that did NOT work
- **`GoogleFonts.config.allowRuntimeFetching = false` in a `flutter_test_config.dart`.** Redundant (the affected test file already sets it itself) *and* actively harmful globally — it forces the throw path for every test that renders Poppins.
- **Suppressing the resulting exception via `reportTestException`.** Strictly worse: the exception is what *aborts* the test, so swallowing it let the test run on and `pumpAndSettle` spin its full 10 minutes. Turned a 4-second honest failure into a 10-minute hang.
- **Leaving fetching enabled so the failed fetch returns null instead of throwing.** Also fails — 5/27 on `question_card_test.dart`.
- **Diagnosing a hang by piping through `| tail -N`.** `tail` without `-f` can't know the last N lines until EOF, so it buffers everything and prints nothing until the process exits — a slow-but-working run and a truly hung one look identical. This cost real time treating "no output yet" as proof of a hang. Use no pipe, `head`, or `--reporter expanded`.
- **`Input.dispatchMouseEvent` with `type: 'mouseWheel'` to scroll Flutter web** (added as a `scroll` step to `tool/cdp_shot.js`). Flutter's web engine ignores it; the page doesn't move. `Input.synthesizeScrollGesture` is the likely fix. This blocks scripted playtests of anything gated behind a scroll, e.g. reaching level select past `background_history_screen.dart`'s "scroll down to continue".
- **Booting straight into `/game/:era/:level` via `DEV_START_ROUTE` with a fresh browser profile.** Renders blank — that route needs a character already selected in Hive, which a fresh profile doesn't have.
- **`TaskStop` alone to stop a `flutter test` run.** On Windows it stops the tracked wrapper but leaves the `dart` → `dartvm`/`dartaotruntime` → `flutter_tester` tree running orphaned; four abandoned runs accumulated before this was noticed. Kill the specific PIDs with PowerShell `Stop-Process -Id`, then confirm with `Get-Process`.

## 5. Next steps (in order)
1. Commit and push — nothing from this session is committed yet, pending user confirmation.
2. Bundle Poppins `.ttf` files (needs network) — the one fix that actually resolves the test hang, and it removes a runtime font fetch from the shipped app as a bonus.
3. Triage the three items newly surfaced in `NEXT_STEPS_CHECKLIST.md`: the crashing blank-animation fallback at `player_component.dart:70`, the non-working CDP scroll step, and the blank `/game/...` direct route.
4. Tier 2 of `NEXT_STEPS_CHECKLIST.md`: the gap system, obstacle variety.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- `flutter test` still must be scoped to `test/data test/game test/models`. `test/screens/` still hangs — unchanged by this session.
- When diagnosing a possibly-hanging command, never pipe it through `| tail`. Use no pipe, `head`, or `--reporter expanded`.
- After stopping a background `flutter test`, verify no orphaned `dart`/`flutter_tester` processes are left behind.

---

**Date:** 2026-09-22 (outstanding-work checklist)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
User asked for a full checklist of everything left to do on the project, ordered so the fastest/easiest items come first.

## 2. Current state
Wrote `NEXT_STEPS_CHECKLIST.md` at the repo root instead of folding the full list into this file — HANDOFF.md is a session log, not an ongoing tracker, and the project already has precedent for a separate standalone checklist (`CAMERA_REBUILD_CHECKLIST.md`). Before writing it, verified every item against real git/code state rather than trusting older HANDOFF prose:
- Confirmed via `git log`/`git status` in the CHRONO-GAMEAPP submodule that hearts regen (`9dee494`), the bigger sprite (`9692c48`), and the parallax light-layer fix (`35b022b`) are genuinely committed — 5 of the adviser's original 8 feedback items are done (also fixed the entry below, which still said "not yet committed" even though it already was — see its updated "Current state").
- Confirmed by reading the actual code that 3 adviser items are genuinely still open: no player-side reaction to a correct answer (`lib/game/quiz_handler.dart:39`, the `if (isCorrect)` branch only awards score and defeats the enemy/boss), no player idle animation (only `BossComponent` has a real `idleSprite`; the character-select preview at `lib/screens/home/character_selection_screen.dart:508` is a single static `_walk_1.png` frame, not a loop), and obstacle variety is thin — enemies already have 2 types per era chosen at random (`enemy_component.dart:73-81`), but every obstacle is the same `WallComponent` behavior (one reskinned PNG per era) plus one shared `crate.png`, both dealing identical damage (`player_component.dart:186-199`).
- Found the gap system is still dead code, confirmed directly (not just carried over from an old note): `GroundSpawner.update()` in `lib/game/components/gap_component.dart:176` is an empty no-op, and `spawnInitialGround()` lays down one 1,000,000-wide `GroundSection` covering the whole level — a gap is never actually left unfilled, so falling-in-a-gap is unreachable content, not just untested.
- Confirmed 3 untracked files still need a keep-or-drop decision: `tool/` (the CDP playtest script) and `quiz_card_phone_preview.png` in the CHRONO-GAMEAPP submodule, `HANDOFF(template).md` at the repo root.

No code changed this session.

## 3. Decisions made (and why)
- **A separate `NEXT_STEPS_CHECKLIST.md` file, not a section in this file** — matches the `CAMERA_REBUILD_CHECKLIST.md` precedent and keeps this file's per-session entries short, per its own stated convention.
- **Grouped into 4 tiers by independence/effort, not the adviser's original list order** — Tier 1 (hit/idle animation, the test-hang fix, the 3-file housekeeping decision) needs no new decisions from the user; Tier 2 (gap system, obstacle variety) needs one small decision first; Tier 3 (Level 10 boss playtest, quiz question content) isn't really a coding task; Tier 4 (aspect-ratio/0-hearts polish) is optional and already low-risk.

## 4. Things we tried that did NOT work
- (None — this was a read/verify/write-checklist session, no code attempted.)

## 5. Next steps (in order)
See `NEXT_STEPS_CHECKLIST.md` at the repo root — start at Tier 1, top to bottom.

## 6. Constraints & conventions
- `flutter test` gotcha still applies until Tier 1's fix lands: scope to `test/data test/game test/models`, don't run it bare.

---

**Date:** 2026-09-22 (bigger player sprite + parallax light-layer fix)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement the adviser's "bigger sprite" item, now unblocked by the fixed-resolution viewport (see the folded entries below for why it had to wait).

## 2. Current state

**Committed in CHRONO-GAMEAPP** (`9692c48`, `35b022b`) **and pushed** (`45241ad` at root, this doc + submodule bump):
- `lib/game/components/player_component.dart` — player `size` changed from `Vector2(64, 80)` to `Vector2(96, 120)` (1.5x). Nothing else in this file changed: `position = Vector2(0, game.groundY - size.y)`, ground/platform landing checks, and `respawn()` are all already expressed relative to `size.y`, and `RectangleHitbox()` (added with no explicit size) auto-fits whatever `size` is at add-time — so all of it picked up the new size with no further edits.
- `test/game/fixed_resolution_test.dart` — updated the illustrative `playerHeight` constant used by "a sprite covers the same fraction of the screen on every device" from `80.0` to `120.0`, so the test still describes a real current number instead of a stale one; the test's logic (proportional scaling holds across devices) didn't depend on the specific value either way.
- `lib/game/components/parallax_background.dart` — **separate fix, same session:** the user spotted (from a screenshot taken for the bigger-sprite check above) that the translucent light-rays layer was drawing in front of the mid-trees layer instead of behind it. Reordered the `loadParallax` list from `[back-trees, middle-trees, lights, front-trees]` to `[back-trees, lights, middle-trees, front-trees]`. This wasn't just a draw-order tweak: Flame's `ParallaxComponent` ties scroll speed to array position too (each layer scrolls faster than the one before it via `velocityMultiplierDelta`), so the old order also had the lights layer scrolling *faster* than the mid-trees — wrong for what's meant to be an ambient, distant effect. The reorder fixes both at once.

**Why 96x120, not just "somewhat bigger":** checked native asset pixel sizes across the cast — player art is 52x68, enemies 52x64 (rendered at 60x72), and the boss is 80x90 (rendered at 120x140). That meant the boss was already upscaled ~1.5x from its native art, while the player was only upscaled ~1.2x — barely more than enemies get, which is very likely *why* the adviser flagged the hero as not reading as the hero. 96x120 is exactly 1.5x the player's native 52x68 (same width:height ratio as the old 64x80, just scaled up), matching the treatment the boss already gets instead of inventing a new ratio.

**Verified:** `flutter analyze` clean at the same 5 known info lints. `flutter test test/data test/game test/models`: 92/92 pass, unchanged by either edit (no test asserts the production `onLoad()` size directly, and `parallax_background_test.dart`'s 2 tests inject an empty-layer `Parallax` to isolate the velocity math from real asset order, so the reorder didn't touch them). Confirmed both in real runs over CDP (`/game/spanish/1`, 1280×800): Rizal renders clearly larger than the approaching Spanish-soldier enemy, standing correctly on the ground with no clipping; separately, a before/after pair of screenshots confirmed the light rays now sit behind the tree trunks instead of overlapping in front of them. Also caught a jump next to a spawned platform in the same session (user asked to see one) — no clipping or landing issues from the bigger sprite there either.

**What's unfinished:**
- Did not re-verify very wide/narrow pillarboxed windows specifically for the sprite-size change — the fixed-resolution viewport should make that a non-issue (world units are device-independent), but wasn't explicitly reshot at another aspect ratio. Tracked in `NEXT_STEPS_CHECKLIST.md` (Tier 4).

## 3. Decisions made (and why)
- **1.5x scale, derived from the boss's existing native-to-rendered ratio, not a round guess** — see "Why 96x120" above. Keeps the new size defensible against "why that number" rather than picking an arbitrary bump.
- **Left `test/game/fixed_resolution_test.dart`'s constant in sync but changed nothing else test-side** — every other test that hardcodes a player size is a bare stand-in object for testing unrelated behavior (enemy despawn, camera tracking, parallax speed), not an assertion about the real player's dimensions, so leaving those at `64x80` doesn't make them wrong or stale.
- **Light rays moved to right after the back-trees layer, not just swapped with front-trees** — the user's own framing ("should be second") plus the compositional logic (an ambient layer should be near-static, closest in speed to the furthest-back layer) both pointed at position 2 of 4, not position 4.

## 4. Things we tried that did NOT work
- (None — this one was a single clean value change with no surprises.)

## 5. Next steps (in order)
See `NEXT_STEPS_CHECKLIST.md` at the repo root (written in the entry above this one) — it supersedes the numbered lists in this and every older entry below.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- Same playtest recipe as the entries below: PowerShell dev server on port 8123, `tool/cdp_shot.js` against CDP debug port 9222.
- `flutter test` gotcha from the entry below still applies: scope it to `test/data test/game test/models`, don't run it bare — `test/screens/tutorial_screen_test.dart` hard-hangs for up to 20 minutes in this sandbox.

---

**Date:** 2026-09-22 (persistent hearts regen)
**From:** Claude Code
**To:** Claude Code / Chat
**Project:** ChronoQuest

---

## 1. Goal
Implement the adviser's "hearts regen" item: a persistent pool of hearts (max 5, +1 every 10 minutes of real time, survives app restarts) that gates starting or retrying a level. Decided in an earlier session ("hearts regen at 1/10min capped at 5" — see the folded entries below) but not yet built.

## 2. Current state

**Not yet committed in CHRONO-GAMEAPP:**
- New `lib/models/hearts_state.dart` — a pure, unit-tested `HeartsState` (an `int count` + a nullable regen-anchor epoch-ms timestamp) with `regenerated(now)`, `consumed(now)`, `afterLevelFailed(now)` (regen-then-consume in one step, so call sites can't forget the ordering), and `timeUntilNext(now)`. Regen is computed lazily from the stored timestamp against `DateTime.now()` rather than a running `Timer`, so it keeps accruing while the app is closed — this codebase had no prior wall-clock-persisted-timer pattern (repo-wide `DateTime.now()` grep was previously empty; the only existing `Timer` was `question_overlay.dart`'s per-widget 1s countdown, which doesn't survive being closed).
- `lib/core/constants.dart` — added `GameConstants.maxHearts = 5` and `GameConstants.heartRegenInterval = Duration(minutes: 10)`.
- `lib/services/storage_service.dart` — two new flat Hive keys (`hearts_count`, `hearts_regen_start_ms`), matching the existing `hasSeenTutorial`/`markTutorialSeen` style exactly (no `@HiveType` adapter — nothing else in this file uses one either).
- `lib/providers/game_provider.dart` — added `GameState.hearts`, loaded once in `GameNotifier`'s constructor (regen applied immediately on app open, mirroring the existing `_loadCharacter()` pattern), plus `refreshHearts()` (re-applies regen, for a live countdown), `canStartLevel`, and `consumeHeartOnLevelFailed()`.
- `lib/screens/game/game_screen.dart` — `onLevelFailed` now calls `consumeHeartOnLevelFailed()` before navigating, alongside the existing `awardPowerUp` call on the complete path.
- `lib/screens/game/level_select_screen.dart` (now `ConsumerStatefulWidget`) — shows the hearts row plus a live "Susunod: M:SS" countdown (a 1s `Timer.periodic` calling `refreshHearts()`, mirroring `question_overlay.dart`'s countdown); tapping a progression-unlocked level at 0 hearts shows a dialog instead of navigating (styled like `pause_overlay.dart`'s existing quit-confirm `AlertDialog`).
- `lib/screens/game/level_failed_screen.dart` (now `ConsumerWidget`) — **also fixes the long-standing bug** where this screen hardcoded `List.generate(3, ...)` empty hearts regardless of the real count (noted in three prior HANDOFF entries); now shows the actual persistent-pool count out of 5, and disables "ULIT" with a countdown message at 0 hearts.
- `lib/screens/game/level_node.dart` — the per-level-node widget extracted out of `level_select_screen.dart`, which the above pushed to 364 lines (over this project's 200-300 budget); pure refactor, no behavior change, brought it back to 273.
- New `test/models/hearts_state_test.dart` — covers regen timing (partial progress preserved across calls, multiple elapsed intervals applied at once, capping at max), consume (floors at 0, doesn't reset an already-running countdown on a second consume), and `afterLevelFailed`'s regen-before-consume ordering.

**Explicit design decision (asked the user — the old "capped at 5" note didn't say how this interacts with in-level mistakes):** in-level HP (`GameConstants.livesPerLevel`, still 10, still resets every attempt) is **unchanged** — wrong quiz answers, obstacle hits, and gap falls behave exactly as before. The new persistent pool only loses a heart when a level is *fully* failed, and only gates *starting or retrying* a level, not individual in-level mistakes. Explicitly rejected shrinking the existing per-mistake pool from 10 to 5 directly, since obstacles spawn every 3-8 seconds and would have drained a shared 5-heart pool almost immediately, risking locking a classroom out for up to 40 minutes mid-lesson.

**Verified:** `flutter analyze` clean at the same 5 known info lints (3 new info lints introduced by this work — 1 missed `const` in `hearts_state.dart`, 2 in the new test file — were fixed before landing at that baseline). `flutter test test/data test/game test/models`: **92/92 pass**, including all 13 new `hearts_state_test.dart` cases. Confirmed in real runs over CDP (1280×800, `DEV_SKIP_AUTH`+`DEV_START_ROUTE`): `/level-select/spanish` renders 5/5 full hearts with no countdown text (pool full → `timeUntilNext` correctly null); `/level-failed/spanish/1` renders the real heart count via the asset icons instead of the old hardcoded 3 empty `Icons.favorite_border`, with "ULIT" enabled. Did **not** force the pool down to 0 for this playtest — reaching that branch for real needs either 5 genuine level failures (no fixed click coordinates to script blindly through 10 HP of quiz/obstacle mistakes) or throwaway debug scaffolding, neither of which seemed worth it given `HeartsState`'s exhaustive unit tests already cover that branch's math and the render/gating code is a direct, symmetric read of the same tested object.

**New finding — `test/screens/tutorial_screen_test.dart` doesn't just flake, it hard-hangs in this environment:** running the full unscoped `flutter test` cost 20 minutes for nothing — its first two tests each hit a full `TimeoutException after 0:10:00: Test timed out after 10 minutes`, then a third was killed mid-run. The parallax-background entry below already documented this file's `google_fonts` real-network-font-fetch issue as an *intermittent, fast-rejecting* flake; in this sandbox (no network route) it instead hangs for the entire 10-minute test timeout, twice in a row, before anything else in the file gets a chance to run. It also has a nasty side effect: because `flutter test` doesn't guarantee alphabetical file order, `test/models/hearts_state_test.dart` (this session's new file) never even started before the 20 minutes were up — it only got verified by explicitly re-running `flutter test test/data test/game test/models`, which skips `test/screens/` entirely. **Until this is fixed, don't run a bare `flutter test` and wait — scope it to specific directories, or expect to lose up to 20 minutes per run.**

**Update: committed and pushed** — `9dee494` in CHRONO-GAMEAPP, `fb19d80` at root (this doc + the submodule bump), both after the CDP playtest above confirmed the rendering.

**What's unfinished:**
- The 0-hearts branch specifically (disabled retry button, the level-select dialog) was never seen in a real run — only its math, via the unit tests. Reaching it for real needs 5 genuine level failures or throwaway debug scaffolding; neither seemed worth it given how directly the render/gating code reads the same tested `HeartsState`.
- **`test/screens/tutorial_screen_test.dart`'s network-fetch hang is not fixed** — likely needs `GoogleFonts.config.allowRuntimeFetching = false` set somewhere tests actually load (e.g. a `flutter_test_config.dart`, which doesn't exist yet), but that's unrelated to hearts regen and wasn't attempted here. Flagging as a strong candidate for its own session given it now costs a full 20 minutes whenever someone runs the unscoped suite.
- Remaining adviser items (4 of 8 once this lands): hit animation on correct answer, idle animation, bigger sprite, enemy/obstacle variety.
- Level 10 boss fight playtest — still never done, carried across every entry below.

## 3. Decisions made (and why)
- **Hearts gate level attempts only, not in-level mistakes** — see the design-decision paragraph above; the user picked this explicitly over "hearts replace in-level HP entirely" and "track hearts, never block play."
- **Regen math lives on a pure `HeartsState` model (`regenerated`/`consumed`/`afterLevelFailed`), not inline in the provider or inside a Hive `TypeAdapter`** — keeps the timing math unit-testable without Hive/Flutter bindings, and matches this codebase's existing pattern of pure transform methods on models (`Question.withShuffledOptions` remaps `correctAnswer` by position the same way).
- **`GameNotifier` owns hearts state, not `ChronoGame`** — hearts need to be visible on `level_select_screen.dart`, outside any live `ChronoGame` instance, and `GameNotifier` already had the "load from `StorageService` in the constructor" pattern (`_loadCharacter`) to mirror.
- **`level_select_screen.dart` split into `level_node.dart`** — see "Current state" above; a pure extraction to stay under the line budget, not a behavior change.

## 4. Things we tried that did NOT work
- (None yet — this entry is implementation-only; real-run verification is still pending, see "What's unfinished.")

## 5. Next steps (in order)
1. Remaining adviser items: hit animation on correct answer, idle animation, bigger sprite, enemy/obstacle variety.
2. Level 10 boss fight playtest.

## 6. Constraints & conventions
- Consult `CHRONO-GAMEAPP/.claude/skills/flutter-flame-gamedev` before writing any Flame code.
- Same playtest recipe as the entries below: PowerShell dev server on port 8123, `tool/cdp_shot.js` against CDP debug port 9222.

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