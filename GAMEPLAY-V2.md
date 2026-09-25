# ChronoQuest — Gameplay V2 Design ("Knowledge is your weapon")

Status: **design proposal**, not yet implemented. Revision 4 — six-era curriculum structure
from the DepEd three-term Budget of Work, built around off-the-shelf components, corrected
against a full read of the codebase (Task M, 2026-09-24).
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
| 3 | 6 |
| 4 | 8 |
| 5 | 8 |
| 6 | 5 |
| **Total** | **42** |

Every level therefore maps to one named competency and is defensible as "this level teaches
this." Do not normalise these to a uniform 10.

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

Gravity `900`, jump force `-480`, peak ~128 units. Platform spawn heights (60-105) were
tuned against that number and are verified correct. **Do not disturb either.** If one
changes, the other must be re-tuned.

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

**Hazards** stay as they are conceptually (crates, era walls as scenery obstacles, gaps) but
now do `-1 HP` with knockback instead of the old life loss.

**Falling in a gap:** -1 HP and respawn at the last ground segment you were standing on. The
existing `playerFellInGap` logic covers most of this; it needs a respawn anchor instead of a
straight vertical reset.

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

## 8. Lives, HP, and Energy — untangling the two systems

Right now two unrelated systems share the same heart icon, which is confusing for everyone
including the developers.

**In-level HP** — the action-layer resource.
- Starts at **5**, not 10. Ten hits is so much buffer that nothing feels dangerous.
- Lost to: enemy contact, crates/walls, falling in a gap.
- **No longer lost to wrong answers.**
- Hits 0: level failed.
- UI: keeps the `heart_full` / `heart_empty` icons, shown in-game only.

**Persistent Energy** — the "can I start a level" gate, formerly "persistent hearts".
- Rename it to **Energy** and give it a **different icon**. A Flutter `Icons.bolt` or a
  Kenney UI Pack icon does the job — no custom art needed.
- Everything else stays: max 5, one consumed on a failed level, 10-minute real-time regen,
  regenerates while the app is closed.
- UI: shown on menu screens only, never during gameplay.

Two names, two icons, two places they appear. The confusion disappears.

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
component, roughly one line per era. (Verified: `ParallaxComponent` extends `PositionComponent`,
which carries a built-in `decorator` property, so `component.decorator = PaintDecorator.tint(color)`
works directly. Use a **semi-transparent** colour — e.g. `Color(0x66C9A227)` — so detail stays
visible through the tint.)

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
world units, coins and crates on timers. The only authored per-level data is the question
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
| `crate` | — | A hazard |
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
| `crate.png`, `ground_tileset.png` | Now driven through Tiled |
| Parallax forest layers | Reused with a per-era `PaintDecorator.tint()` |
| `fireworks.json` | Boss defeat / era complete |

### Free, off-the-shelf (CC0 — no attribution required)

| Need | Source |
|---|---|
| Joystick, jump/attack buttons | [Kenney Onscreen Controls](https://kenney.nl/assets) |
| Energy icon, HUD frames | Kenney UI Pack, or a Flutter `Icons.bolt` |
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
- Rename persistent hearts → **Energy**, give it its own icon. **UI surface only** — change
  the label and icon on the menu screens. Do **not** rename `HeartsState`, the provider fields,
  or the Hive storage keys: those keys hold users' real regen state and renaming them silently
  resets it on upgrade. Two names and two icons is a presentation change.
- Drop in-level HP from 10 to 5 — and update the tutorial copy string that says
  "May 10 buhay ka bawat antas", which will otherwise contradict the game.
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
- **Then author levels.** 42 of them, per the Section 1 counts. This is content work, not
  engineering — see risks.

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
- Jump physics (gravity 900, force -480, peak ~128) and platform heights (60-105) are tuned
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
   force (-480), or platform heights (60-105) unless the task is specifically to re-tune them.
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
> Section 1), Energy rename, HP 5. Use `flame_audio`. Note that the bundled sound files are
> currently silent placeholders, so wire the service and verify it against one real test file
> rather than assuming silence means success. Do not touch gameplay logic, physics values, or
> the tile constants.

*Done when:* the audio service calls `flame_audio` instead of no-ops, proven by one real test
file actually playing (the rest stay silent until real files land); all six
eras look visibly different in colour; the menu Energy meter uses a non-heart icon and the
in-game HP row still uses hearts; a level starts with 5 HP and the tutorial copy agrees; the
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

---

**Phase 4 — Tiled levels**

> Implement Phase 4 of `GAMEPLAY-V2.md`: add `flame_tiled`, set up `ground_tileset.png` as a
> Tiled tileset, and write the level loader that reads the `entities` object layer per the
> convention in Section 11. Retire the runtime spawner. Re-implement one-way platform
> pass-through under the new system, fix off-screen culling so objects behind a backtracking
> player are not destroyed, and add gap respawn anchors. Build one complete example `.tmx`
> level for Era 2 (Pananakop ng Espanya) as a reference, and document the authoring workflow
> in `HANDOFF.md`. Level config must include the `curriculum` block defined in Section 1.

*Done when:* the example level loads from `.tmx` and plays correctly; platforms are still
one-way; walking backwards doesn't delete the level; falling in a gap costs 1 HP and respawns
on the last solid ground; the spawner is gone.

*Then you:* **author the levels.** Claude Code can build the loader and a reference map, but
level design is judgment work done by eye in the editor. This is your job and it is the
largest remaining task in the project.

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
- **Level design.** It can generate `.tmx` XML; it cannot look at a level and judge whether
  an enemy placement creates an interesting decision.
- **Art.** The 5 idle sprites, and sourcing the Kenney packs.
- **Seeing the screen.** A clean `flutter analyze` does not mean the artifact isn't spawning
  inside a wall.
- **Deciding what to cut.** When the deadline tightens, that call is yours.

---

## 16. Risks and honest caveats

**Level authoring is still the real cost.** Tiled makes it dramatically faster than
hand-writing JSON, but designing 42 levels is content work that no tool removes. If the
deadline tightens, **cut eras rather than quality** — three well-built eras beat six
procedurally-mush ones. Cut from the end (Eras 5 and 6) so each grade keeps a coherent
opening sequence, and say in the paper that the remaining eras are authored but unpopulated.

**Question bank depth is the hard bottleneck.** Levels currently have only 5 questions each.
V2 makes this worse, not better: gates and artifacts re-roll on a wrong answer, so a level
consumes more questions per run than before. **You need 10-12 minimum per level**, and at 42
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

*Revision 4, 2026-09-24. Written against `GAMEPLAY.md` (current implementation) and the
bundled asset list. Revision 1 hand-rolled the controls, level format and effects; this
revision replaces all three with existing components and adds Sections 1 and 15. Section 1
supersedes the earlier five-era structure and is derived from the DepEd three-term Budget of
Work, not from the four-quarter curriculum guide. Revision 4 corrects four claims that a
codebase read disproved (the `chrono_game.dart` line budget, how much of the camera work
remains, the mechanism behind one-way platforms, and the scope of the hearts rename), adds
Phase 0.5, and specifies the level-end rule, question-pool API and spawner fix that earlier
revisions left as gaps between phases.*
