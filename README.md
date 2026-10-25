# CallScape — A Gamified Escape Room Review (Grade 11 Contact Center Services)

A playable, top-down pixel-art exploration game for **Grade 11 Contact Center Services (CCS)**
students of **Emilio Jacinto National High School**.

Players walk around the CCS training floor, read the **CCS Operations Manual**, talk with
roaming student colleagues sharing contact-center jargons, inspect terminals, collect review
cards, answer typed-answer questions (with optional **EXP-powered Letter Hints**), and unlock
the floor exit. It is an exploration game first — there is no dashboard, no quiz list, and no
account wall.

**Review scope: Term 1 to Term 3 of the CCS subject (plus Glossary & QA Wing).**

| Term / Chapter | Topic covered in the game |
|---|---|
| **Term 1 · Operations** (`t1`) | BPO industry history and economic role, PECs, jargons and metrics (AHT, CSAT, FCR, AUX, bio break), technology and tools (CRM, ACD, IVR, headsets, UPS), career paths, data privacy (RA 10173 / PCI DSS), workforce basics (shrinkage, occupancy, adherence) |
| **Term 2 · Communication** (`t2`) | Communication process and active listening, verbal/non-verbal cues, paralanguage and voice control (pitch, pace, tone), accent neutralization, cultural variables and US/PH time zones, rapport and empathy, telephone etiquette, hold procedure, signposting, floor idioms |
| **Term 3 · Calls & Digital** (`t3`) | Inbound/outbound/blended call flow, product knowledge and USP, open vs. closed probing, LAST de-escalation model, after-sales documentation, escalation and warm/cold transfers, email etiquette (subject line + ticket reference), live chat and macros, omnichannel service delivery, back-office First-Time-Right (FTR) quality standards |
| **Glossary** (`glossary`) | Every role, metric, system, AUX/disposition code, and floor idiom in one A-to-Z chapter |
| **QA Wing** (`qa`) | QA scorecards, auto-fail / fatal errors, calibration sessions, escalation triggers, DSAR / Right of Access (RA 10173), and the nesting bay |

Built with **HTML5 + CSS3 + vanilla JavaScript only** (no frameworks, no game engine, no
build step, no external assets). `index.html` is bundled as a **single self-contained file**
so it can be uploaded directly to **GitHub Pages** or opened offline on any lab computer or
phone.

---

## What's New in v2.1 (Current Build)

* **Term 1–3 Curriculum Structure**: All handbook chapters, review cards (**Card I · Term 1**,
  **Card II · Term 2**, **Card III · Term 3**), question topic badges, and `bookRef` links are
  organized into **Term 1 · Operations**, **Term 2 · Communication**, and **Term 3 · Calls & Digital**
  (plus **Glossary** and **QA Wing**).
* **Spoiler-Free Handbook (Cheat Sheet Removed)**: The old Cheat Sheet tab and explicit answer
  spoiler callouts were removed so students cannot simply copy answers — they learn from the
  handbook lessons, colleague jargon tips, and EXP letter hints.
* **EXP-Powered Letter Hints (`-10 XP` per step)**: Students start with **30 Starter XP** and
  earn XP from studying room objects, answering questions, and collecting cards. Inside any quiz
  modal, clicking **`💡 Letter Hint (-10 XP)`** reveals letters of the target answer one step at
  a time (e.g., `B U _ _ _ _ _ _   P _ _ _ _ _ _   O _ _ _ _ _ _ _ _ _ _`).
* **Collapsible HUD Panels**: Both top panels — the top-left **CCS Training Floor / EXP** panel
  (`#room-panel`) and the top-right **Mission** panel (`#mission-panel`) — can be clicked at any
  time to collapse their body into a compact header tab (`▾` / `▸`), freeing up screen space.
  Clicking again expands them.
* **Roaming Student Colleagues, Proximity Jargon Timer & Mobile Vertical Mode**: Up to 2 seated
  student agents at a time stand up from their chairs and walk around the training floor aisles
  with **17 contact-center jargon tips** (`NAME · JARGON · ⏱ 5s`).
  * **Proximity-Triggered Timer**: A roaming student's jargon bubble only appears when the player
    walks **near** them (within ~3 tiles), starting a **4.8-second countdown timer** (with a
    visible `⏱` badge and golden progress bar) that hides automatically when the timer finishes
    or when the player walks away.
  * **Android / Mobile Vertical Mode Fix**: When mobile / vertical portrait mode is detected,
    the top HUD panels auto-collapse into compact tabs and the jargon bubble renders as a compact,
    translucent banner docked in the top safe zone (`y = 48px`) so it never blocks the player,
    the room floor, or the bottom touch controls.
* **Student Check-In & Male / Female Character Selection**: Clicking **New Game** opens the
  **Student Check-In** modal where the student enters their **Student Name** (e.g.,
  *Juan Dela Cruz — G11 CCS-A*) and selects between a **♂ Male** or **♀ Female**
  pixel-art character (with custom walking, profile, and seated animations).
* **Outdoor Urban Exit Cutscene (`#outro`)**: When the student steps through the unlocked Exit Door,
  an animated pixel-art cutscene plays before the Results Screen — showing the student's chosen
  character (and Robi) walking out of the CCS Building onto a golden-hour urban sidewalk lined
  with swaying green trees, flying and perched birds (`♪`), and friendly sidewalk cats (`meow~ ♥`).
* **Verified Student Name on Results Screen**: After the outdoor exit animation completes (or is
  skipped via `Skip ▸`), the **Results Screen** prominently displays the **Student Name**,
  **Character Gender Badge (`♂ Male` / `♀ Female`)**, and a unique **Verification Code**
  (`VERIFIED · CCS-XXXXX`) so screenshots cannot be shared between students.
* **Coin Perks Shop (`◎` Perks)**: Students start with **15 Starter Coins (`◎ 15`)** and earn
  more from answering questions, streaks, and achievements. Clicking **`◎`** in the top-right bar
  (or clicking the `◎` coin wallet chip / pressing **`P`**) opens the **Coin Perks Shop**:
  * **☕ Iced Caramel Brew (`15 ◎`)** — Permanently boosts walking speed by **+25%** across all rooms.
  * **⚡ XP Energy Pack (`15 ◎`)** — Instantly grants **+30 EXP** (enough for 3 Letter Hints; repeatable).
  * **🧭 Robi Radar Compass (`20 ◎`)** — Projects a glowing golden guide arrow on the floor pointing to the next objective.
  * **🎧 Pro Gold Headset (`25 ◎`)** — Equips a gleaming Gold Headset on the player sprite and grants **+5 Bonus XP** on every correct answer.
* **Robi Companion Robot & Full Progression**: Animated pixel-art companion robot, **LV 1–LV 7**
  XP curve, coins, answer streaks, and 11 achievements.

---

## 1. Quick Start & GitHub Pages Deployment

**Option A — Open Offline**

```
Double-click index.html
```

The game runs entirely offline straight from `file://` because `index.html` is self-contained.

**Option B — Upload to GitHub Pages**

1. Create a GitHub repository and upload **`index.html`** to the root of the repository.
2. Go to **Settings → Pages**, select **Deploy from a branch** (`main` / `/ (root)`), and save.
3. Your live game will be published at `https://<your-username>.github.io/<repo-name>/`.

**Option C — Local Web Server (for testing on phones over Wi-Fi)**

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### First Launch — "Where are you playing?"

Before the main menu appears, the game asks:

```
WHERE ARE YOU PLAYING?
  [ COMPUTER ]  Desktop or laptop · WASD / arrows + E
  [ PHONE    ]  Android or iPhone · joystick + tap buttons
```

The choice is stored in `callscape.settings.v1.device` and can be switched anytime under
**Settings → Playing on**.

---

## 2. Game Stages (Rooms) & Player EXP Levels

### A. Game Stages / Rooms (3 Rooms · 20 Questions Total)

| Stage / Room | Size | Role & Objectives |
|---|---|---|
| **Stage 1: CCS Training Floor** (`lab`) | 26 × 18 tiles | **Main Escape Room (First Stage)** — Among the student PCs on the floor, **only your own workstation (`Student PC 01` / `pc1`)** has PC questions (`q_bpo`, `q_aht` for **Card I · Term 1**). Other students' PCs (`pc2`–`pc8`) have no quizzes. Solve the 6 Training Floor questions (`Student PC 01`, `Storage Cabinet`, `Teacher's Notebook`) to collect all **3 Review Cards**. |
| **Stage 2: Mock Call Bay** (`bay`) | 20 × 14 tiles | **Mock Call Bay (Second Stage)** — Accessible through the top-wall doorway on the Training Floor. Complete **Practice Booth A** (`q_permission`, `q_signpost`), **Practice Booth B** (`q_ballpark`, `q_escalate`), and the **QA Scorecard Board** (`q_warm`, `q_ftr`). Finishing both Stage 1 and Stage 2 (`12 / 12` floor & bay questions + 3 Review Cards) immediately unlocks the **QA & Escalation Wing** door! |
| **Stage 3: QA & Escalation Wing** (`lab2`) | 22 × 16 tiles | **QA & Escalation Wing (Third Stage — Required Before Exit Door)** — Enter through the upper-right door on the Training Floor once Stage 1 & Stage 2 are cleared. Solve all **6 QA Wing console questions** (`Nesting Pod`, `Escalation Desk`, `QA Console`). Once all 6 QA Wing questions are completed (`18 / 18` pre-door questions total), return to the Training Floor to unlock the **Exit Door** and answer the final 2 questions (`q_subject`, `q_omni` = **20 / 20 questions total**)! |

### B. Player EXP Levels (`LV 1` to `LV 7`)

Students start at **LV 1** with **30 Starter XP** (so they can immediately use up to 3 Letter
Hints if needed). Each level requires `90 + (level - 1) × 70` XP:

| Level Transition | XP Needed for Level | Cumulative XP |
|---|---|---|
| **LV 1 → LV 2** | 90 XP | 90 XP |
| **LV 2 → LV 3** | 160 XP | 250 XP |
| **LV 3 → LV 4** | 230 XP | 480 XP |
| **LV 4 → LV 5** | 300 XP | 780 XP |
| **LV 5 → LV 6** | 370 XP | 1,150 XP |
| **LV 6 → LV 7** | 440 XP | 1,590 XP |

---

## 3. Controls

| Action | Desktop | Mobile / Touch |
|---|---|---|
| Move | `W` `A` `S` `D` or Arrow keys | Hold / drag the virtual joystick |
| Interact / inspect / talk to roamer | `E` or `Enter` | Tap the gold **Interact** button |
| Sit at a desk | `E` while standing at a chair | **Sit down** button |
| Stand up | `Space` (or `X`) | **Stand** button |
| Use the PC while seated | `E` | **Use PC** button |
| Reveal a Letter Hint in a Quiz | Click **`💡 Letter Hint (-10 XP)`** | Tap **`💡 Letter Hint (-10 XP)`** |
| Collapse / Expand Top Panels | Click **CCS Training Floor** or **Mission** panel | Tap **CCS Training Floor** or **Mission** panel |
| Advance dialogue | `E`, `Space`, `Enter` or **Continue** | Tap **Continue** |
| Submit an answer | `Enter` in the answer box | Tap **Submit** |
| Open CCS Handbook | `B`, the ▤ button, or any bookshelf | ▤ button or any bookshelf |
| Clue Journal | Pause → *Journal*, or the ◈ button | ◈ button |
| Pause / Back | `Esc` or the ❚❚ button | ❚❚ / ✕ button |

---

## 4. Key Student Support & Gameplay Systems

### A. CCS Operations Manual (`codebook.js`) — 5 Chapters, 45 Sections

| Tab | Contents |
|---|---|
| **Term 1 · Operations** (`t1`, 11 sections) | What BPO is, how the Philippine industry grew (PEZA, IBPAP), economic role, floor roles and shifts, the 10 PECs, SWOT/market analysis, jargons and metrics with formulas, technology (CRM, ACD, IVR, headset, UPS), career paths, data privacy (RA 10173, PCI DSS), workforce basics (shrinkage, occupancy, adherence) |
| **Term 2 · Communication** (`t2`, 9 sections) | Communication process, active listening, verbal/non-verbal cues, paralanguage (pitch/projection/pacing/tone/articulation), accent-neutralization drills, cultural variables and US/PH time zones, rapport in the first 30 seconds, telephone etiquette & hold procedure, floor idioms |
| **Term 3 · Calls & Digital** (`t3`, 16 sections) | Inbound 7-step and outbound 6-step call flows, feature/benefit/USP and FAB, open vs. closed probing, de-escalation and the LAST model, ticket-note documentation, blended campaigns, honest up-/cross-selling, escalation and warm/cold transfers, email etiquette (subject line + ticket ID), live chat with macros, multichannel vs. omnichannel, chat concurrency, social media replies, back-office First-Time-Right (FTR) standards |
| **Glossary** (`glossary`, 4 sections) | Roles, every metric A-to-Z, systems and AUX/disposition codes, and floor slang and idioms |
| **QA Wing** (`qa`, 5 sections) | The QA scorecard and fatal errors, calibration sessions, escalation ladder, data privacy (DSAR / Right of Access), and the nesting bay |

### B. Roaming Student Colleagues & Crisp HiDPI Speech Bubbles

* **Autonomous Floor Roaming (`updateBots` & `drawRoamingAgent`)**: Up to 2 seated colleagues
  on the Training Floor periodically stand up from their chairs, walk along the floor aisles
  with 4-direction walking animations, pause at waypoints, and return to their seats.
* **17 Jargon Tips (`tag: 'jargon'`)**: While roaming, students display a gold-bordered
  `NAME · JARGON` speech bubble explaining key terms tested on the floor (*BPO, AHT, Pitch,
  13-hour EST-to-PH gap, Open-ended questions, LAST model, Email Subject Line, Omnichannel,
  Hold Permission, Signposting, Ballpark Figure, Escalation, Warm Transfer, First-Time-Right,
  QA Scorecard, Fatal Error, Calibration, DSAR / Right of Access, Nesting*).
* **Interact on the Floor or Sit at a Desk**: Pressing **`E`** near a roaming student makes them
  pause and share a fresh jargon tip; sitting at any desk (`E`) shows either your `MY DESK` note
  (at PC 01) or the colleague's rotating tips, facts, and idioms.
* **Native HiDPI Rendering (`render()` → `drawThoughts(vis)`)**: Speech bubbles are drawn
  directly onto the main `#game` canvas at full screen/Retina `devicePixelRatio` *after* the
  pixel-art world buffer and dark vignette, using crisp `bold 11px` and `600 13px` sans-serif
  fonts with automatic overlap avoidance.

### C. EXP-Powered Letter Hints (`Dialogue.useLetterHint`)

* Every question panel includes a **`💡 Letter Hint (-10 XP)`** button next to the player's
  available EXP badge.
* Each click spends **10 XP** (`Progression.spendXp(10)`) and reveals up to **20%** of the
  canonical answer's letters (minimum 1 letter per click), while spaces and hyphens are shown
  automatically.
* Revealed hint progress is persisted per question in `state.letterHints` inside `localStorage`.

### D. Collapsible Top HUD Panels (`toggleRoomPanel` & `toggleMissionPanel`)

* Clicking the top-left **CCS Training Floor** panel (`#room-panel`) toggles `.is-collapsed`,
  hiding the room subtitle and EXP progress strip into a compact pill (`▾` / `▸`).
* Clicking the top-right **Mission** panel (`#mission-panel`) toggles `.is-collapsed`, hiding
  the objective text, progress bar, checklist, and review card chips until clicked again.

---

## 5. File Structure

```
callscape/
├── index.html      Self-contained single-file bundle (HTML + CSS + JS inline) ready for GitHub Pages
├── play.html       Copy of the self-contained playable bundle
├── style.css       Modular stylesheet (HUD, collapsible panels, handbook, EXP hint bar, responsive rules)
├── script.js       Modular game engine (rooms, HiDPI bubble renderer, roaming AI, EXP hints, save/load)
├── questions.js    Question bank (20 questions across Term 1, Term 2, Term 3, and QA Wing)
├── codebook.js     CCS Operations Manual content (Term 1–3, Glossary, QA Wing; Cheat Sheet removed)
├── README.md       Full project documentation
└── SHARE.md        Quick instructions for sharing or hosting on GitHub Pages / Netlify / itch.io
```

---

## 6. Reward & EXP Economy

| Event | XP Change | Coins |
|---|---|---|
| New Game Starter XP | **+30 XP** | 0 |
| Inspecting a study object (poster / chart / rack) | **+15 XP** | 0 |
| Correct answer (first try) | **+40 XP** | +5 |
| Correct answer (after retry) | **+22 XP** | +2 |
| Review card / QA relic collected | **+60 XP** | +6 |
| Unlocking Exit Door | **+80 XP** | +10 |
| Clearing Mock Call Bay (6/6 bonus questions) | **+150 XP** | +20 |
| Escaping CCS Training Floor (Stage 1 clear) | **+150 XP** | +25 |
| Clearing QA & Escalation Wing (Stage 2 clear) | **+200 XP** | +30 |
| Using a **Letter Hint** inside a quiz | **-10 XP** | 0 |

---

## 7. Teacher Answer Key (All 20 Questions)

### Stage 1 — CCS Training Floor (Core Escape Chain · 8 Questions)

| Station | Term | Question ID & Prompt Summary | Canonical Answer (`accepted[0]`) | Other Accepted Variations |
|---|---|---|---|---|
| **Terminal 01** (`pc1`) | **Term 1** | `q_bpo` — What BPO stands for | `business process outsourcing` | — |
| **Terminal 01** (`pc1`) | **Term 1** | `q_aht` — Metric for average total handle time | `aht` | `average handle time`, `average handling time` |
| **Storage Cabinet** | **Term 2** | `q_pitch` — Voice element for highness/lowness | `pitch` | `vocal pitch`, `voice pitch` |
| **Storage Cabinet** | **Term 2** | `q_timezone` — Hours New York (EST) is behind Manila | `13` | `13 hours`, `thirteen`, `thirteen hours` |
| **Teacher's Notebook** | **Term 3** | `q_open` — Question type inviting a full explanation | `open` | `open-ended`, `open ended`, `open question`, `probing` |
| **Teacher's Notebook** | **Term 3** | `q_deescalate` — First step when handling an angry caller (LAST) | `listen` | `active listening`, `listen actively`, `listening` |
| **Exit Door Panel** | **Term 3** | `q_subject` — Email header line stating the purpose + ticket ID | `subject` | `subject line`, `email subject`, `the subject line` |
| **Exit Door Panel** | **Term 3** | `q_omni` — Service approach linking all channels with shared history | `omnichannel` | `omni-channel`, `omni channel`, `omnichannel support` |

### Stage 1.5 — Mock Call Bay (Optional Practice · 6 Questions)

| Object | Term | Question ID & Prompt Summary | Canonical Answer (`accepted[0]`) | Other Accepted Variations |
|---|---|---|---|---|
| **Practice Booth A** | **Term 2** | `q_permission` — What to ask before placing a caller on hold | `permission` | `ask permission`, `their permission`, `caller permission`, `consent` |
| **Practice Booth A** | **Term 2** | `q_signpost` — Telling the customer the steps ahead | `signposting` | `signpost`, `sign-posting`, `sign posting` |
| **Practice Booth B** | **Term 2** | `q_ballpark` — Idiom (`_____ figure`) for a rough estimate | `ballpark` | `ballpark figure`, `a ballpark figure`, `ball park` |
| **Practice Booth B** | **Term 3** | `q_escalate` — Action when a request exceeds your authority limit | `escalate` | `escalation`, `escalate the call`, `escalate to a supervisor` |
| **QA Scorecard Board** | **Term 3** | `q_warm` — Transfer where you brief the next agent first | `warm` | `warm transfer`, `a warm transfer`, `warm handoff` |
| **QA Scorecard Board** | **Term 3** | `q_ftr` — Back-office accuracy standard (`FTR`) | `first-time-right` | `first time right`, `ftr`, `first-time right` |

### Stage 2 — QA & Escalation Wing (Advanced Level · 6 Questions)

| Object | Chapter | Question ID & Prompt Summary | Canonical Answer (`accepted[0]`) | Other Accepted Variations |
|---|---|---|---|---|
| **QA Desk (`qa1`)** | **QA Wing** | `q_scorecard` — Weighted form used by QA to grade a contact | `scorecard` | `qa scorecard`, `quality scorecard`, `the scorecard` |
| **QA Desk (`qa1`)** | **QA Wing** | `q_fatal` — Error that drops the entire contact score to zero | `fatal` | `fatal error`, `auto-fail`, `auto fail`, `autofail`, `critical error` |
| **Calibration Table (`qa2`)** | **QA Wing** | `q_calibrate` — Session where QA, TLs, and Ops grade the same call | `calibration` | `calibrate`, `qa calibration`, `calibration session` |
| **Calibration Table (`qa2`)** | **QA Wing** | `q_escalate_rule` — What to do when a caller demands a supervisor | `escalate` | `escalation`, `warm transfer`, `transfer to supervisor` |
| **Privacy Terminal (`qa3`)** | **QA Wing** | `q_dsar` — Data subject right (`Right of _____`) exercised by a DSAR | `access` | `right of access`, `data access`, `dsar` |
| **Privacy Terminal (`qa3`)** | **QA Wing** | `q_nesting` — Supervised transition phase between training and production | `nesting` | `nesting bay`, `nesting phase`, `the nesting phase` |
