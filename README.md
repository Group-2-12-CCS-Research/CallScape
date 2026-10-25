# CallScape — A Gamified Escape Room Review (Grade 11 Contact Center Services)

A playable, top-down pixel-art exploration game for **Grade 11 Contact Center Services (CCS)**
students of **Emilio Jacinto National High School**.

Players walk around the CCS training floor, read the **CCS Operations Manual**, inspect
terminals, collect review cards, answer typed-answer questions, and unlock the floor exit.
It is an exploration game first — there is no dashboard, no quiz list, and no account wall.

**Review scope: the four quarters of the CCS subject.**

| Quarter | Topic covered in the game |
|---|---|
| Q1 · Operations | BPO industry history and economic role, PECs, jargons and metrics (AHT, CSAT, FCR, AUX, bio break), technology and tools (CRM, ACD, IVR, headsets, UPS), career paths, data privacy (RA 10173 / PCI DSS), workforce basics (shrinkage, occupancy, adherence) |
| Q2 · Communication | communication process and active listening, verbal/non-verbal cues, paralanguage and voice control, accent neutralization, cultural variables and time zones, rapport and empathy, telephone etiquette and call control, floor idioms |
| Q3 · Calls | inbound/outbound/blended call flow, product knowledge and USP, probing and questioning, de-escalation, after-sales documentation, dynamic call types, honest up/cross-selling, difficult-customer types, escalation and handoffs |
| Q4 · Non-voice | email etiquette, live chat and macros, back-end/administrative support, omnichannel service delivery, chat concurrency, social media replies, back-office quality standards |
| Glossary | every role, metric, system, code and floor idiom in one A-to-Z chapter |

Built with **HTML5 + CSS3 + vanilla JavaScript only** (no frameworks, no game engine, no
build step, no external assets). The C#/ASP.NET Core backend is **planned, not implemented**
(see [Phase 6](#phase-6--backend-status)).

**v2.0 — the immersion pass (current build).** Everything from v1.5 still works exactly as it
did; this release is additive:

* **Robi**, an animated pixel-art companion robot that hovers behind the player, blinks, waves,
  cheers a correct answer, slumps on a miss and talks in a pixel speech bubble with hints and
  encouragement.
* **XP, levels, coins, answer streaks and 8 achievements** — awarded only when something is
  really completed (a correct answer, a review card, an opened door, a cleared room).
* **A live objective checklist** in the mission panel (condensed on phones), a level/XP/wallet
  strip in the HUD and a progress recap inside the pause menu.
* **Ambience**: drifting dust motes, spark bursts on rewards, a pulsing gold bracket around the
  object you are standing next to, and warm light spilling out of the doorway once it is open.
* **Feedback**: the dialogue window glows green/gold on a correct answer and nudges on a wrong
  one, floating `+XP` / `+◎` numbers, a level-up burst and achievement pop-ups.

See [Companion, rewards and effects](#companion-rewards-and-effects-v20) for the internals.

---

## 1. Quick start

**Option A — just open it**

```
Double-click callscape/index.html
```

The game runs entirely offline; `index.html` works straight from the filesystem
(`file://`) because everything is a classic script with no imports or fetches.

**Option B — local web server (recommended for phones on the same Wi-Fi)**

```bash
cd callscape
python3 -m http.server 8080
# then open http://localhost:8080
```

To play on a phone, use `http://<your-computer-ip>:8080` from a device on the same network.

**Option C — VS Code**: install *Live Server*, right-click `index.html` → *Open with Live Server*.

No install step, no npm, no build. That is deliberate: it must run on school lab machines.

The game opens on the **main menu**, showing whether an offline save exists on that device.

### First launch — "Where are you playing?"

Before the main menu appears, the game asks one question:

```
WHERE ARE YOU PLAYING?
  [ COMPUTER ]  Desktop or laptop · WASD / arrows + E
  [ PHONE    ]  Android or iPhone · joystick + tap buttons
```

The answer is stored in the settings record on that device (`callscape.settings.v1.device`)
and it controls:

* whether the on-screen **joystick** is shown (Computer hides it, Phone shows it),
* whether prompts read **`E`** or **`TAP`**,
* the body classes `device-pc` / `device-phone` that pick the responsive layout rules.

It can be changed at any time in **Settings → Playing on**, which re-applies everything live.
A tablet should choose **Phone**; a touchscreen laptop should choose **Computer** so the
keyboard remains the primary control.

---

---

## 2. Rooms

The game has **two rooms**, connected by a door. Both are single-screen, fully
pre-rendered, and use the same engine (collision, camera, sitting, bots, handbook).

| Room | Size | Role |
|---|---|---|
| **CCS Training Floor** (`lab`) | 26 × 18 tiles | The main escape room — 8 stations, the three review cards, the locked exit |
| **Mock Call Bay** (`bay`) | 20 × 14 tiles | Optional practice annex — 6 extra questions, one bonus card, no exit gate |

### Getting between them

A **MOCK CALL BAY** doorway sits in the top wall of the training floor (between the
whiteboard and the window, next to the clock). Walk up to it and press `E`. You arrive in
the bay beside its own **TRAINING FLOOR** doorway, which takes you back the same way. Neither
doorway is locked, and neither affects the escape puzzle.

```
Training floor ──[ MOCK CALL BAY door, top wall ]──▶ Mock Call Bay
Mock Call Bay ──[ TRAINING FLOOR door, right wall ]──▶ Training floor
```

### What the Mock Call Bay contains

| Object | Sits | Teaches |
|---|---|---|
| **Practice Booth A** (agent: Nico) | chair, south side | asking permission before hold, signposting the steps |
| **Practice Booth B** (agent: Tess) | chair, south side | the "ballpark figure" idiom, escalating above your limit |
| **QA Scorecard Board** | top wall | warm vs cold transfer, first-time-right in the back office |
| **Coaching Table + Call-Flow Sheet** | floor centre | the inbound 7-step and outbound 6-step flows |
| **Bay Reference Shelf** | top-left | opens the handbook at Quarter 3 |

Six questions (`q_permission`, `q_signpost`, `q_ballpark`, `q_escalate`, `q_warm`, `q_ftr`)
are asked across the two booths and the QA board. Answer all six and the **Mock Call Bay
Bonus Card** (`bayCard`) is added to the clue journal. The bonus card is **extra credit**: the
three cards the exit panel demands are unchanged, so a student can finish the game without
ever entering the bay.

The completion screen now carries a fifth statistic — `MOCK CALL BAY 6 / 6 ★` — alongside
Time, Clues, Questions and Accuracy. Questions count against all 14 in `questions.js`.

---

## 3. Controls

| Action | Desktop | Mobile / touch |
|---|---|---|
| Move | `W` `A` `S` `D` or arrow keys | Hold / drag the joystick (lower-left) |
| Interact / inspect | `E` or `Enter` | Tap the gold **Interact** button (lower-right) |
| Sit at a desk | `E` while standing at a chair | **Sit down** button |
| Stand up | `Space` (or `X`) | **Stand** button |
| Use the PC while seated | `E` | **Use PC** button |
| Advance dialogue | `E`, `Space`, `Enter` or **Continue** | Tap **Continue** |
| Submit an answer | `Enter` in the answer box | Tap **Submit** |
| Pause | `Esc` or the ❚❚ button | ❚❚ button |
| Handbook | `B`, the ▤ button, or the bookshelf | ▤ button or the bookshelf |
| Clue journal | Pause → *Journal*, or the ◈ button | ◈ button |
| Back / close overlay | `Esc` | ✕ / *Back* |

Movement is 8-directional. Diagonals are normalised, so diagonal walking is never faster.
The character faces the direction of travel and has idle / walking animations.

---

## 4. What is in the game

**Main menu (the entry point)**

* *Resume offline save* — greyed out with the reason when there is no save.
* *New game* — wipes the old save and starts from the spawn point.
* *Handbook* — the four-quarter operations manual can be read before entering the floor.
* *Settings* — preferences, kept separately from progress.
* A save summary card: room, clues, questions answered, elapsed time, and how long ago
  it was saved.

**Settings (persist across restarts, also available from the pause menu)**

| Setting | Options | Effect |
|---|---|---|
| Sound effects | On / Off | synthesised blips |
| Review hints | On / Off | hint after the second wrong answer |
| Interaction prompt | On / Off | the floating "E — inspect" label |
| Playing on | Computer / Phone | switches keyboard vs touch controls live |
| Joystick side | Left / Right | left- or right-handed mobile play |
| Text size | Normal / Large | dialogue and handbook text |
| Offline save | Delete save | removes the record from this device |

**CCS Operations Manual (`codebook.js`)**

A six-tab handbook — **45 sections** in total — that opens from the menu, the pause menu, the
journal, the bookshelf in the room, or a link inside any question panel:

| Tab | Contents |
|---|---|
| Q1 · Operations (11) | what BPO is, how the Philippine industry grew (PEZA, IBPAP), economic role, floor roles and shifts, the 10 PECs, SWOT/market analysis, jargons and metrics with formulas, technology (CRM, ACD, IVR, headset, UPS), **career paths and promotion**, **data privacy (RA 10173, PCI DSS)**, **workforce basics (shrinkage, occupancy, adherence)** |
| Q2 · Communication (9) | communication process diagram, active listening, verbal/non-verbal cues, paralanguage (pitch/projection/pacing/tone/articulation), accent-neutralization drills, cultural variables and time zones, **rapport in the first 30 seconds**, **telephone etiquette and call control**, **floor idioms** |
| Q3 · Calls (9) | inbound 7-step and outbound 6-step flows with a full sample call, feature/benefit/USP and FAB, open vs closed probing, the 5-step de-escalation model, ticket-note documentation, **inbound / outbound / blended campaigns**, **honest up- and cross-selling**, **difficult-customer types with the LAST model**, **escalation, handoffs and call-backs** |
| Q4 · Non-voice (7) | email etiquette with a full sample email, chat transcripts with macros, back-office data entry and ticket workflows, multichannel vs omnichannel, **chat concurrency**, **social media and public replies**, **back-office first-time-right standards** |
| Glossary (4) | roles, every metric A-to-Z, systems and AUX/disposition codes, and floor slang and idioms |
| QA Wing (5) | the scorecard and fatal errors, calibration sessions, escalation ladder, data privacy in the wing, and nesting bay |

The reading experience is a real book: a leather cover that swings open, a two-page spread on
desktop with a clickable contents page, paper-turn animation between chapters, and dark ink on
warm paper so the text stays legible (see [The handbook](#the-handbook-the-in-game-book)).

Every section has a monospace block — call scripts, emails, chat logs, metric formulas or
plain notes — colour-accented by kind. Each question panel shows its quarter and matching
section (`Quarter 2` · `Q2 › Paralanguage & voice`), and if students have trouble answering a
question they can spend their earned **EXP (10 XP per step)** to unlock **Letter Hints** right
inside the quiz panel. Clicking the **Mission** panel at the top of the screen hides or shows
the mission menu details.

**The room**

One complete room — the **CCS Training Floor** (26 × 18 tiles) — with:

* a controllable pixel-art student character with idle/walk frames in 4 directions,
* working virtual joystick (pointer events + dead zone) and keyboard controls,
* a follow camera that is clamped to the room bounds and never shows the void,
* AABB collision against walls, desks, chairs, the cabinet, the door, plant and bin,
* **7 agent bots** — every desk except yours is staffed (Ana, Miguel, Joy, Rico, Bea, Paolo, Liza),
* **your own desk** — PC 01 is empty because it is the player's station; sitting there shows a
  `MY DESK` note instead of an agent's thought,
* **sitting** — walk to any chair, press `E` and your character sits down facing the screen;
  the agent there steps aside, and `Space` stands you back up,
* **agent thoughts** — while you sit with an agent a speech bubble above their head shows a
  random Contact Center Services fact, tip or industry idiom (35 lines), rotating every 9 seconds,
* **11 interactive objects** (3 quiz stations + 1 locked exit + the manual shelf),
* **3 collectible review cards** tracked in the HUD and in the clue journal,
* **8 typed-answer questions** — two per quarter — with case-insensitive,
  whitespace-tolerant validation (and unit-tolerant numeric answers for the time-zone item),
* a **locked exit door** that only opens after all clues are found *and* the final
  question is answered, then completes the game when you walk through it,
* live mission/objective text, clue counter and progress bar,
* pause, restart, hint toggle and automatic local save/resume,
* **two rooms** joined by a doorway — the training floor and the optional Mock Call Bay,
* **14 questions on the first two rooms** (8 in the main chain, 6 optional practice) plus
  **6 more in the QA & Escalation Wing** — 20 in total,
* **three rooms**: the training floor, the optional Mock Call Bay, and the unlockable
  QA & Escalation Wing (Room 2) with its own palette, NPCs, relics and chapter of the handbook,
* responsive layouts for desktop, phone portrait, phone landscape and tablets,
* **Robi the companion bot** — follows the player, blinks, waves, cheers and hints,
* **progression** — XP, levels, coins, answer streaks, 8 achievements, an objective checklist,
* **ambient life** — dust motes, spark bursts, target brackets, doorway light.

### The handbook (the in-game book)

Pressing **B**, the ▤ button or walking to the laboratory bookshelf opens the **CCS Operations
Manual** — a real book object, not a web page:

* a **leather cover** with the title, school and spine drops in and then **swings open on its
  hinge** (a 3D `rotateY` flip, ~1 s) to reveal two cream pages underneath;
* on desktop it opens as a **two-page spread** — left page = book plate + clickable
  **contents** for the open chapter, right page = the reading text;
* changing a chapter plays a **paper-turn sweep** across the page; clicking a contents entry
  plays the same animation and scrolls to that section;
* closing the book **swings the cover shut** before the overlay disappears;
* on phones and short landscape screens the spread collapses to a **single page** with the
  chapter tabs in a scrollable strip.

Text is dark ink on warm paper (`#2f2a1e` on `#f6ecd6`) rather than the old dark theme, so it
is readable on a projector, a laptop and a phone in daylight. Code/sample blocks sit on a
slightly deeper cream with a teal rule, and the ★ review answers appear in a dashed gold box.

### Sitting with an agent

```
stand at a chair   →  prompt "Sit at Student PC 01", button reads SIT DOWN
E / Sit down       →  your character sits facing the monitor, the agent steps aside,
                      and a bubble appears: "ANA · IDIOM  \"Touch base\" — a quick follow-up call"
E / Use PC         →  the terminal's review questions (Q1–Q4) open
Space / Stand      →  you step out in front of the chair and the agent sits back down
```

While seated, walking is disabled (movement keys are ignored), the HUD's mission line reads
`Seated at Student PC 01 · with Ana · E to use · SPACE to stand`, and the joystick does
nothing — standing up is the only way to move again. The agent's mind wanders on its own:
every nine seconds a new line appears (facts such as *"AHT = (talk + hold + ACW) ÷ calls
handled"*, tips, and idioms like *"learn the ropes"*, *"cut to the chase"*, *"keep me in the
loop"*).

Bot names, colours and lines are data at the top of `script.js` (`BOT_NAMES`, `BOT_LOOKS`,
`BOT_LINES`) — add a line and it enters the rotation.

Puzzle chain:

```
Bookshelf ─────────────▶ CCS Operations Manual (all four quarters, readable any time)

Terminal 01 (front row) ── Q1: what BPO stands for ─────────┐
                        └─ Q1: which metric is AHT ────────┴─▶ Review card 1

Storage cabinet ────────── Q2: which control is pitch ────┐
                        └─ Q2: New York vs Manila hours ──┴─▶ Review card 2

Teacher's notebook ─────── Q3: open vs closed questions ──┐
                        └─ Q3: step 1 of de-escalation ───┴─▶ Review card 3

Exit door panel ────────── Q4: the email subject line ────┐
                        └─ Q4: omnichannel vs multichannel ┴─▶ door unlocks ──▶ walk out ──▶ results
```

Three review cards plus all four quarters are required before the exit opens, so the student
cannot finish the room without touching Q1–Q4.

---

## 5. File structure

```
callscape/
├── index.html      Structure of the game shell and all UI panels
├── style.css       Pixel-art UI chrome, HUD, joystick, responsive layouts, animations
├── script.js       Engine: input, movement, collision, camera, interaction,
│                   dialogue, questions, state/save, rendering, game loop
├── questions.js    Teacher-editable question bank (data only, no logic)
├── codebook.js     Handbook content — 4 quarters + glossary + QA wing, lesson text, sample blocks
└── assets/
    └── README.md   Notes on assets (all art is drawn procedurally at runtime)
```

`script.js` is one file (as the brief requires) but is split into clearly numbered
sections so the systems stay separate and readable:

| Section | Contents |
|---|---|
| 1 | Config, maths helpers, colour palette |
| 2 | Room data (`ROOM_LAB`), objects, dialogue content (`CONTENT`), items |
| 3 | Game state, offline save/load, settings record, `Backend` seam for the C# API |
| 4 | `Sound` — synthesised WebAudio blips (no audio files) |
| 5 | `Questions` — normalisation + validation of typed answers |
| 6 | `Dialogue` — text pages, clue cards, quiz form |
| 7 | `Input` — keyboard and `Joystick` |
| 8 | Movement and collision (`moveWithCollision`, `canStand`) |
| 9 | Camera (`updateCamera`, `clampAxis`, `worldToCss`) |
| 10 | Interaction (`nearestInteractable`, `hasLineOfSight`, clues, door, completion) |
| 11 | HUD, mission text, journal, pause, main menu, reset/start |
| 11b | `Book` — handbook reader + `highlightSample()` accenting for scripts/emails/chat/formulas |
| 11c | `Settings` — preferences panel |
| 12 | Rendering — pre-rendered room art, furniture sprites, character, markers |
| 13 | Game loop and boot |

---

## 6. How the systems work

### Movement (delta time)

`updatePlayer(dt)` reads a single movement vector from keyboard + joystick, clamps its
length to 1 (so diagonals are not faster), multiplies by `PLAYER_SPEED` (96 px/s) and by
`dt`, then hands the result to the collision resolver. `dt` is capped at 50 ms so a
background tab cannot teleport the player. Key handling is `keydown`/`keyup` state based,
and all keys are released on `blur`/`visibilitychange` so the character never walks on its
own. Keys are ignored while the answer input has focus, so typing "wasd" never moves you.

### Virtual joystick

`Joystick` uses a single pointer with `setPointerCapture`, so a drag that leaves the ring
keeps working. The knob offset is clamped to the ring radius; the resulting vector is
normalised, given a 16 % dead zone and rescaled past the dead zone, which gives slow
walking with a light push and full speed at the rim. `touch-action: none`,
`overscroll-behavior: none` and `preventDefault()` on `pointerdown/move` plus a
`touchmove` guard stop the page from scrolling or selecting text while playing.

### Collision

The player is a small box (16 × 12 px) anchored at the feet. Every solid (walls, desks,
chairs, cabinet, door, plant, bin) is an AABB in world pixels, built once by
`buildSolids()` (rebuilt when the door opens). Movement is split into sub-steps of at most
6 px, and each sub-step resolves **X first, then Y**. Resolving axes separately is what
lets the player slide smoothly along a desk instead of sticking to it. A final clamp keeps
the character inside the room even if something goes wrong.

### Camera

The camera target is the player (slightly above the feet), smoothed with an exponential
lerp that is frame-rate independent: `t = 1 - exp(-11 * dt)`. `clampAxis()` clamps the
view rectangle to the world rectangle, and when the view is *larger* than the room it
centres the room instead. The camera position is rounded to whole world pixels before
drawing so the pixel grid never shimmers.

### Pixel-art rendering

The room's floor, walls, paper, posters, window, entrance and light pools are painted once
into an offscreen canvas at 1 world pixel per buffer pixel. The visible canvas is that
buffer upscaled with `imageSmoothingEnabled = false` (plus
`image-rendering: pixelated` in CSS), so art stays crisp at any zoom. The scale factor is
chosen to fit the whole room on screen when possible (single-screen room design) and the
follow camera takes over on narrow phones. Furniture and the player are depth-sorted by
their "feet" Y each frame (painter's algorithm), which is why the character can pass
behind a bookshelf but in front of a desk.

### Companion, rewards and effects (v2.0)

All of it lives in **section 12b** of `script.js` (search for `12b. COMPANION, PROGRESSION`),
between rendering and the game loop. Nothing there can gate the escape chain.

| Piece | What it is |
|---|---|
| `PROG` | `{ xp, level, coins, streak, bestStreak, correct, wrong, achievements }` |
| `xpForLevel(n)` | XP needed for the next level: `90 + (n - 1) * 70` |
| `ACHIEVEMENTS` | 8 records: `first_card`, `all_cards`, `clean_run`, `bay_clear`, `escape`, `level5`, `scholar`, `flawless` |
| `Progression` | `addXp / addCoins / unlock / onCorrect / onWrong / onClue / onDoorOpen / onBayBonus / onComplete / onBookOpen / onVisit / reset / snapshot / restore` |
| `ROBOT` + `drawRobot()` | companion state and its pixel sprite (drawn inside the normal depth sort) |
| `drawRobotBubble()` | the speech bubble, drawn in world space above Robi and the player |
| `FX` | spark particles and drifting dust motes, plus the doorway light timer |
| `drawTargetHighlight()` | pulsing gold corner brackets around `currentTarget` |

**Reward table** (only real events):

| Event | XP | Coins |
|---|---|---|
| Correct answer, first try | 40 | 5 |
| Correct answer after a retry | 22 | 2 |
| Review card collected | 60 | 6 |
| Exit door unlocked | 80 | 10 |
| Mock Call Bay cleared (bonus card) | 150 | 20 |
| Floor cleared (escaped) | 150 | 25 |
| Any achievement unlocked | — | 15 |

A wrong answer never removes XP and never breaks a run: it resets the *streak*, shows a gentle
nudge plus a hint that points at the handbook chapter, and lets the student retry immediately.

**Hook points** (one line each, easy to find):

* `Questions.record()` → `Progression.onCorrect()` / `.onWrong()`
* `giveClue()` → `Progression.onClue()`
* `openDoor()` → `Progression.onDoorOpen()`
* `checkBayBonus()` → `Progression.onBayBonus()`
* `showComplete()` → `Progression.onComplete()`
* `Book.show()` → `Progression.onBookOpen()`
* `enterRoom()` → `robotSnapToPlayer()` + `Progression.onVisit()`
* `render()` → `robotVisual` in the depth sort, then `drawDoorLight / drawFx / drawMotes /
  drawTargetHighlight / drawRobotBubble`
* `loop()` → `updateWorldFx(dt)` (motes, particles, Robi) and `maybeReactToApproach()`

**Save compatibility.** The payload is still `callscape.save.v2` with `version: 2`; the new
`prog` object is **optional**. `Progression.restore()` falls back to a clean level-1 record when
`prog` is missing, so a save written by v1.5 still resumes without losing clues or position.

**Tuning knobs.** Reward values are the constants inside each `Progression.on…` method; the
level curve is `xpForLevel()`; Robi's follow distance is the `robotCandidates()` array; the
achievement list is the `ACHIEVEMENTS` array. No CSS or HTML changes are needed to retune them.

### Agents, sitting and the thought bubble

`ROOM_LAB.objects[].bot` holds each agent's name, palette and state. `nearestSeat()` finds the
chair you are standing at, `sitDown()` snaps the player onto the seat and flips the agent to
`seated: false` (their sprite switches from the chair to leaning on the desk edge), and
`standUp()` puts the agent back and steps the player out in front of the chair — falling back
to a safe spot if that tile is blocked. While `player.seated` is set, `readMoveVector()`
returns zero, so no key or joystick input can move the character.

The bubble is drawn on the canvas in `drawThoughts()` → `drawThoughtBubble()`, with
word-wrapping computed from `measureText` and a minimum Y derived from the HUD height and the
current zoom, so it never hides under the mission panel on a phone. `nextThought()` rolls a
new line, never repeating the current one, and a timer in the game loop rotates it every 9s.

### Interaction

`nearestInteractable()` runs every frame and scores each object by:

1. distance to the player (must be ≤ 56 px),
2. a line-of-sight check — objects behind walls or solid furniture cannot be inspected
   (small props and chairs are flagged see-through, and an object never blocks its own
   inspection),
3. a bonus for the object the player is facing (dot product of facing with direction),
4. an optional `priority` so a notebook on a desk can beat the desk body beside it.

Wall-mounted objects and props that sit on another surface declare a `touch` point — a
spot on the floor the player must stand near. The winner drives the `E …` prompt above the
object and the on-screen Interact button, and pressing `E` opens the dialogue chain for it.

### Questions

`questions.js` holds plain data (`topic`, `bookRef`, prompt, accepted answers, hint,
success/fail feedback). `topic` is the quarter (`Quarter 1` … `Quarter 4`) and `bookRef` the
handbook section; both are rendered as badges on the question panel, so a student always sees
which part of the manual answers the question they are looking at. Normalisation trims,
lowercases, collapses spaces and strips trailing punctuation; items flagged `numeric` also
accept the figure with a unit word (`13`, `13 hours`, `13 hrs`).
`Questions.normalize()` trims, lowercases, collapses double spaces and drops trailing
punctuation; `Questions.check()` compares against the accepted-answer list without ever
revealing the answer beforehand. A hint appears only after the second wrong attempt, and
only while hints are enabled in the pause menu. Every attempt is recorded in
`state.attempts` and `state.solved`. Clue cards are held back until the question is solved,
and unique clues can never be collected twice.

### Offline save & settings

Two separate `localStorage` records:

| Key | Holds | Written when |
|---|---|---|
| `callscape.save.v2` | room, clues, solved questions, attempts, door state, elapsed time, player position | every 5 s while playing, on dialogue close, on *Save & main menu*, on unload |
| `callscape.settings.v1` | sound, hints, prompt, joystick side, text size | the moment a setting changes |

Keeping them apart means browsing the menu or changing a setting never creates a phantom
"resumable" save. `saveLocal()` returns early unless a run is active (`state.started`).
Every storage call is wrapped in `try/catch`, so the game still runs when storage is blocked
(sandboxed iframe, private mode).

Resume flow: main menu → *Resume offline save* → `applySave()` restores clues, solved
questions, attempts, door state, elapsed time and the exact player position, then the run
goes live. *New game* clears the record first. *Save & main menu* in the pause menu saves
and returns to the menu without losing anything. *Delete save* in settings removes it.

---

### Adding a third room

Rooms are data. Copy `ROOM_BAY` in `script.js`, change `id`, `name`, `cols`, `rows`, `spawn`,
`decor` and `objects`, then register it:

```js
const ROOM_LAB = { /* ... */ };
const ROOM_BAY = { /* ... */ };
const ROOM_NEW = { /* ... */ };          // 1. your new room object

const ROOMS = { lab: ROOM_LAB, bay: ROOM_BAY, newroom: ROOM_NEW };   // 2. register

const DOOR_SPAWNS = {                    // 3. where you land when you walk in
  bay: { x: 16.4, y: 11.4, dir: 'left' },
  lab: { x: 16.5, y: 4.3,  dir: 'down' },
  newroom: { x: 3.2, y: 4.0, dir: 'right' }
};
```

Then add a doorway object to whichever room should lead there:

```js
{
  id: 'newDoor', type: 'door', label: 'Records Room',
  rect:   { x: 8.0, y: 0.6, w: 1.5, h: 2.35 },   // in the top wall
  solid:  { x: 8.0, y: 0.6, w: 1.5, h: 2.35 },
  touch:  { x: 8.75, y: 3.9 },                   // stand-here point
  marker: { x: 8.75, y: 3.45 },
  doorLabel: 'RECORDS', animated: false,         // a plain archway
  interact: 'toNewRoom'
}
```

and a two-step dialogue that calls the helper (the second step fires on Continue):

```js
toNewRoom: function () {
  return [
    { text: 'A door marked RECORDS.' },
    { text: 'You step through.', action: function () { travelTo('newroom'); } }
  ];
}
```

Finally give the room its own wall art if you want it — `decor.board`, `decor.entrance`,
`decor.window`, `decor.posters`, `decor.clock` and `decor.rug` are all per-room. Anything you
leave out is simply not drawn (the bay has no `entrance`, the lab has no `scoreboard`).

## 7. Customising the content

### Add or replace a question

Edit `questions.js` — nothing else changes:

```js
q_csat: {
  topic: 'Quarter 1',
  bookRef: 'Q1 › Jargons & metrics',
  prompt: 'Which metric is the percentage of satisfied customers?',
  placeholder: 'Type the abbreviation',
  accepted: ['csat', 'customer satisfaction score'],
  hint: 'Two of the letters are C and S.',
  success: 'Correct — CSAT = (satisfied responses ÷ total responses) × 100.',
  fail: 'Not that one. It measures satisfaction, not resolution.'
}
```

Then reference it from a station dialogue step in `CONTENT` with `quiz: 'q_csat'`.
Matching ignores case and leading/trailing spaces; list every acceptable spelling in
`accepted`.

### Add or edit a handbook section

The manual is data in `codebook.js`:

```js
{
  heading: '3.6 Warm transfers',
  body: 'A warm transfer introduces the customer to the next agent before handing over.',
  sample: {
    kind: 'phone',                      // 'phone' | 'email' | 'chat' | 'formula' | 'text'
    src: 'Agent: I am transferring you to my supervisor, Ms. Lim. One moment.'
  },
  answer: 'What is a transfer that introduces the customer first?  A warm transfer.',
  notes: ['Cold transfer = no introduction.', 'Brief the next agent before you release the call.']
}
```

`body` supports `` `inline code` ``, `**bold**` and `*highlight*`. `sample.kind` drives the
accenting: `phone` colours speaker labels and [stage directions], `email` colours header
fields, `chat` colours timestamps, names and /macros, `formula` highlights metrics and
numbers, and `text` keeps plain notes. If a section answers a review question, put the same
wording in the `answer` field, in the question's `success` text and in the matching review
card — that is what keeps the manual, the cards and the test in agreement.

### Add a question

```js
q_warmtransfer: {
  topic: 'Quarter 3',                  // shown as the badge; selects the handbook tab
  bookRef: 'Q3 › Warm transfers',      // shown as the second badge
  prompt: 'What do you call a transfer that introduces the customer first?',
  accepted: ['warm transfer', 'a warm transfer'],
  hint: 'The opposite of cold.',
  success: 'Correct — a warm transfer introduces the customer before handing over.',
  fail: 'Not that one. Think of the opposite of a cold transfer.'
}
```

Then add `{ text: '...', quiz: 'q_warmtransfer' }` as a step in one of the station
dialogues in `CONTENT` (see §6). Every station can hold any number of questions;
`state.solved` is per question id, so nothing needs to be renumbered.

### Add an object

```js
ROOM_LAB.objects.push({
  id: 'myChest',
  type: 'cabinet',                      // sprite used by drawObject()
  label: 'Locked Chest',                // shown in the interaction prompt
  rect:  { x: 6, y: 12, w: 2, h: 2 },   // tiles: drawing + distance
  solid: { x: 6, y: 12, w: 2, h: 2 },   // optional collision box (tiles)
  touch: { x: 7, y: 14.4 },             // optional "stand here" spot
  marker: { x: 7, y: 11.8 },            // optional floating ! / ? badge
  interact: 'myChest'                    // key into CONTENT
});
```

…then give it dialogue:

```js
CONTENT.myChest = function () {        // `this`/args unused, but available
  return [
    { text: 'A dusty chest with a keyhole.' },
    { text: 'CHEST LOCK', quiz: 'q_my_question', card: 'woodenKey' },
    { text: 'It opens. Inside is a wooden key.' }
  ];
};
```

`card: 'itemId'` grants a clue once the question is solved (add the item to `ITEMS` and
to the count if you want a different total). Add a `MARKER_RULES` entry if you want the
floating badge, and a `case` in `buildVisuals()` if you need a new sprite.

### Add a room (Phase 5)

```js
const ROOM_SERVER = {
  id: 'server', name: 'Server Room', cols: 20, rows: 14,
  spawn: { x: 10, y: 12, dir: 'up' },
  walls: [ /* {x,y,w,h} in tiles */ ],
  decor: { lamps: [], window: null, posters: [] },
  objects: [ /* … */ ]
};
ROOMS.server = ROOM_SERVER;
```

Then point a door at it from `CONTENT`:

```js
travelTo('server');   // closes the dialogue, re-renders the room, resets the camera
```

`enterRoom(id)` handles normalising, collision rebuilding, pre-rendering and camera
snapping, so a new room only needs data.

---

## 8. Phase 6 — backend status

**Not implemented yet.** The prototype is fully playable offline and stores progress in
`localStorage`. `Backend` and `API_BASE` in `script.js` are deliberate, clearly-labelled
placeholders: they return `{ ok: false, reason: 'backend-not-implemented' }` and are only
called when `Backend.enabled` is switched on.

Planned ASP.NET Core Web API (C#):

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login`, `/logout` | Student authentication (ASP.NET Core Identity or BCrypt password hashing — **never plain text**) |
| `GET/PUT /api/students/{id}` | Student profile |
| `GET/PUT /api/progress/{studentId}` | Save / restore game progress (`GameProgressDto`) |
| `POST /api/attempts` | Record each quiz attempt (question id, correct?, seconds, room) |
| `GET /api/questions?room=lab` | Teacher-approved question bank |
| `GET /api/results/export` | Aggregated results for research evaluation |

The save payload is already shaped to match the future DTO, so wiring it up means replacing
`saveLocal()` / `loadLocal()` with `fetch()` calls and leaving the engine untouched:

```json
{
  "version": 2, "roomId": "lab",
  "clues": ["q1Card", "q2Card"],
  "solved": { "q_bpo": true, "q_pitch": true },
  "attempts": { "q_pitch": { "correct": 1, "wrong": 1 } },
  "doorOpen": false, "completed": false,
  "elapsedSeconds": 214, "savedAt": 1761300000000,
  "player": { "x": 416, "y": 499, "dir": "up" },
  "prog": {
    "xp": 32, "level": 2, "coins": 28, "streak": 2, "bestStreak": 2,
    "correct": 2, "wrong": 0, "achievements": { "first_card": true }
  }
}
```

`prog` was added in v2.0 and is **optional** — a save without it restores at level 1 and keeps
every clue, so the same DTO can carry both old and new records (map it to a nullable
`ProgressionDto` when the API exists).

Preferences are deliberately **not** part of this payload — they are device settings, not
student progress, and should not be uploaded.

Security notes for that phase: HTTPS only, hashed passwords (Identity/BCrypt, never plain
text or reversible encryption), JWT or cookie auth with server-side validation, per-student
authorisation on progress rows, parameterised queries via EF Core, input validation on all
DTOs, and no student names or answers in URLs.

---

## 9. Testing performed on this build

Automated browser checks (headless Chromium, desktop + phone portrait/landscape + tablet):

* keyboard movement in all four directions, facing changes, keys released stop movement,
* joystick drag moves the character and changes facing; joystick releases to a stop,
* collision: cannot pass the bottom wall, cannot walk through a desk or a chair,
* interaction prompt + Interact button enable/disable near an object; nothing interactable
  through a wall,
* all **8 questions** across the four stations answer correctly with realistic inputs
  (`business process outsourcing`, `aht`, `pitch`, `13 hours`, `open`, `listen`,
  `subject line`, `omnichannel`),
* wrong answers are rejected with quarter-specific feedback and the hint appears only after
  the second attempt,
* the numeric time-zone item accepts `13`, `13 hours` and `thirteen`,
* locked door blocks progress at 2/3 review cards; the Q4 pair opens the door; walking
  through the doorway shows the results screen; *Play again* resets state,
* main menu: resume disabled with no save, enabled with one; save summary text;
  *New game* overwrites, *Save & main menu* keeps the record,
* offline save/restore across a full page reload, including the exact player position,
* settings: all five preferences switch, persist across reload, and move the joystick to
  the right-hand side (`body.hand-right`),
* handbook: opens from the menu, the pause menu (returns to the pause menu), the journal,
  the bookshelf and a question panel; all five tabs render every section and sample block,
* reset progress, pause and journal overlays,
* no console errors or page errors in any of the above; also verified from `file://` and
  inside a sandboxed iframe.

Manual checks worth repeating on a real device: joystick feel while dragging past the ring
edge, orientation change mid-play, and iOS Safari `100vh` behaviour (the layout uses
`position: fixed; inset: 0` to avoid it).

---

### v2.0 verification (companion + progression build)

Tested with Playwright/Chromium at 1366×768, 1440×900, 390×844 (portrait) and 844×390
(landscape), console watched for errors:

| Test | Result |
|---|---|
| Movement, follow camera and collision against desks/walls | pass — the player is stopped by desk solids; Robi never clips through furniture |
| Robi follows, blinks, waves, cheers, slumps; bubble never covers the player's head | pass |
| Wrong answer | no XP, streak reset, hint line, robot encouragement, question stays open |
| Correct answer | XP + coins + streak, popup, green/gold glow, robot cheer |
| Review card | +60 XP, journal entry, `first_card` / `all_cards` achievements |
| Level curve | level-ups fire live (LV1 → LV4 across the main chain) with the burst animation |
| Objective checklist | updates immediately in both rooms (`✔` marks, `n/3`, `n/6`) |
| Main chain end-to-end | 8/8 questions → 3 cards → door unlocks → walk through → results screen |
| Mock Call Bay | 6/6 practice questions → bonus card → `bay_clear`; bonus card in the journal |
| Results screen | 9 stat rows + the 8-achievement strip, `5 / 8` typical for a clean run |
| Pause menu | progress recap (level, XP, coins, best streak, achievements) renders |
| Save / reload / resume | `prog` restored exactly (level, XP, coins, streak, achievements), room restored, no console errors |
| Phone portrait / landscape | panels no longer overlap; the objective list condenses to a progress line + two open goals |
| v1.5 save compatibility | a `prog`-less v2 payload resumes at level 1 with all clues intact |

## 10. Accessibility and mobile notes

* All buttons are real `<button>` elements with `aria-label`s; focus rings are visible.
* Colour is never the only signal: markers use glyphs (! ? ✓ ▸), and quiz feedback is text.
* `prefers-reduced-motion` disables the animations.
* Touch targets: 78–86 px for Interact, 54–62 px for Stand, 116 px joystick, 36–40 px icon buttons.
* Hints can be switched off for assessment settings; hints only appear after two attempts.
* Text is DOM (not canvas), so screen readers and browser zoom work for dialogue/questions.

---

## 11. Known limitations / next steps

1. **Phase 5** — additional rooms (e.g. a mock call floor with live call simulation, and a
   capstone challenge) using the `ROOMS` map and `travelTo()`.
2. **Hand-made sprite sheets** in `assets/` to replace the procedural character and
   furniture art (the engine already keeps drawing behind small helpers, so this is a
   contained change).
3. **More rooms** — the engine is already multi-room (`ROOMS`, `enterRoom`, `travelTo`,
   `DOOR_SPAWNS`); a third room is a data object plus a doorway. The Mock Call Bay is the
   worked example.
4. **Phase 6** — the ASP.NET Core API + database described above, plus teacher tooling for
   editing questions.
4. Sound is synthesised; a recorded SFX pack could be dropped in later.
5. The handbook is a single reader; search, bookmarks and per-question deep links into a
   specific section are natural next additions.
6. Landscape phones compress the HUD slightly; a collapsible mission panel is a candidate
   improvement.
7. The offline save is per-browser-profile. Shared lab machines should use *Delete save* in
   settings between students, or move to the Phase 6 account system.

---

## 12. Teacher answer key (spoiler)

| Station | Quarter | Question | Accepted |
|---|---|---|---|
| Terminal 01 | Q1 | What BPO stands for | `business process outsourcing` |
| Terminal 01 | Q1 | Metric for total time per contact | `aht`, `average handle time` |
| Storage cabinet | Q2 | Voice control for high/low | `pitch` |
| Storage cabinet | Q2 | Hours New York is behind Manila | `13`, `13 hours`, `thirteen` |
| Teacher's notebook | Q3 | Question type inviting a full answer | `open`, `open-ended` |
| Teacher's notebook | Q3 | Step 1 of de-escalation | `listen`, `active listening` |
| Exit panel | Q4 | Field stating an email's purpose | `subject`, `subject line` |
| Exit panel | Q4 | Shared customer context | `omnichannel` |

**Mock Call Bay (optional practice, awards `bayCard`):**

| Object | Quarter | Question | Accepted |
|---|---|---|---|
| Booth A | Q2 | What you ask before placing a caller on hold | `permission` |
| Booth A | Q2 | Telling the customer the steps ahead | `signposting` |
| Booth B | Q2 | Idiom for a rough estimate | `ballpark`, `ballpark figure` |
| Booth B | Q3 | What you do above your approval limit | `escalate`, `escalation` |
| QA board | Q3 | A briefed, introduced handoff | `warm`, `warm transfer` |
| QA board | Q4 | Back-office accuracy standard | `first-time-right`, `ftr` |

Each answer is stated in three places that must stay aligned:
the **handbook** (★ review answer), the **review card** in the journal, and the question's
`success` feedback in `questions.js`.

Edit `questions.js` (and the matching handbook sections in `codebook.js`) to replace these
with teacher-approved quarterly review items before classroom use.
