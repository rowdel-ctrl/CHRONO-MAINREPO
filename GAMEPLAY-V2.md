# ChronoQuest — Gameplay V2 Design ("Knowledge is your weapon")

Status: **Phases 0-3 implemented and committed**, awaiting their on-device playtest; Phase 4
still design proposal. Revision 12 — **Phase 3, artifacts and gates, is built** (`43cc237`),
which is the point this document calls "the new game": questions are no longer something
enemies inflict on you but something you seek out. Artifacts grant Kaalaman and fill a Codex;
three gates per level guarantee the educational floor; the question bank became a pool that
never repeats within an attempt and always differs on retry; and Phase 2's debug charge
scaffolding is gone. One agreed deviation — scoring now takes the best attempt per question,
because Section 6's retries and Section 12's frozen payload otherwise combine to punish
learning — is recorded in Section 15's Phase 3 status note. Revision 11 — **Phase 2, combat
and Kaalaman, is built**:
attack hitbox with charge cost and cooldown, the Kaalaman charge system with HUD orbs,
Walker/Heavy behaviours with HP, the Flame effect death sequence with coin drops, contact
damage with knockback and invincibility frames, enemies no longer opening the quiz, and a
distance-based level-end rule replacing "all enemies dead". Chaser and the boss rework stay
deferred. Three deliberate, temporary deviations are recorded inline — see Sections 4 and 5's
corrections and Section 15's Phase 2 status note. On top of revision 10, where Phase 1's "play
it on a real phone" playtest (Section 15) surfaced three real-device-only issues, fixed and
confirmed on-device on `v2-phase-1` (`c3ca19a`, `99076c4`): the fixed-resolution viewport pillarboxed any
screen wider than 16:9 (now a custom edge-to-edge `StretchToFillViewport`); a first attempt at
fixing that (a non-uniform stretch, counter-scaled back to circular for the HUD only) still
left world sprites visibly stretched, so the real fix instead lets virtual **width** track each
device's own aspect ratio (virtual height stays fixed) — the world-to-screen scale is always
uniform now, so nothing stretches anywhere, HUD included, with no counter-scaling needed; and
the joystick, sized to be reachable, unavoidably overlapped the player's old render position
(fixed by moving `GameConstants.playerX`, not by shrinking the joystick past comfortable). The
platform-height ceiling also moved 110→**113**, the exact jump-reachability limit. See Section
3's Controls correction for detail. On top of revision 9's platform-height range correction to
**90-110** (was 60-105, `16fbc5c`); revision 8's Phase 4 commitment to Claude Code generating a
programmatic first-draft `.tmx` for all 43 levels (Sections 11, 14, 15), shrinking the
authoring job from "build 43 levels" to "review 31, hand-build 12"; revision 7's crate removal
and render-order fix; revision 6's
hearts reversal; revision 5's Era 3 correction; and the revision 4 codebase corrections.
Six-era curriculum structure from the DepEd three-term Budget of Work, built around
off-the-shelf components, corrected against a full read of the codebase (Task M,
2026-09-24).
Companion to `GAMEPLAY.md`, which documents the game as it exists today.
Target: Flutter/Flame app `CHRONO-GAMEAPP` (`rowdel-ctrl/CHRONOQUEST-GAME`).

**If you are Claude Code reading this: start at Section 15, not Section 1.**

---

## 0. Why change anything

The current build has a real problem, and it isn't the auto-runner.

**The quiz and the game never touch each other.** You collide with an enemy, the world
freezes, a worksheet appears, you answer, the world unfreezes. The running section and the
learning section are two separate apps sharing a screen. The running asks nothing of you
(one button, no failure states worth the name) and the quiz is a modal interruption to it.

Adding movement controls alone would not fix this. It would produce a manual runner with
the same worksheet bolted on.

**The design goal of V2:** make knowledge a resource the player spends inside the action.
You answer questions because you need what answering gives you — not because a collision
stopped you.

Two clean, separate resources:

| Resource | Represents | Earned by | Spent on |
|---|---|---|---|
| **Kaalaman** (charges) | The knowledge layer | Correct answers | Attacking, opening gates |
| **HP** | The action layer | Starts at 5 per level | Lost to contact damage, hazards, falls |

Wrong answers no longer cost HP. Bad reflexes no longer cost knowledge. Both matter, and
they fail in different ways — which is what makes it a game rather than a quiz with sprites.

---

## 1. Curriculum alignment — read this before designing any content

The game's content structure is not a creative choice. It is derived from the **DepEd MATATAG
Araling Panlipunan Three-Term Budget of Work** for Grades 5 and 6 (`G5_BOW_AP_5_-_Three-Term_v2.pdf`
and `G6_BOW_AP_6_-_Three-Term_V2.pdf`, updated 29 June 2026). See Appendix D of the thesis for
the full mapping with verbatim competencies.

Two things changed recently and both matter:

- **Grade 6 moved to MATATAG in SY 2026-2027** (Phase 3). Grade 5 moved in SY 2025-2026. Both
  grades are on the new curriculum now.
- **DepEd replaced the four-quarter calendar with three terms** starting SY 2026-2027
  (school year runs 8 June 2026 – early April 2027). The curriculum guide is still written in
  quarters; the Budget of Work re-cuts that content into three terms. **Follow the BOW, not
  the quarters.**

### Terminology — important

In this document and in the code:

- **Era** = one term's worth of content. There are **six**.
- **Level** = one playable stage, roughly 2 minutes, covering one competency group.

The thesis level-mapping table labels the six eras "Level 1-6". That is the thesis's naming;
**in the game they are eras.** Do not confuse them, and do not let a level in code inherit an
era's number.

### The six eras

| Era | Filipino title | English | Source |
|---|---|---|---|
| 1 | Sinaunang Pilipinas | Ancient / Pre-colonial Philippines | G5 Term 1 |
| 2 | Pananakop ng Espanya | Spanish Colonization | G5 Term 2 |
| 3 | Pag-usbong ng Nasyonalismo | Rise of Filipino Nationalism | G5 Term 3 |
| 4 | Himagsikan at Imperyalismong Amerikano | Philippine Revolution & American Imperialism | G6 Term 1 |
| 5 | Pamahalaang Kolonyal at Pananakop ng Hapon | Colonial Government & Japanese Occupation | G6 Term 2 |
| 6 | Batas Militar at Muling Pagbangon ng Demokrasya | Martial Law & Restoration of Democracy | G6 Term 3 |

This replaces the previous five-era list (pre-colonial / spanish / american / ww2 / modern),
which had **no era for the Katipunan and the Himagsikan** — an entire term of Grade 6, and the
period three of the five playable characters belong to.

### Levels per era come from the BOW, not from a round number

Each era gets **one level per competency group** in its Budget of Work. The counts are uneven
on purpose, because the curriculum is uneven:

| Era | Competency groups → levels |
|---|---|
| 1 | 10 |
| 2 | 5 |
| 3 | 7 |
| 4 | 8 |
| 5 | 8 |
| 6 | 5 |
| **Total** | **43** |

> **Correction, 2026-09-25:** an earlier revision of this document miscounted Era 3 as 6
> levels; recounting the source PDF's competency groups for Pag-usbong ng Nasyonalismo gives
> **7**: [1] / [2-3] / [4-5] / [6] / [7] / [8-9] / [10]. All level-count references in this
> document have been corrected to 43. Caught after Phase 0.5 had already implemented 6 — a
> one-field fix in the registry (`levelCount` for era 3, and the boss position), not a
> rebuild, since it was caught before Phase 4 content was authored against it.

Every level therefore maps to one named competency and is defensible as "this level teaches
this." Do not normalise these to a uniform 10.

### Curriculum weeks, sourced

The `weeks` array for every level's `curriculum` tag, transcribed from the same
`ChronoQuest_Level_Topics` PDF that produced the era table above (itself sourced from
`G5_BOW_AP_5_-_Three-Term_v2.pdf` / `G6_BOW_AP_6_-_Three-Term_V2.pdf`, DepEd, 29 June 2026).
This is real BOW data, not invented — use it directly rather than leaving `weeks` empty.

| Era | Level → weeks |
|---|---|
| 1 (G5 T1) | 1:[1] · 2:[2] · 3:[3] · 4:[4] · 5:[5] · 6:[6] · 7:[7] · 8:[8] · 9:[9] · 10:[10] (boss) |
| 2 (G5 T2) | 1:[1,2] · 2:[3,4,5] · 3:[6,7] · 4:[8] · 5:[9,10] (boss) |
| 3 (G5 T3) | 1:[1] · 2:[2,3] · 3:[4,5] · 4:[6] · 5:[7] · 6:[8,9] · 7:[10] (boss) |
| 4 (G6 T1) | 1:[1] · 2:[2] · 3:[3] · 4:[4] · 5:[5] · 6:[6] · 7:[7,8] · 8:[9,10] (boss) |
| 5 (G6 T2) | 1:[1,2] · 2:[3] · 3:[4] · 4:[5] · 5:[6] · 6:[7] · 7:[8,9] · 8:[10] (boss) |
| 6 (G6 T3) | 1:[1,2,3] · 2:[4] · 3:[5,6] · 4:[7,8] · 5:[9,10] (boss) |

### Every level carries its curriculum tag

Level data includes a `curriculum` block keyed to grade, term and BOW week(s):

```json
"curriculum": { "grade": 5, "term": 1, "weeks": [5, 6] }
```

This is what lets CHRONO-DASHBOARD report to teachers by competency rather than by score
alone — "this class is weak on G6 Term 1, weeks 7-8" instead of "average 68%". It also
survives the next calendar reshuffle, because week-level competencies are stable even when
DepEd changes the containers around them.

### Art mapping, and the two places it doesn't line up

| Era | Enemy set(s) | Boss |
|---|---|---|
| 1 | pre-colonial | Bakunawa |
| 2 | spanish | Governor |
| 3 | spanish | **none — see below** |
| 4 | spanish → american | General |
| 5 | american → ww2 → modern | Commander |
| 6 | modern | Corruption boss |

**Era 3 has no boss sprite.** It covers secularisation, GOMBURZA and the Propaganda Movement,
so a friar fits thematically. That is **one** new boss sprite — or reuse the Governor if time
runs out.

**Eras 4 and 5 each span more than one visual period.** Era 4 begins with Filipinos fighting
Spanish forces and ends with the Philippine-American War. Era 5 runs from the Commonwealth
through the Japanese occupation to 1946-1986 neocolonial policy. Do not use one enemy set for
a whole era in these two — switch sets partway through, in level order, so the history does
not look flat. This is a level-authoring instruction, not an engine feature.

There are also only **5 era wall sprites for 6 eras**; Era 3 reuses `spanish_wall.png`, which
is period-correct.

### One decision to make deliberately

Era 6 covers Batas Militar explicitly — the BOW names it. The current design uses an abstract
`corruption_boss` rather than depicting a real political figure as an enemy. **Keep that
abstraction**, and be ready to explain the choice: it is a defensible, deliberate decision,
and it is likely to be asked about.

---

## 2. Core loop

```
enter level
  -> traverse a handcrafted stretch (platforms, gaps, hazards)
  -> enemies block or chase you; attacking costs Kaalaman, and you start at 0
  -> find an artifact (answer point) -> answer -> claim artifact + gain charges
  -> spend charges fighting through
  -> reach a gate -> answer correctly to open it
  -> repeat for 3-4 sections
  -> level end (or boss, on level 10)
```

The player is now in control of where they are and what they engage with. Some enemies can
be dodged instead of fought. That choice — spend a charge, or risk the jump — is the
moment-to-moment decision the current game is missing entirely.

---

## 3. Controls

The camera already follows the player — `chrono_game.dart` sets `camera.viewfinder.position`
from `player.worldX` every frame. **What is actually missing is player-driven velocity**:
today `player_component.dart` auto-increments `position.x` by a constant, so the player cannot
stop, slow down or reverse. Phase 1 replaces that constant with joystick input and adds a
facing direction. The camera work itself is minor; the movement model is the change.

### Don't build the controls — Flame ships them

Flame has on-screen controls built in. No third-party package, no custom touch handling:

- **`JoystickComponent`** — virtual stick with configurable knob and background sprites.
  Exposes `delta`, `intensity` and `relativeDelta`, which is all you need to drive
  horizontal movement.
- **`HudButtonComponent`** — a button anchored by margin to the viewport edge rather than a
  world position. Takes idle and pressed `PositionComponent`s and gives you `onPressed` /
  `onReleased` callbacks. Stays fixed on screen automatically.
- Also available if you want them: `SpriteButtonComponent`, `ButtonComponent`,
  `AdvancedButtonComponent`, `ToggleButtonComponent`.

Layout: joystick bottom-left, **Jump** and **Attack** as two `HudButtonComponent`s
bottom-right.

**Button art:** use [Kenney's](https://kenney.nl/assets) "Onscreen Controls" and "UI Pack" —
CC0, no attribution required, same licensing pattern as the Buch forest tiles already in the
project. Don't draw these yourself.

### Keep the jump physics

Gravity `900`, jump force `-480`, peak ~128 units.

> **Correction, 2026-09-26 (`v2-phase-1`, `16fbc5c`):** platform spawn heights moved from
> 60-105 to **90-110** after a real-device screenshot showed 60 putting platforms at ankle
> height on a 120-tall player. 110 stays under the verified reachability ceiling
> (`jumpPeak - 15` = 113, exercised by `platform_layering_test.dart` at 60fps, 30fps, and a
> frame-hitch at jump-off). **90-110 is now the protected range** — gravity and jump force
> are unchanged and still off-limits. If platforms feel too high, 90 is the number to pull
> back; 110 is the ceiling the jump arc allows.

> **Correction, 2026-09-29 (`v2-phase-1`, `c3ca19a` + `99076c4`, confirmed on-device):** the
> Phase 1 "play it on a real phone" playtest below surfaced three more issues, all
> layout/rendering, not physics. (1) `CameraComponent.withFixedResolution` pillarboxes any
> screen wider than exact 16:9 (black bars on the sides) — replaced with a custom
> `StretchToFillViewport` (`lib/game/stretch_to_fill_viewport.dart`). A first version of that
> viewport fixed both virtual width and height (1280×720) and stretched them non-uniformly to
> fill the canvas — this removed the bars but a device screenshot showed world sprites
> (enemies, coins, platforms) still visibly stretched even after counter-scaling the HUD back
> to circular. The real fix instead keeps virtual **height** fixed (`GameConstants
> .virtualHeight`, still 720 — gravity, jump force, groundY and spawn distances, all measured
> against height, are unaffected) but lets virtual **width** track each device's own aspect
> ratio, so the world-to-screen scale is always uniform: nothing stretches, on any axis, on any
> device. `GameConstants.virtualWidth` no longer exists as a fixed constant as a result. (2) The
> stretch fix above also resolves the HUD-ovals problem for free — the `hudCounterScale`
> mechanism that used to cancel it has been removed entirely, since there's no longer any
> unevenness to cancel. (3) A joystick sized/positioned to be comfortably reachable unavoidably
> overlapped the player's render position at the old `GameConstants.playerX = 80` — no joystick
> sizing could satisfy both "reachable" and "clear of the character" at once, so the actual fix
> was moving the player (`playerX` 80→220) rather than continuing to shrink the joystick.
> Platform ceiling also raised **110→113** (still `jumpPeak - 15`, unchanged limit, just no
> longer leaving 3 spare units unused). Jump/Attack buttons 20% bigger; walk speed 150→210
> (parallax auto-adapts). All of the above is committed on `v2-phase-1` — see `HANDOFF.md`'s
> 2026-09-29 entry for full detail.

Attack: a short forward hitbox in the facing direction, ~0.25s, with a cooldown so it can't
be spammed. Fails with a small "no charges" shake if Kaalaman is 0.

> **Playtest early.** On-screen controls on a 5-inch phone are the single most likely thing
> to feel bad. Get a rough version on a real device in week one, before building anything
> on top of it. Be willing to simplify — e.g. auto-facing, or a single context-sensitive
> action button instead of separate jump and attack.

---

## 4. Kaalaman (the charge system)

- Start every level with **0 charges**. (Levels 1-2 of each era may grant 1 as a tutorial freebie.)
- A correct answer at an artifact: **+2 charges**.
- A correct answer after a wrong attempt at the same artifact: **+1 charge**.
- **Attacking costs 1 charge.**
- Displayed in the HUD as a small row of glowing orbs, next to HP.
- Cap: 6. This stops hoarding and keeps the player returning to artifacts.

The cap is what makes the system work. A player who answers everything can't bank enough to
brute-force the level; a player who skips artifacts runs dry and has to sneak. Both are
valid, both are interesting, and the second one is more dangerous.

> All five numbers above (start, reward, retry reward, cost, cap) are **guesses that must be
> tuned by playing**. Treat them as starting values, not requirements.

> **Correction, 2026-09-30 (`v2-phase-1`, Phase 2, uncommitted):** every one of these numbers
> now lives in `lib/core/combat_constants.dart` (`CombatConstants`), which is where they
> should be re-tuned — Section 15's Phase 2 prompt asked for exactly one such file. Two
> deviations from the list above, both deliberate and both temporary:
> **(1) `kaalamanStart` is 3, not 0.** Artifacts are the only real source of charges and
> don't exist until Phase 3, while the debug grant key needs a physical keyboard — so on a
> touch device a level starting at 0 leaves the attack button permanently dead and makes
> combat impossible to playtest at all. Set it back to 0 as part of Phase 3, once answering an
> artifact awards charges for real.
> **(2) The orbs are plain circles stacked under the hearts, not "glowing orbs next to HP".**
> No orb art exists in the project yet, and the row sits under the hearts rather than beside
> them so it doesn't crowd the level/score/coin widgets sharing that row — a playtest request,
> not a design change. Same "plumbing now, real asset later" split Phase 0 used for audio.

---

## 5. Combat and enemies

Enemies stop being quiz triggers and become actual threats. Contact damage on touch:
**-1 HP**, knockback away from the enemy, and ~1s of invincibility frames (flashing sprite)
so you don't get chain-hit.

Two behaviours for the first build, covering all ten existing enemy sprites — no new art:

| Behaviour | Enemy types | Hits | Notes |
|---|---|---|---|
| **Walker** | tribal_warrior, spanish_soldier, american_soldier, japanese_soldier, dark_spirit, propaganda, misinfo_cloud | 1 | Patrols back and forth within a set range. Turns at the edge. |
| **Heavy** | tank, tax_collector, corruption_figure | 2 | Barely moves. Placed to block a corridor so it must be dealt with, not dodged. |

**Deferred: `Chaser`.** A third behaviour — floats, ignores gravity, pursues the player
within a detection radius — suits dark_spirit, propaganda and misinfo_cloud much better than
Walker does. It is also the fiddliest of the three to get right and the least necessary for
a working demo. Build it in a later pass if time allows; until then those three run as
Walkers with a floating Y offset.

**Enemy death** needs no new sprite. Use Flame's built-in effects — a `SequenceEffect` of
`ColorEffect` (white tint) → `ScaleEffect` (slight grow) → `OpacityEffect` (fade) over ~0.3s,
then drop 2-3 coins. No custom animation code.

**Crates are cut.** They were the original game's only non-era-themed hazard — a single generic
box (`crate.png`) with no thematic identity, unlike the era walls, which are about to become
Section 6's knowledge-gates. Keeping both meant two flavors of "static thing you jump or take
a hit from," one of them meaningless. Removing crates also shrinks the object vocabulary for
the 43 hand-authored Phase 4 levels — one fewer thing to consider placing per level, forty-some
times over.

> **Correction, 2026-09-26:** cut after a real-device playtest surfaced a broken collision on
> them; on inspection they added no thematic value era walls didn't already cover. `crate.png`
> is no longer used by this design. If Phase 1 already shipped crate-collision code, remove it
> rather than fix it.

**Hazards**, going forward, are era walls (→ gates, Section 6) and gaps. **Gaps stay deferred to
Phase 4** for the same reason the object-despawn fix does (Section 14): the current procedural
spawner is dead weight Tiled replaces entirely, so patching real gaps into it now is work
that gets thrown away in a few weeks. Until Phase 4, levels simply have no ground-fall hazard
— acceptable mid-development. Contact damage in general (enemies, walls) is `-1 HP` with
knockback, per Section 4.

**Falling in a gap:** -1 HP and respawn at the last ground segment you were standing on. The
existing `playerFellInGap` logic covers most of this; it needs a respawn anchor instead of a
straight vertical reset.

> **Correction, 2026-09-30 (`v2-phase-1`, Phase 2, uncommitted):** this section is implemented
> as written — the behaviour table transcribes directly into `lib/game/enemy_behavior.dart`
> (7 Walkers, 3 Heavies), the death sequence is the exact ColorEffect → ScaleEffect →
> OpacityEffect chain over 0.3s, and contact damage is -1 HP with knockback and a ~1s
> invincibility flash. Four notes on how it actually landed:
> **(1) The three Chaser-destined sprites run as plain Walkers, without the "floating Y
> offset"** this section suggests — an offset with no pursuit behaviour reads as a bug rather
> than a hint at a future one, so it's better added alongside the real Chaser.
> **(2) Heavies move zero, not "barely".** Simplest reading that satisfies the description,
> and trivially loosened later once level authoring can place them to block a corridor as
> intended (they currently spawn in open ground, procedurally).
> **(3) Enemies now mirror their sprite when patrolling back** — the art faces left natively,
> so without a flip they visibly slid backwards on the return leg. Done with a render-local
> canvas transform, never `flipHorizontally()`, which mutates `position.x` — world state the
> despawn check and patrol anchor both read every frame.
> **(4) The attack's slash-arc overlay is a plain rectangle for now**, since no such art
> exists in the project; referencing a missing sprite would throw at runtime.
> All tuning values (patrol range and speed, knockback, i-frame duration, death timings, coin
> drop range) live in `lib/core/combat_constants.dart` — see Section 4's correction.

---

## 6. Artifacts (answer points) — the heart of the redesign

`artifact_1.png` … `artifact_5.png` are already bundled and **completely unused** by the
current code. They become the single most important object in the game.

An artifact is a floating, glowing, era-appropriate object placed in the level. Walk into it
(or press attack next to it) and the question overlay opens.

**Correct:** you *claim* the artifact. It plays a collect animation, vanishes, gives
**+2 Kaalaman**, and is permanently added to your **Codex**.

**Wrong:** the explanation panel appears, exactly as it does today — that behaviour is one
of the best things in the current build and should not change. Then:

- **No HP is lost.**
- The artifact stays in the world but goes inert for ~5 seconds, then re-lights.
- On re-interaction it serves a **different question** from that level's pool.
- The reward drops to **+1 Kaalaman** for that artifact.

This is a much better learning loop than the current one. There is no dead end, the
explanation is still mandatory reading, and mastery is rewarded with a resource rather than
mere permission to continue. Being wrong costs you time and power, which are the things you
actually care about in the moment.

### The Codex

Claimed artifacts fill a per-era **Codex** on the Profile screen: a grid of the artifacts
you've collected, each with a one-paragraph history blurb tied to the question it came from.

This is the cheapest high-value feature in the whole document. The art exists, the questions
exist, the blurbs can reuse the explanation text already written for wrong answers. It gives
students a reason to replay levels, gives the adviser a visible educational artifact
(literally), and is a plain Flutter `GridView` — no game code, no package.

> There are only 5 artifact sprites for 6 eras. Reuse them across eras with the per-era
> colour tint (Section 10), or generate more later if time allows.

### Gates

Gates use the **existing era wall art** (`spanish_wall.png` etc.), which currently does
nothing but sit on the ground as a hazard. A gate blocks the full height of the corridor —
you cannot jump it.

Interacting with a gate opens a question. Correct: the wall crumbles and you pass. Wrong:
explanation panel, then retry with a different question. You cannot proceed until you get
one right, which is fine — the student reads the explanation and tries again.

**Gates are what guarantee the educational floor.** A student could theoretically dodge
every enemy and skip every artifact, but they cannot skip gates. Put **3 gates in every
level** and every student answers at least 3 questions correctly, plus however many attempts
that took. Artifacts (4-6 per level) are the optional, rewarded layer on top.

---

## 7. Boss fights (final level of each era)

The current boss is 12 multiple-choice questions in a row with a sprite next to them. It is
the least game-like part of the build.

### Build this version first

Keep the existing boss structure and add three things:

1. **A 15-second countdown bar** on each boss question.
2. **Six questions instead of twelve.**
3. **Minions between questions** — 2-3 era enemies (reuse existing sprites) spawn after each
   answer and must be cleared before the next question. **Minions drop Kaalaman charges**,
   which is how you refuel mid-fight.

That's a modest change to existing code and it already turns the boss from a worksheet into
an encounter with pressure and pacing. **This is where Time Freeze finally does something:**
it pauses the countdown. The power-up is currently inert dead weight in the data model;
giving boss questions a timer gives it a reason to exist.

### Upgrade later if time allows

The full version is a three-phase loop using all three existing boss sprites, with 3 shields
instead of 12 HP:

- **Phase 1 — Onslaught (~20s).** Boss uses its `attack` sprite, throws projectiles on an
  arc and summons minions. You dodge, jump, and kill minions to refuel.
- **Phase 2 — Opening.** Boss staggers to `idle`. An artifact appears centre-screen. Question
  overlay with the 15-second countdown.
- **Phase 3 — Break or recover.** Correct: a shield shatters, big damage flash, Phase 1
  restarts harder. Wrong or timeout: explanation panel, no shield broken, back to Phase 1.

Three shields broken: `defeated` sprite, fireworks, era complete.

Either version keeps the final level's larger question bank in use — the pre-boss section
carries its normal gates and artifacts, so the level total stays around 10-12 questions.

**The boss sits on the last level of each era**, which under the Section 1 structure means
level 10 of Era 1, level 5 of Era 2, level 6 of Era 3, and so on — not always "level 10".
Era 3 has no boss sprite yet; see Section 1.

---

## 8. Lives — one heart pool, everywhere

> **Correction, 2026-09-26:** this section originally proposed splitting the game's one heart
> system into two — in-level HP (resets every attempt) and a renamed "Energy" gate (persistent,
> menu-only) — reasoning that two unrelated systems sharing one icon was confusing. That
> reasoning was mine, not the user's, and after playing the Phase 1 build the actual answer
> came back the opposite way: **one shared heart pool, one icon, no second name.** This
> revision replaces the split entirely. If Phase 0's Energy rename already landed, it needs to
> be reverted along with this.

**Five hearts, one pool, shared by everything.**

- Persistent state: max 5, stored the same way the original game's hearts were.
- **Every damage event decrements this same pool** — enemy contact, era-wall/hazard hit, falling
  in a gap. Not a level-local counter that resets on retry; the real, global count.
- **No longer lost to wrong answers** (this part of the original split is kept — Section 6's
  "wrong answer costs no HP" still applies).
- Regen: **1 heart per 1 minute** of real wall-clock time, continuing while the app is closed.
  (Faster than the original game's 10-minute interval — deliberate, since one shared pool
  running out is a bigger deal than a level-local one did.)
- One icon (`heart_full` / `heart_empty`), one label, shown both during gameplay and on menu
  screens. No "Energy", no bolt icon, no second name anywhere.

**Real consequence, worth stating plainly:** because it's one pool, running out of hearts
*inside* a level both fails that level **and** locks you out of starting or retrying *any*
level until at least one heart regenerates — about a minute, at 1/minute. Under the old
two-system design this couldn't happen (a failed level cost one *persistent* heart, but you
always had a fresh 5 in-level HP for the next attempt). This is a real difficulty and pacing
change, not just a rename. If it plays too punishing once combat (Phase 2) adds more ways to
take damage, the number to revisit is the regen rate, not the pool split.

---

## 9. Economy

Coins currently do nothing but add +5 to a score. Make them currency — the data model
already exists and simply isn't enforced.

- **Coins are spendable.** Earned from pickups and from defeating enemies (2-3 per kill),
  which is the incentive to fight rather than dodge everything.
- **Character unlocks get enforced.** Unlock costs already exist in the character data and
  nothing charges for them. Wire it up: Lapu-Lapu free to start, the other four purchased
  with coins. Instant long-term goal, essentially free to implement.
- **Power-ups become purchasable** (50/50, Shield, Time Freeze) from the Profile screen.
- **Call the existing power-up sync endpoint.** The backend route exists and nothing in the
  app calls it, so power-up counts are local-only and lost on reinstall.

---

## 10. Presentation — the two free wins

Neither is gameplay, and both should be done before anything else in this document.

**Wire up the audio service.** The file names are all bundled — 5 BGM tracks and 13 SFX — and
the call sites already exist throughout the code, but the service is a stub where every call
is a no-op **and the audio files themselves are silent placeholders**. So this is plumbing
work, not a quality win: connecting **`flame_audio`** (official Flame bridge over
`audioplayers`) makes the hooks real, and the game gets audibly better only once actual sound
files replace the empty ones.

Do it anyway, in Phase 0, because it is cheap and it means dropping in real audio later is a
file copy rather than a code change. But **include at least one real sound file** — a CC0 jump
or coin effect — or the work is unverifiable: silent files and a broken service sound
identical.

Sourcing, whenever you get to it: [Kenney](https://kenney.nl/assets) has CC0 audio packs, and
OpenGameArt has CC0 music — the same licensing pattern as your existing tiles. One ambient
loop per era is enough; period-accurate Filipino historical music is hard to source freely and
is not worth the time unless someone is grading it.

**Tint the parallax per era.** There is exactly one background set (forest), so all six eras
look identical. That is a large part of why the game doesn't feel like a real game. You do
not need new backgrounds — apply Flame's **`PaintDecorator.tint()`** to the existing parallax
component, roughly one line per era. Use a **semi-transparent** colour — e.g. `Color(0x66C9A227)`
— so detail stays visible through the tint.

> **Do not assign `component.decorator =`.** The Flame docs show that form, and it is wrong for
> anything extending `PositionComponent`: `decorator` is a `late` field the component already
> populates with its own `Transform2DDecorator`, which applies position and scale. Overwriting
> it discards the transform. Chain instead:
> `decorator.replaceLast(PaintDecorator.tint(color))` — `replaceLast` appends on the first call
> and swaps on later ones, so a repeated `onLoad` cannot stack tints. Confirmed against the
> installed Flame source during Phase 0.

| Era | Tint | Feel |
|---|---|---|
| 1 Sinaunang Pilipinas | warm green | lush, untouched |
| 2 Pananakop ng Espanya | sepia / amber | old, colonial |
| 3 Pag-usbong ng Nasyonalismo | warm ochre | late-colonial, restless |
| 4 Himagsikan at Imperyalismong Amerikano | dusty gold | dry, institutional |
| 5 Pamahalaang Kolonyal at Pananakop ng Hapon | desaturated blue-grey | cold, grim |
| 6 Batas Militar at Muling Pagbangon | hazy cyan | urban, artificial |

Six constants and a decorator. Distinct-feeling eras at zero asset cost. Real per-era
backgrounds are the highest-value art in the project if time ever allows, but the tint gets
you most of the way there in an afternoon.

---

## 11. Level authoring — use Tiled, don't build a level format

Right now, level "content" is generated at runtime by a spawner: enemies roughly every 800
world units, coins on timers. The only authored per-level data is the question
set. This is the deepest reason the game doesn't feel designed — because it isn't. Nothing in
it was ever placed by a person.

**Do not write a custom level schema and loader.** Use [Tiled](https://www.mapeditor.org/),
a free and mature visual map editor, via Flame's official bridge package
[`flame_tiled`](https://pub.dev/packages/flame_tiled) (v3.1.2, actively maintained by the
Flame team).

You draw levels with a mouse: paint the ground layer, drag enemies, artifacts and gates onto
an object layer. Each object carries custom properties read at load time.

### Object layer convention

Place objects on a layer named `entities`. Each object's `type` (or `class`) plus custom
properties defines what it becomes:

| type | Properties | Becomes |
|---|---|---|
| `enemy` | `kind` (sprite name), `behavior` (`walker` / `heavy`), `patrol` (px) | An enemy component |
| `artifact` | `art` (`artifact_1`…`artifact_5`) | An answer point |
| `gate` | — | A gate using the era's wall art |
| `coin` | — | A coin pickup |
| `spawn` | — | Player start position |
| `exit` | — | Level end trigger |

The ground tile layer defines the geometry directly, so **gaps are just places you didn't
paint ground** — which turns on the fall-through logic already written and unused in the
codebase, for free.

Levels live at `assets/tiles/levels/era<N>_<n>.tmx` (era numbers 1-6 per Section 1). Per-level
config that isn't geometry — question pool, starting charges, HP, and the `curriculum` block
from Section 1 — stays in a small JSON file or in Tiled map-level custom properties, whichever
is less friction. **Every level must carry its `curriculum` tag**; a level without one cannot
be reported on by the dashboard.

### What this replaces

The runtime spawner stops spawning. It becomes a thin loader: load the `.tmx`, read the
object layer, instantiate components. The existing off-screen cleanup must be revisited —
the camera follows the player now and the player can turn around, so anything culled behind
them can be walked back to. For levels this short, cull generously or not at all.

### Auto-generating first drafts, not blank levels

Building 43 levels by hand in Tiled is the single largest content cost in this project
(Section 16). Rather than hand you 43 empty maps, Phase 4 includes a generator script that
writes a mechanically valid first-draft `.tmx` for every level, once the real loader and
object-layer schema above exist to generate against:

- Ground with gaps, sized to the level's position in its era's difficulty ramp.
- Enemies spaced out with `walker`/`heavy` mix shifting later in each era.
- Artifacts and gates placed at the cadence in Section 6/7 (gates every ~3 answer points).
- Platforms at valid heights (90-110, Section 2) — never violating the tuned jump arc.
- The level's `curriculum` block and question-pool link pre-filled from the Section 1 mapping,
  so every generated level is already reportable, not just playable.

**What this changes, honestly:** it removes the blank-canvas problem, not the judgment
problem. The script can guarantee a level is *playable* — no impossible gaps, no
softlocks — it cannot tell you whether it's *fun*. Your job becomes reviewing and adjusting
43 already-playable levels instead of building 43 from nothing. Still hand-build, on purpose
rather than by rule: **the first level of each of the 6 eras** (first impression of that era)
and **the 6 boss levels**. That's 12 levels of deliberate hand-authoring against 31 of
generate-then-review, not 43 of either extreme.

**Sequencing matters:** the generator is written and run once Phase 4's loader and schema are
real, against the actual tileset — not guessed at from this document beforehand. See the
Phase 4 prompt in Section 15.

### Two honest caveats

1. **Your ground tile constants get superseded.** The `(row, col)` mappings in
   `tile_platform_component.dart` are pixel-verified correct against real screenshots, and
   moving to Tiled means setting the tileset up once inside Tiled instead. It's a net win,
   but it does mean retiring work that currently works. Keep the old file until the Tiled
   path is proven.
2. **One-way platforms are hand-rolled, not a Flame feature.** An earlier draft of this
   document said pass-through "relies on `renderPriority = -1`". **That is wrong** —
   `renderPriority` only controls draw order, and was the fix for a separate overlap bug.
   The actual one-way gate is a manual `velocityY >= 0` AABB test in
   `player_component.dart` (~lines 116-128) run against `game.platforms`, not a Flame hitbox
   or collision callback. Migrating to Tiled means re-pointing that hand-written check at
   Tiled-sourced platform objects — meaningfully more work than moving a flag, and the single
   most likely place for platforming to silently break.

---

## 12. Asset plan

### Already bundled, reused as-is

| Asset | V2 role |
|---|---|
| `artifact_1..5.png` (currently unused) | Answer points — the core mechanic |
| `<era>_wall.png` ×5 | Gates (Era 3 reuses `spanish_wall.png` — see Section 1) |
| Boss `idle / attack / defeated` ×5 | Boss phases (Era 3 has no boss sprite — see Section 1) |
| 10 enemy types × 2 frames | Walker / Heavy behaviours |
| `coin.png` | Currency (now actually spendable) |
| Bundled sound file names | Unstub the audio service — **files are silent placeholders**, replace with CC0 audio later |
| Power-up icons ×3 | Time Freeze finally does something |
| `ground_tileset.png` | Now driven through Tiled |
| Parallax forest layers | Reused with a per-era `PaintDecorator.tint()` |
| `fireworks.json` | Boss defeat / era complete |

### Free, off-the-shelf (CC0 — no attribution required)

| Need | Source |
|---|---|
| Joystick, jump/attack buttons | [Kenney Onscreen Controls](https://kenney.nl/assets) |
| Attack slash arc | Kenney particle/effects pack, or OpenGameArt |

### New art actually needed

1. **Idle pose ×5 characters** — already on your adviser's list. Cheap to generate.
2. **Era 3 boss ×1** — a friar, for the nationalism era. Reuse the Governor if time runs out.
3. *(Optional)* Enemy hurt frames — **skip.** The Flame effect sequence handles it.
4. *(Optional, highest value if time allows)* Per-era background sets.

**That's 6 sprites**, down from 11 in revision 1.

### The slash trick — why the attack pose is gone

Revision 1 called an attack pose ×5 characters the only genuinely blocking asset. It isn't,
because you don't have to redraw the character: **overlay a slash arc in front of the
existing walk frame.** A generic swing sprite drawn in the facing direction reads perfectly
well as an attack.

One sprite instead of five, and it works for any character added later at no extra cost.

### Backend contract — do not break it

The quiz result POST (score, per-question answers, timing) and the star calculation
(≥90% = 3 stars, ≥70% = 2, else 1) keep exactly their current shape. Accuracy still works as
a percentage even though the number of questions per run can now vary with how many artifacts
the student engaged. The dashboard keeps working with no changes.

Log gate and artifact attempts into the same per-question array that exists today. Optionally
add one field — `artifactsClaimed` — but treat it as additive and make the dashboard tolerate
its absence.

---

## 13. What we are NOT building

Everything in this column is handled by something that already exists. Do not hand-roll any
of it.

| Need | Use | Not |
|---|---|---|
| On-screen movement | Flame `JoystickComponent` | Custom drag handling |
| Jump / attack buttons | Flame `HudButtonComponent` | Custom hit-testing |
| Control & UI art | Kenney CC0 packs | Drawing them |
| Level editing | Tiled + `flame_tiled` | A custom JSON schema + loader |
| Death / hit flash | Flame `ColorEffect` + `OpacityEffect` + `ScaleEffect` | Frame-by-frame animation |
| Era colour grading | Flame `PaintDecorator.tint()` | Five background sets |
| Audio | `flame_audio` | A hand-rolled player |
| Codex screen | Flutter `GridView` | Anything in the game layer |

**Do not add a physics engine.** No Forge2D, no Box2D. The existing gravity and jump values
are tuned against the platform heights; a physics engine would discard that and provide
nothing this design needs.

---

## 14. Implementation plan

Phases are ordered so the game is **playable and demoable at the end of every one**. Nothing
here requires a big-bang rewrite. Estimates assume the off-the-shelf components above.

### Phase 0 — Free wins (1-2 days)
- Unstub the audio service via `flame_audio`. **The bundled sound files are silent
  placeholders**, so drop in one real CC0 effect to prove the plumbing works — otherwise the
  result is indistinguishable from the current no-op.
- Per-era parallax tint with `PaintDecorator.tint()`.
- **Superseded — see Section 8.** Phase 0 originally split the heart system into in-level HP
  (10→5) and a renamed, menu-only "Energy" pool. Section 8 now specifies a single shared
  5-heart pool with 1-minute regen instead; if the Energy rename already shipped, revert it
  (icon, label, and any UI-only surface changes — `HeartsState`, provider fields and Hive keys
  were never touched and don't need to change back). Update the tutorial copy string that says
  "May 10 buhay ka bawat antas" to match the real number regardless of which model lands.
- **Fix the level-complete screen's fabricated results.** It currently derives the score shown
  to the player from `widget.level % 3` rather than the real result, which the game already
  computes and passes to `onLevelComplete` before discarding it. This is a pre-existing bug,
  not a V2 change, but it shows players invented numbers — unacceptable in a thesis demo, and
  it gets worse once question counts vary per run. Forward the real values to the screen.

*Do this first even if you decide against the rest of the document.*

### Phase 0.5 — One source of truth for eras and levels (3-4 days) **[prerequisite]**

A codebase audit found the five-era list and the "level 10 is the boss" rule **duplicated
across roughly 18 files**, each with its own switch statement or hardcoded literal. There is
**no `Level` data model at all** — a level is an `int` scoped to an era string, with the boss
position and question count baked in as the literal `10` at every site.

Section 1's six eras, variable level counts (10/5/6/8/8/5) and `curriculum` tags cannot be
bolted onto that. This phase must land before any gameplay work, or every later phase
re-litigates it.

- **New** `Level` model: era, index, `curriculum` block (`grade`, `term`, `weeks`), question
  pool reference, `isBoss`.
- **New** era/level registry — one source defining the six eras and their level lists.
- Replace every hardcoded site: `constants.dart` (`eraGradeMap`, `allEras`),
  `question_bank.dart`, `enemy_component.dart`, `boss_component.dart`, `wall_component.dart`,
  `gap_component.dart`, `progress_provider.dart`, `api_service.dart`,
  `era_selection_screen.dart`, `level_select_screen.dart`, `background_history_screen.dart`,
  `era_complete_screen.dart`, `era_progress.dart`, `profile_screen.dart`, `chrono_game.dart`,
  `hud_overlay.dart`, `game_screen.dart`.
- Every `currentLevel == 10` / `level == 10` check becomes **"is this the last level of this
  era's list"**. Every `'/10'` label and `List.generate(10, ...)` becomes era-driven.
- `era_progress.dart`'s `isLevelUnlocked` hardcodes "9 prior levels" — must become
  list-length-driven.

**Do not** add gameplay behaviour in this phase. It is a pure restructure with the game still
playing exactly as it does today, which is what makes it safe to verify.

### Phase 1 — Player control (2-3 days)
- Refactor `chrono_game.dart` **first** (see codebase notes below).
- `JoystickComponent` + two `HudButtonComponent`s with Kenney art.
- Unlock the player's X; add horizontal velocity and facing direction.
- Camera follows the player instead of auto-scrolling.
- Everything else keeps working — enemies still trigger the quiz on contact for now.
- **Fix `enemy_spawner.dart`'s distance math.** It accumulates
  `distanceTraveled += PlayerComponent.forwardSpeed * dt` — a compile-time constant, not the
  player's real movement. The moment speed becomes player-controlled this desyncs: standing
  still still "travels" and spawns content, and backtracking re-triggers spawns. Drive it from
  the player's actual furthest-right `worldX` instead, so spawning tracks real progress and
  never repeats on a backtrack. V2 missed this file entirely until the codebase audit.
- **Playtest on a real phone before continuing.**

### Phase 2 — Combat and Kaalaman (4-5 days)
- Attack hitbox with slash-arc overlay, cooldown, charge cost.
- Kaalaman charge model + HUD orbs.
- Walker and Heavy behaviours (skip Chaser).
- Enemy HP, Flame-effect death sequence, coin drops.
- Contact damage: knockback + invincibility frames.
- Enemies no longer open the quiz.
- **Define level-end, because this phase removes the current rule.** `checkLevelEnd()` today
  means "all enemies spawned and dead" — which stops being meaningful the moment enemies can
  be dodged instead of fought. Replace it now with a **distance goal**: each level carries a
  `lengthUnits` value and ends when the player's `worldX` reaches it. This is the interim rule
  for Phases 2-3, and it forward-migrates cleanly to Tiled's `exit` object in Phase 4. Without
  it, a level implemented exactly as written will either never end or end instantly, and
  neither `flutter analyze` nor the acceptance criteria will catch it.

### Phase 3 — Artifacts, gates, quiz rework (4-5 days)
- Artifact component (interact → question → claim → charges).
- Gate component using era wall art.
- Rework the question overlay: retry on wrong, no HP cost, charge reward, reduced reward on retry.
- Keep the explanation panel behaviour exactly as it is.
- **Rework `QuestionBank` from a list into a pool.** It currently returns one flat,
  pre-shuffled, exact-size list per level. The re-roll design needs "serve one unused question
  from this level's pool" and "serve a different one on retry" — different semantics, not a
  parameter change. Track what has been served within an attempt, and define the fallback when
  the pool is exhausted mid-level (recycle with a flag, rather than repeating silently),
  because today's five-question levels will hit that constantly until the bank is filled out.
- Codex screen on the Profile tab.

> **At the end of Phase 3 you have the new game.** If the deadline arrives here, you can
> demo and defend what you have.

### Phase 4 — Tiled levels (1 week engineering + ongoing content)
- Add `flame_tiled`, set up the tileset in Tiled.
- Object-layer loader per the Section 11 convention.
- Retire the runtime spawner.
- Re-implement one-way platforms — re-point the hand-written `velocityY >= 0` AABB check at
  Tiled-sourced platform objects (Section 11, caveat 2). Highest-risk item in the phase.
- Fix culling for a player who can walk backwards.
- **Gap respawn anchors.** `respawn()` today resets to the single global `game.groundY`
  constant with no notion of "the last ground stood on". Tiled geometry has ground at varying
  heights, so this needs a tracked anchor updated as the player crosses solid ground.
- `gap_component.dart`'s `GroundSpawner` lays one 1,000,000-wide ground section with an empty
  `update()`. It is dead code that Tiled replaces entirely — delete it rather than porting it.
- **Generator script for first-draft levels.** Once the loader and schema above are real,
  write a script that emits a valid first-draft `.tmx` for all 43 levels per Section 11's
  "Auto-generating first drafts" rules. This is what the phase actually delivers content-wise
  — not one reference map, 43 playable drafts.
- **Then review and hand-build.** You review/adjust all 43 generated drafts, and hand-build
  the 6 era-openers and 6 bosses (12 levels) from scratch. Content work, not engineering —
  see risks — but smaller than building 43 from a blank canvas.

### Phase 5 — Boss (2-3 days for the simple version)
- Countdown bar, 6 questions, minions between questions, Time Freeze wired to the timer.
- The full three-phase version is a later upgrade, not part of this estimate.

### Phase 6 — Economy and polish (3-4 days)
- Coins spendable; enforce character unlock costs; power-up purchasing.
- Call the existing power-up sync endpoint.
- Make level select read fresh backend progress rather than only the local cache.

### Codebase notes

- `chrono_game.dart` is **298 lines — under the ~300 budget**, not over it. (An earlier draft
  of this document and the project's own handoff notes both said otherwise; a direct read of
  the file settles it.) The refactor is still worth doing at the start of Phase 1 because
  Phases 1-2 add input, combat and collision to that file — but do it as headroom for new
  work, not as remediation, and don't let it expand into a larger rewrite than the new code
  requires.
- Platform tile constants in `tile_platform_component.dart` are pixel-verified. Leave them
  alone until the Tiled path in Phase 4 proves out, then retire the file deliberately.
- Jump physics (gravity 900, force -480, peak ~128) and platform heights (90-110) are tuned
  against each other.
- Dev no-login mode (`DEV_SKIP_AUTH`, `DEV_START_ROUTE`) will save hours during Phases 1-3.

---

## 15. Working with Claude Code

This document is a **design** spec — it says what to build and why. Claude Code executes far
better against an **implementation** spec, so this section converts it into one.

### Ground rules

1. **One phase per session.** Do not paste this whole document and ask for "the redesign".
   A 500-line spec as a single prompt produces a shallow sweep across everything and leaves
   the game broken in six places at once, in a codebase where you can't tell which change
   broke what.
2. **Branch per phase.** `git checkout -b v2-phase-2` before starting, commit when the phase
   passes its acceptance criteria. When a phase goes sideways you want a working previous
   phase one command away.
3. **Update `HANDOFF.md` at the end of every phase** — dated entry, newest first, as you
   already do. Include what was built, what was deferred, and what needs playtesting.
4. **Protected values.** Tell it explicitly, every session: do not change gravity (900), jump
   force (-480), or platform heights (90-110) unless the task is specifically to re-tune them.
   These are verified-correct and easy for a well-meaning refactor to "clean up".
5. **Run `flutter analyze` before claiming done.** Clean analyze is a floor, not a finish line.

### Task M — run before any implementation

**Status: run on 2026-09-24.** Its findings are folded into this revision — the four factual
corrections, Phase 0.5, and the added items in Phases 0-4 all come from it. Re-run it if the
codebase moves substantially, but you do not need to run it again to start Phase 0.

Kept here for reference and for re-runs. It is read-only; **if a session starts editing files
during it, stop the session** — that means the instruction was ignored.

> Read `GAMEPLAY.md` and `GAMEPLAY-V2.md` in full — Section 1 defines the six-era curriculum
> structure and overrides any five-era assumption elsewhere in the codebase — then read the
> code under `lib/`. Do not write any implementation code yet.
>
> Produce a file-level implementation map for the V2 design: for each phase, list the exact
> files that need to be created, modified or deleted, and what changes in each. Then list
> every place where the V2 design conflicts with how the code actually works, is ambiguous,
> or makes an assumption that turns out to be wrong. Be specific and cite file paths and line
> numbers. Finish with the three things you think are most likely to go wrong.

The V2 document was written without repository access, so it names areas rather than
filenames. This task is what grounds it. Expect it to find real conflicts — that is the point.

### Phase prompts and acceptance criteria

Each phase: give it the prompt, let it work, then check the criteria yourself on a device.

---

**Phase 0 — Free wins**

> Implement Phase 0 of `GAMEPLAY-V2.md`: audio service, per-era parallax tint (six eras, see
> Section 1), and the unified 5-heart pool from Section 8 (revert the Energy rename if it
> already shipped; one heart icon everywhere, 1-minute regen, one shared pool instead of
> in-level HP + persistent Energy). Use `flame_audio`. Note that the bundled sound files are
> currently silent placeholders, so wire the service and verify it against one real test file
> rather than assuming silence means success. Do not touch gameplay logic, physics values, or
> the tile constants.

*Done when:* the audio service calls `flame_audio` instead of no-ops, proven by one real test
file actually playing (the rest stay silent until real files land); all six
eras look visibly different in colour; menu screens and in-game HUD show the **same** heart
icon and the **same** count (no separate Energy meter); losing a heart in a level is reflected
immediately on the menu screens; a level starts with up to 5 hearts and the tutorial copy
agrees; the
level-complete screen shows the score you actually earned; Hive keys are unchanged;
`flutter analyze` clean.

*Then you:* play one level in each era and confirm the tints actually read as different.

---

**Phase 0.5 — Era/level registry** *(prerequisite — do not skip)*

> Implement Phase 0.5 of `GAMEPLAY-V2.md`. Create a `Level` data model and a single era/level
> registry defining the six eras from Section 1 with their variable level counts
> (10/5/6/8/8/5) and `curriculum` blocks. Then replace every hardcoded five-era list and every
> `level == 10` boss check across the codebase with reads from that registry — the file list
> in Phase 0.5 is the starting point, but grep for others rather than trusting it.
> `isLevelUnlocked` must become list-length-driven, not "9 prior levels".
>
> Add no gameplay behaviour in this phase. When it is done the game must play exactly as it
> did before, with era 1 having 10 levels and its boss on level 10 — the difference is that
> those numbers now come from data instead of literals.

*Done when:* `grep` finds no remaining `== 10` boss checks or five-element era literals; all
six eras appear in era selection; each era shows its own level count; `isLevelUnlocked` works
for a 5-level era; the game still plays identically to before; `flutter analyze` clean.

*Then you:* open each era in the level-select screen and confirm the counts match Section 1.
This is the phase where a missed hardcoded site hides quietly — check all six.

---

**Phase 1 — Player control**

> Implement Phase 1 of `GAMEPLAY-V2.md`. Start by refactoring `chrono_game.dart` into
> separate files for input, camera, spawning and collision — that refactor is part of this
> task. Then add Flame's `JoystickComponent` and two `HudButtonComponent`s (jump, attack),
> unlock the player's X position, and switch the camera to follow the player.
> The attack button should do nothing yet. Everything currently working must keep working:
> enemies still open the quiz on contact for now. Do not change gravity, jump force, or
> platform heights.

*Done when:* you can walk left and right, the camera follows, the character faces the
direction of travel, jump still clears the same gaps, `chrono_game.dart` is under ~300 lines,
`flutter analyze` clean.

*Then you:* **play it on a real phone for ten minutes.** This is the most important
playtest in the project. If the controls feel bad, fix that before Phase 2 — everything else
is built on top of them.

---

**Phase 2 — Combat and Kaalaman**

> Implement Phase 2 of `GAMEPLAY-V2.md`: attack hitbox with a slash-arc overlay sprite, the
> Kaalaman charge system with HUD orbs, Walker and Heavy enemy behaviours, enemy HP, the
> Flame effect-sequence death animation, coin drops, and contact damage with knockback and
> invincibility frames. Skip the Chaser behaviour entirely. Enemies must no longer open the
> quiz — for this phase, grant charges with a debug key so combat can be tested in isolation.
> Replace `checkLevelEnd()`'s "all enemies dead" rule with the distance goal described in the
> Phase 2 plan, since enemies no longer gate progress.
> Put all tuning numbers (charge cost, cap, patrol range, knockback, i-frame duration) in one
> clearly named constants file so they can be adjusted without hunting.

*Done when:* attacking costs a charge and kills a Walker in one hit / Heavy in two; enemies
patrol and turn; touching one costs 1 HP with knockback and a flashing invincibility window;
dying enemies flash, fade and drop coins; **a level ends on the distance goal and can be
finished without killing a single enemy**; all tuning values live in one file;
`flutter analyze` clean.

*Then you:* play and **write down which numbers feel wrong.** Expect to adjust most of them.
That constants file is why the prompt asks for it.

> **Status, 2026-09-30:** implemented on `v2-phase-1`, **uncommitted**, awaiting the
> on-device playtest this prompt's "then you" step describes. Every acceptance criterion above
> is met and 172 tests pass; the combat loop was additionally driven end-to-end in a real
> browser (charge spend, visible hitbox, an enemy killed and dropping 2 coins, contact damage
> costing a heart). See Sections 4 and 5's corrections for the deviations, and `HANDOFF.md`'s
> 2026-09-30 entry for the full file-by-file record — including the Flame effect-lifecycle
> traps the death-sequence test hit, which are worth reading before touching that test.
>
> **Scaffolding to delete in Phase 3, all together:** the `K` debug charge key,
> `CombatConstants.debugGrantAmount`, the temporary `kaalamanStart = 3`, and the
> `KeyboardEvents` mixin on `ChronoGame`. They exist only because artifacts — the real charge
> source — arrive in Phase 3.

---

**Phase 3 — Artifacts, gates, quiz rework**

> Implement Phase 3 of `GAMEPLAY-V2.md`: the artifact answer-point component using the unused
> `artifact_*.png` assets, the gate component using the era wall art, the reworked question
> flow (wrong answer costs no HP, shows the explanation panel exactly as it does now, then
> re-lights after 5s with a different question at a reduced charge reward), and the Codex
> screen on the Profile tab. Remove the debug charge key from Phase 2. Keep the quiz result
> POST payload and the star calculation exactly as they are.

*Done when:* artifacts open questions and grant charges; a wrong answer loses no HP and the
artifact re-serves a **genuinely different** question; no question repeats within one attempt
until the pool is exhausted; gates block passage until answered correctly; claimed artifacts
appear in the Codex with their explanation text; the backend still receives the same payload
shape; `flutter analyze` clean.

*Then you:* play a full level start to finish. **This is the first time the actual V2 game
exists** — judge whether the core loop is fun, not just whether it works.

> **Status, 2026-09-30:** implemented and committed on `v2-phase-1` (`43cc237`), awaiting the
> full-level playtest above. Every acceptance criterion is met and 206 tests pass; the loop
> was driven in a browser far enough to confirm an artifact opens a real question with the
> timer and power-ups intact, and that level 1 starts with exactly the one tutorial freebie
> charge. Phase 2's debug scaffolding (the `K` key, `KeyboardEvents` mixin,
> `debugGrantCharges`, `debugGrantAmount`) is gone and `kaalamanStart` is back to Section 4's
> 0.
>
> **One deliberate deviation, agreed with the user:** the star/percentage calculation now
> scores the **best attempt per distinct question** rather than every recorded attempt. The
> prompt above says to keep that calculation as-is, but Section 6's retry loop and Section
> 12's "log every attempt" requirement combine to make a student who answers everything
> correctly on the *second* try score 50% and one star — punishing exactly the learning the
> explanation panel exists to produce. `answers` and the POST payload are untouched; only the
> two derived numbers changed, and both halves are pinned by tests.
>
> **Two follow-ups, neither blocking:** artifacts render small and dim next to the coins (the
> per-era tint in Section 10 is tuned for washing a full background, not a 56px sprite), and
> each non-boss level needs **10-15 authored questions to stop recycling** — it has 5, and
> `nationalism` still has no question file at all. That is a content task, not a code one;
> `QuestionPool` already handles any pool size and reports when it recycles.

---

**Phase 4 — Tiled levels**

> Implement Phase 4 of `GAMEPLAY-V2.md`: add `flame_tiled`, set up `ground_tileset.png` as a
> Tiled tileset, and write the level loader that reads the `entities` object layer per the
> convention in Section 11. Retire the runtime spawner. Re-implement one-way platform
> pass-through under the new system, fix off-screen culling so objects behind a backtracking
> player are not destroyed, and add gap respawn anchors. Level config must include the
> `curriculum` block defined in Section 1.
>
> Then, against that real loader and schema (not a guess at them beforehand), write a
> generator script that produces a first-draft `.tmx` for **all 43 levels** per Section 11's
> "Auto-generating first drafts" rules: ground with era/level-appropriate gaps, enemies
> spaced and mixed by difficulty ramp, artifacts and gates at the Section 6/7 cadence,
> platforms only at valid heights (90-110 — do not violate the tuned jump arc), and each
> level's `curriculum` block and question-pool link pre-filled from Section 1. Every generated
> level must load and be completable start to finish with no softlocks. Document the
> generator and the authoring workflow in `HANDOFF.md`.

*Done when:* the loader plays a hand-built reference level correctly (platforms still
one-way, walking backwards doesn't delete the level, falling in a gap costs 1 HP and respawns
on the last solid ground, the spawner is gone); the generator script runs and emits all 43
`.tmx` files; every generated level loads without error and can be finished without a
softlock or an unfair jump; each carries its correct `curriculum` block.

*Then you:* **review and hand-build, not build from scratch.** Review and adjust the 31
generated levels for feel and pacing, and hand-build **the first level of each of the 6 eras
and all 6 boss levels** (12 total) yourself, on purpose rather than by rule — those are the
levels that set the tone and are worth getting right by hand. This is still real work and
still yours, but it's review-and-adjust for most of it instead of a blank canvas 43 times.

---

**Phase 5 — Boss**

> Implement the simple boss version from Section 7 of `GAMEPLAY-V2.md`: a 15-second countdown
> bar on boss questions, 6 questions instead of 12, minions spawning between questions that
> drop Kaalaman charges, and the Time Freeze power-up wired to pause the countdown. Do not
> build the three-phase version.

*Done when:* the countdown runs and a timeout behaves like a wrong answer; six questions
defeat the boss; minions spawn and drop charges; Time Freeze pauses the timer and is consumed.

---

**Phase 6 — Economy**

> Implement Phase 6 of `GAMEPLAY-V2.md`: make coins a spendable currency, enforce the
> existing character unlock costs, add power-up purchasing on the Profile screen, call the
> existing power-up sync backend endpoint, and make level select read fresh backend progress
> with the local cache as fallback.

*Done when:* coins accumulate and spend; locked characters cannot be selected without paying;
power-ups can be bought; power-up counts survive a reinstall; level select reflects
server-side progress.

### What Claude Code cannot do

Plan your own time around these — nobody else is doing them.

- **Playtesting and game feel.** It cannot tell whether the jump clears the gap fairly or
  whether the controls are comfortable with your thumbs. Roughly half this design is numbers
  that only reveal themselves in play.
- **Level design judgment.** It can generate mechanically-valid first-draft `.tmx` files for
  all 43 levels (Section 11, Phase 4) — playable, fair, no softlocks — but it cannot look at
  a level and judge whether an enemy placement creates an interesting decision, or whether a
  draft is actually fun. That review, and the 12 hand-built levels, stay yours.
- **Art.** The 5 idle sprites, and sourcing the Kenney packs.
- **Seeing the screen.** A clean `flutter analyze` does not mean the artifact isn't spawning
  inside a wall.
- **Deciding what to cut.** When the deadline tightens, that call is yours.

---

## 16. Risks and honest caveats

**Level authoring is still a real cost, just a smaller one.** Phase 4's generator (Section 11)
removes the blank-canvas problem — every level starts as a playable draft — but reviewing and
tuning 31 drafts plus hand-building 12 levels (6 era-openers, 6 bosses) is still real content
work that no tool removes entirely. If the deadline tightens, **cut eras rather than
quality** — three well-built eras beat six procedurally-mush ones. Cut from the end (Eras 5
and 6) so each grade keeps a coherent opening sequence, and say in the paper that the
remaining eras are authored but unpopulated.

**Question bank depth is the hard bottleneck.** Levels currently have only 5 questions each.
V2 makes this worse, not better: gates and artifacts re-roll on a wrong answer, so a level
consumes more questions per run than before. **You need 10-12 minimum per level**, and at 43
levels that is roughly **450-500 questions**, each tied to a specific BOW competency.

This is the single largest piece of work in the project and it depends on no code whatsoever.
Start it now, in parallel with every phase below, and staff it with whoever is not writing
Dart. If the deadline forces a cut, cut eras (above) — never the question count per level,
because thin pools make the re-roll mechanic repeat questions within one playthrough.

**Enemies have only 2 animation frames.** In V2 they move and patrol, so they're on screen
longer and under more scrutiny. They will look stiff. Survivable for a thesis build, but it's
where the seams show first.

**Mobile controls are the biggest unknown.** A joystick plus two buttons on a phone, driving
a character that has to clear gaps precisely, is harder to get right than it sounds.
Prototype in Phase 1 and be willing to simplify.

**Tiled migration has a sharp edge.** Retiring the verified-correct tile constants and
re-implementing the hand-rolled one-way platform check are both places where something that
currently works can break. Keep the old code path until the new one is proven.

**The five-era assumption is spread across ~18 files, not centralised.** Phase 0.5 exists to
fix this. If it is skipped or done partially, a later session will "add the two new eras" by
extending a couple of switch statements and ship a build where boss fights still only fire on
level 10, four screens still read "/10", and the enemy-set switch inside Eras 4 and 5 never
happens — each of those is an independent hardcoded site, and none of them fails a build.

**Two pacing rules silently depend on assumptions that later phases delete.** The spawner's
distance math assumes constant forward speed (Phase 1 breaks it) and level-end assumes enemies
gate progress (Phase 2 breaks it). Both are now specified in their phases. Neither would be
caught by `flutter analyze` or by unit tests — only by playing the level.

---

## 17. Does this stay clearly educational?

Yes, and arguably more so than the current build.

- **Questions are required to progress.** Three gates per level cannot be skipped.
- **Questions are rewarded, not punished.** Answering correctly gives you power. Under the
  current design, answering correctly gives you permission to keep walking — and answering
  wrongly costs a life, which teaches students to fear questions.
- **Wrong answers can't dead-end a student.** Explanation, then retry. Nobody gets locked out
  over a fact they haven't learned yet.
- **The Codex is a visible record of learning** — collected history with explanations
  attached, viewable outside of gameplay.
- **Assessment data is unchanged.** Same POST payload, same accuracy-based stars, same
  dashboard.
- **Every level is mapped to a named DepEd competency** from the current three-term Budget of
  Work (Section 1), so the game can be assigned alongside classroom teaching rather than
  running parallel to it.

The mechanics now serve the learning outcome instead of interrupting it.

---

## Appendix A — Reference links

- Tiled editor — https://www.mapeditor.org/
- `flame_tiled` — https://pub.dev/packages/flame_tiled
- Flame Tiled docs — https://docs.flame-engine.org/latest/bridge_packages/flame_tiled/tiled.html
- Flame input components — https://docs.flame-engine.org/latest/flame/inputs/other_inputs.html
- `JoystickComponent` API — https://pub.dev/documentation/flame/latest/input/JoystickComponent-class.html
- Kenney CC0 asset packs — https://kenney.nl/assets

**Curriculum**

- MATATAG Araling Panlipunan CG 2023 (Grades 4-10) — https://www.academ-e.ph/wp-content/uploads/2023/09/Araling-Panlipunan-CG-2023.pdf
- DepEd MATATAG Curriculum (official) — https://www.deped.gov.ph/matatag-curriculum
- Three-term school calendar SY 2026-2027 (explainer) — https://www.gmanetwork.com/news/topstories/nation/984622/explainer-deped-school-calendar-sy/story/
- Grade 5 Three-Term Budget of Work SY 2026-2027 — https://depedclub.com/grade-5-budget-of-work-bow-term-1-3-matatag-three-term-sy-2026-2027/
- Primary source for Section 1: `G5_BOW_AP_5_-_Three-Term_v2.pdf`, `G6_BOW_AP_6_-_Three-Term_V2.pdf` (DepEd, 29 June 2026), thesis Appendix D

## Appendix B — Two counting errors in `GAMEPLAY.md`

Found while cross-checking this design against the asset list. Worth fixing in that doc:

- **Enemies:** section 14 says "9 enemy types × 2 frames each (18 files)" but then lists **10**
  types (tribal_warrior, dark_spirit, spanish_soldier, tax_collector, american_soldier,
  propaganda, japanese_soldier, tank, corruption_figure, misinfo_cloud) — 20 files. This
  document assumes 10. Verify against the actual folder.
- **Sounds:** the same section says "17 files" but lists **18** (5 BGM + 13 SFX).

---

*Revision 7, 2026-09-26. Written against `GAMEPLAY.md` (current implementation) and the
bundled asset list. Revision 1 hand-rolled the controls, level format and effects; this
revision replaces all three with existing components and adds Sections 1 and 15. Section 1
supersedes the earlier five-era structure and is derived from the DepEd three-term Budget of
Work, not from the four-quarter curriculum guide. Revision 4 corrects four claims that a
codebase read disproved (the `chrono_game.dart` line budget, how much of the camera work
remains, the mechanism behind one-way platforms, and the scope of the hearts rename), adds
Phase 0.5, and specifies the level-end rule, question-pool API and spawner fix that earlier
revisions left as gaps between phases.*
