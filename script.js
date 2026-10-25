/* ============================================================================
   CallScape — script.js
   A top-down pixel-art escape-room review game for Grade 11 students of
   CONTACT CENTER SERVICES (CCS) at Emilio Jacinto National High School.
   Review scope: Term 1 to Term 3 of the CCS subject.

   Everything here is vanilla JavaScript. The file is organised in clear
   sections so the engine pieces stay separate even though they ship together:

     1. CONFIG & HELPERS      — constants, maths, colour palette
     2. ROOM DATA             — room layout, objects, their interactions
  /* ══════════════════════════════════════════════════════════════════════════
     3. STATE & SAVE          — local progress (localStorage), C#-ready shape
     4. AUDIO                 — tiny WebAudio blips (no asset files needed)
     5. QUESTIONS             — typed-answer validation
     6. DIALOGUE              — text / clue / quiz panel runner
     7. INPUT                 — keyboard + virtual joystick + buttons
     8. MOVEMENT & COLLISION  — delta-time movement, AABB resolution
     9. CAMERA                — follow camera, clamped to room bounds
    10. INTERACTION           — nearest object, line-of-sight, prompts
    11. HUD / MISSION         — objective text, clue chips, journal
    12. RENDERING             — room pre-render + pixel-art sprites
    13. GAME LOOP / BOOT      — RAF loop, resize, wiring

   HOW TO ADD A NEW ROOM
   ---------------------
   Copy the ROOM_LAB object below, give it a new `id`, change `cols`/`rows`,
   `spawn`, `walls`, `decor` and `objects`. Add it to the ROOMS map. Then make
   a door object whose `interact` returns `{ goto: 'roomId' }` via the
   `travelTo(roomId)` helper (see the end of section 10) and call
   `enterRoom('roomId')`. Objects use tile units; the engine converts them.

   HOW TO ADD AN OBJECT
   --------------------
   Push an entry into `objects`:
     { id:'unique', type:'desk'|'shelf'|'cabinet'|'door'|'notebook'|..., 
       label:'Shown in the prompt', rect:{x,y,w,h} (tiles), 
       marker:{x,y} (tiles, where the "!" floats), 
       solid:{x,y,w,h} (tiles, optional), interact:'contentKey' }
   Then add a case for its `type` in drawObject() and a content entry in
   CONTENT (section 2) that returns an array of dialogue steps.

   HOW TO ADD A QUESTION
   ---------------------
   Add it to questions.js, then reference its id from a dialogue step:
     { text:'...', quiz:'q_my_question' }
   ========================================================================== */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     1. CONFIG & HELPERS
     ══════════════════════════════════════════════════════════════════════════ */

  /** Size of one map tile in "world pixels" (the game's native art grid). */
  const TILE = 32;

  /** Player walking speed in world pixels per second. */
  const PLAYER_SPEED = 96;

  /** How close (world px) the player must be to inspect something. */
  const INTERACT_RANGE = 56;

  /** localStorage key for the local prototype save. */
  const SAVE_KEY = 'callscape.save.v2';
  /** Preferences live in their own record so they never look like a save. */
  const SETTINGS_KEY = 'callscape.settings.v1';

  /* Placeholder endpoint for the planned ASP.NET Core API (Phase 6).
     Nothing is sent in this prototype — see section 3. */
  const API_BASE = '/api'; // e.g. https://localhost:7001/api

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function pointInRect(px, py, r) {
    return px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h;
  }
  function overlapArea(a, b) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? w * h : 0;
  }

  /** Direction unit vectors used by movement, facing and interaction. */
  const DIR = {
    down:  { x: 0,  y: 1  },
    up:    { x: 0,  y: -1 },
    left:  { x: -1, y: 0  },
    right: { x: 1,  y: 0  }
  };

  /* Colour palette — one warm, slightly dusty "night classroom" scheme. */
  const C = {
    void:       '#0d0a14',
    floorA:     '#8d836c',
    floorB:     '#847a63',
    grout:      '#726a55',
    floorEdge:  '#5c5546',
    wallFace:   '#5b5470',
    wallFaceLo: '#4e4762',
    wallTop:    '#343047',
    wainscot:   '#423d55',
    baseboard:  '#2a2537',
    brick:      '#544d68',
    woodDark:   '#6a4522',
    wood:       '#8a5b2c',
    woodLit:    '#a9743c',
    woodHi:     '#c58f52',
    metal:      '#4a4a5c',
    metalLo:    '#33333f',
    metalHi:    '#6d6d84',
    screen:     '#7fd6e8',
    screenDark: '#1d3444',
    gold:       '#f7c85a',
    green:      '#86e58c',
    red:        '#ee6a72',
    cyan:       '#74e6d6',
    ink:        '#141120',
    white:      '#f5f0e6'
  };

  /* ══════════════════════════════════════════════════════════════════════════
     2. ROOM DATA
     ══════════════════════════════════════════════════════════════════════════ */

  /* Clue items. `id` is what gets stored in the save file.
     `ref` points at the matching handbook section, so the clue, the book and
     the question panel all show the same cross-reference. */
  const ITEMS = {
    q1Card: {
      icon: '☎',
      title: 'Term 1 Review Card',
      desc: 'BPO = Business Process Outsourcing. AHT = (talk + hold + ACW) ÷ calls handled — the average time spent handling one contact.',
      ref: 'Term 1 › Jargons & metrics'
    },
    q2Card: {
      icon: '◍',
      title: 'Term 2 Review Card',
      desc: 'Pitch is how high or low the voice is. Manila is UTC+8 and New York is UTC−5, so New York is 13 hours behind Manila.',
      ref: 'Term 2 › Paralanguage & voice'
    },
    q3Card: {
      icon: '✎',
      title: 'Term 3 Review Card',
      desc: 'Open questions invite a full answer. De-escalation starts with listening — let the customer finish before you clarify and act.',
      ref: 'Term 3 › Complaint handling'
    },
    /* Bonus card from the Mock Call Bay. It is NOT one of the three cards the
       exit panel demands — it is extra credit, tracked separately. */
    bayCard: {
      icon: '★',
      title: 'Mock Call Bay Bonus Card',
      desc: 'Ask permission before hold · signpost the steps · a ballpark figure is a rough estimate · escalate above your limit · brief the next agent (warm transfer) · first-time-right in the back office.',
      ref: 'Term 3 › Escalation & handoffs'
    }
  };

  /* Questions asked by the optional Mock Call Bay. Solving all of them awards
     `bayCard`. The eight in the main floor chain are unaffected. */
  const BAY_QUESTIONS = ['q_permission', 'q_signpost', 'q_ballpark', 'q_escalate', 'q_warm', 'q_ftr'];

  /* Every object in the lab is described here. Coordinates are in TILES.
     rect   — size used for drawing, distance checks and (optionally) collisions
     solid  — a collision box in tiles (defaults to rect when `blocking` is true)
     marker — where the floating "!" and the interaction prompt appear */
  const ROOM_LAB = {
    id: 'lab',
    name: 'CCS Training Floor',
    cols: 26,
    rows: 18,
    spawn: { x: 13, y: 15.4, dir: 'up' },

    /* Hard room boundaries: top wall is thick so it reads as a wall face. */
    walls: [
      { x: 0,  y: 0,  w: 26, h: 3  },
      { x: 0,  y: 17, w: 26, h: 1  },
      { x: 0,  y: 0,  w: 1,  h: 18 },
      { x: 25, y: 0,  w: 1,  h: 18 }
    ],

    /* Static decoration drawn into the pre-rendered room image. */
    decor: {
      lamps: [ { x: 5.5, y: 6.4 }, { x: 13, y: 6.4 }, { x: 20.5, y: 6.4 },
               { x: 5.5, y: 12.6 }, { x: 13, y: 12.6 }, { x: 20.5, y: 12.6 } ],
      window: { x: 17.6, y: 1.55, w: 3.4, h: 1.45 },
      posters: [
        { x: 8.6, y: 1.7, w: 2.0, h: 1.2, kind: 'ccs' },
        { x: 11.4, y: 1.75, w: 1.5, h: 1.1, kind: 'rules' }
      ],
      clock: { x: 15.4, y: 2.2 },
      rug: { x: 7.2, y: 13.4, w: 5.4, h: 2.7 },
      /* bottom-wall entrance (painted, not an object sprite) */
      entrance: { x: 12.0, w: 2.6, label: 'CCS FLOOR 2' },
      /* fitted whiteboard on the top wall */
      board: {
        x: 5.6, y: 0.55, w: 8.2, h: 2.3,
        title: 'CCS FLOOR 101',
        lines: ['AHT', 'CSAT', 'FCR', 'ADHERENCE', 'QUALITY']
      }
    },

    objects: []
  };

  /* ------------------------------------------------------------------------
     AGENTS AT THE DESKS (NPC "bots")
     Each station is staffed by a student agent. They share a thought bubble
     when you sit at their desk: a random Contact Center Services fact, tip or
     industry idiom. Content is data — add lines freely.
     ------------------------------------------------------------------------ */
  /* Seven agents share the floor with you. PC 01 (your own station) has none. */
  const BOT_NAMES = ['Ana', 'Miguel', 'Joy', 'Rico', 'Bea', 'Paolo', 'Liza'];

  /* shirt / hair colours keep the eight agents visually distinct */
  const BOT_LOOKS = [
    { shirt: '#3f7d9c', hair: '#2a1d18' },
    { shirt: '#8a5b9c', hair: '#3a2a1c' },
    { shirt: '#4c8a5e', hair: '#241a16' },
    { shirt: '#9c6a3f', hair: '#4a3423' },
    { shirt: '#6a7f9c', hair: '#2b2018' },
    { shirt: '#9c4c5f', hair: '#33241c' },
    { shirt: '#4f8f8a', hair: '#231a15' }
  ];

  /* Notes pinned above YOUR OWN station (PC 01) — no agent sits there. */
  const MY_DESK_LINES = [
    { tag: 'note', text: 'Your own station. Headset on, mic two fingers from your mouth, notes open.' },
    { tag: 'note', text: 'Log in, check the queue, and read the last note on every account before you speak.' },
    { tag: 'note', text: 'Never leave the desk on AUX. If you leave, set the right code first.' },
    { tag: 'note', text: 'Say the customer\'s name three times: greet, solve, close.' },
    { tag: 'note', text: 'One problem per contact. If you promise a callback, write the time in the CRM.' },
    { tag: 'note', text: 'Your score is built from QA, CSAT and adherence. All three are visible on the board.' },
    { tag: 'note', text: 'Stuck? Ask your team leader early rather than guessing on a live call.' }
  ];

  /* Facts, tips, jargons and idioms heard on a contact center floor. */
  const BOT_LINES = [
    { tag: 'jargon', text: 'BPO stands for Business Process Outsourcing — hiring an outside company to handle business operations.' },
    { tag: 'jargon', text: 'AHT (Average Handle Time) = (Talk + Hold + ACW) ÷ calls handled. It tracks average total time per contact.' },
    { tag: 'jargon', text: 'Floor tools: ACD routes calls to the next agent, CRM stores customer records, IVR is the phone menu.' },
    { tag: 'jargon', text: 'Voice control: PITCH is how high or low your voice sounds. Projection is volume; pacing is speed.' },
    { tag: 'jargon', text: 'Time zones: Manila (UTC+8) and New York (UTC−5) are 13 hours apart — New York is 13 hours behind Manila.' },
    { tag: 'jargon', text: 'Probing: OPEN questions (Who, What, When, Where, Why, How) invite a full answer instead of yes/no.' },
    { tag: 'jargon', text: 'De-escalation Step 1 is LISTEN — let the customer finish speaking before you empathize, clarify and act.' },
    { tag: 'jargon', text: 'Email etiquette: the SUBJECT line states the purpose of an email in a few words plus the ticket reference.' },
    { tag: 'jargon', text: 'OMNICHANNEL links phone, email, chat and social media so every channel shares one customer history.' },
    { tag: 'jargon', text: 'Hold etiquette: always ask PERMISSION and state a time estimate before placing a caller on hold.' },
    { tag: 'jargon', text: 'SIGNPOSTING means telling the caller the steps ahead ("First I will check your bill, then...").' },
    { tag: 'jargon', text: '"BALLPARK figure" is floor slang for a rough estimate — confirm the exact amount in the CRM.' },
    { tag: 'jargon', text: 'ESCALATE requests above your authority limit, and use a WARM transfer to brief the next agent first.' },
    { tag: 'jargon', text: 'FIRST-TIME-RIGHT (FTR) is the back-office standard: complete and accurate on the very first submission.' },
    { tag: 'fact',  text: 'Smiling is audible. Agents smile before the system dials.' },
    { tag: 'fact',  text: 'If it is not in the CRM, it did not happen.' },
    { tag: 'fact',  text: 'CSAT is the customer\'s score. QA score is ours. Chase both.' },
    { tag: 'fact',  text: 'The UPS only buys you a few minutes when the power drops — save the note fast.' },
    { tag: 'fact',  text: 'AUX is for work like coaching and meetings. Breaks go on the break code, or you break adherence.' },
    { tag: 'fact',  text: 'FCR: solve it on the first contact and the callback disappears.' },
    { tag: 'fact',  text: 'The ACD is the traffic enforcer — it always picks the next available agent.' },
    { tag: 'fact',  text: 'Manila is UTC+8 and New York is UTC−5. Thirteen hours apart, every shift.' },
    { tag: 'fact',  text: 'Never promise what the system cannot do. Check first, then commit.' },
    { tag: 'fact',  text: 'Escalate early. Guessing is how tickets reopen.' },
    { tag: 'tip',   text: 'Slow down for numbers, names and instructions — pacing is half of clarity.' },
    { tag: 'tip',   text: 'Read the resolution back to the customer before you close. Confirmation is free.' },
    { tag: 'idiom', text: '"Hit the ground running" — be productive from minute one of the shift.' },
    { tag: 'idiom', text: '"Learn the ropes" — the first nesting weeks, shadowing a senior agent.' },
    { tag: 'idiom', text: '"A whole different ball game" — voice accounts and non-voice accounts play by different rules.' },
    { tag: 'idiom', text: '"Back to square one" — verification failed, so you start the call flow again.' },
    { tag: 'idiom', text: '"On the same page" — read back the fix so you and the customer agree.' },
    { tag: 'idiom', text: '"Ballpark figure" — give a range, then confirm the exact amount in the CRM.' },
    { tag: 'idiom', text: '"Cut to the chase" — an angry customer wants the fix, not the small talk.' },
    { tag: 'idiom', text: '"Keep me in the loop" — update the customer while you research.' },
    { tag: 'idiom', text: '"Jump through hoops" — if the process hurts, find the shortest correct path.' },
    { tag: 'idiom', text: '"The bottom line" — the real need, in one sentence.' },
    { tag: 'idiom', text: '"On the ball" — fast, accurate and ready. The QA favourite.' },
    { tag: 'idiom', text: '"Touch base" — a quick follow-up call to confirm the fix held.' },
    { tag: 'fact',  text: '80/20 service level means 80% of calls answered inside 20 seconds. It is a queue target, not a promise.' },
    { tag: 'fact',  text: 'First Contact Resolution: solve it now and the customer never calls back. Cheapest fix there is.' },
    { tag: 'fact',  text: 'RA 10173 is the Data Privacy Act. Verify before you read any account detail aloud.' },
    { tag: 'tip',   text: 'Never put a caller on hold without permission and a time. "About two minutes" beats silence.' },
    { tag: 'tip',   text: 'Say the number back to the customer, digit by digit. Wrong digits are the classic callback.' },
    { tag: 'idiom', text: '"Learn the ropes" — the first weeks on the floor, before the process becomes habit.' },
    { tag: 'idiom', text: '"Cut to the chase" — get to the point. Useful in a huddle, never on a call.' },
    { tag: 'idiom', text: '"Back to back" — one contact immediately after another. Drink water when you can.' },
    { tag: 'idiom', text: '"Keep me in the loop" — your team leader wants the update before the customer complains.' },
    { tag: 'fact',  text: 'Nesting is the supervised week when a new agent takes live contacts. Ask everything then.' },
    /* ── heard in the QA & Escalation Wing (Room 2) ── */
    { tag: 'jargon', text: 'QA scores sampled calls on a SCORECARD. One FATAL error zeroes the whole contact.' },
    { tag: 'jargon', text: 'CALIBRATION is when QA analysts and TLs score the same call together to align standards.' },
    { tag: 'jargon', text: 'Under RA 10173, a customer asking for their records files a Data Subject ACCESS Request (DSAR).' },
    { tag: 'fact',  text: 'QA samples two to four contacts a week and scores them against the scorecard.' },
    { tag: 'fact',  text: 'One fatal error zeroes the whole sample. Verification before anything else.' },
    { tag: 'fact',  text: 'Calibration is why you can appeal a score and win: same call, same marks.' },
    { tag: 'tip',   text: 'Ask for the recording before you argue with a QA score.' },
    { tag: 'fact',  text: 'Escalation ladder: you, then the SME, then the TL, then the client team.' },
    { tag: 'tip',   text: 'A warm transfer briefs the next agent before the customer is introduced.' },
    { tag: 'fact',  text: 'RA 10173 gives the customer the right to access their own records. Log it, route it.' },
    { tag: 'idiom', text: '"Read the room" — QA coaching goes better when you agree with the recording first.' }
  ];

  /* --- student PC stations (built programmatically, 4 columns × 2 rows) --- */
  const STATION_COLS = [3, 7, 11, 15];
  const STATION_ROWS = [5.4, 9.4];
  (function buildStations() {
    let n = 1;
    STATION_ROWS.forEach(function (ry) {
      STATION_COLS.forEach(function (cx) {
        ROOM_LAB.objects.push({
          id: 'pc' + n,
          type: 'station',
          label: 'Student PC ' + String(n).padStart(2, '0'),
          rect: { x: cx, y: ry, w: 2, h: 1 },
          solid: { x: cx, y: ry, w: 2, h: 1 },
          chair: { x: cx + 0.62, y: ry + 1.02, w: 0.76, h: 0.66 },
          marker: { x: cx + 1, y: ry - 0.35 },
          screenTint: n % 2 ? C.screen : '#9fd0a8',
          interact: n === 1 ? 'pc1' : n === 2 ? 'pc2' : 'pcGeneric',
          /* PC 01 is the player's own desk: empty chair, no agent. */
          bot: n === 1 ? null : {
            name: BOT_NAMES[(n - 2) % BOT_NAMES.length],
            look: BOT_LOOKS[(n - 2) % BOT_LOOKS.length],
            seated: true,             // stands aside while the player sits here
            thought: -1,              // index into BOT_LINES
            thoughtT: 0
          }
        });
        n++;
      });
    });
  })();

  ROOM_LAB.objects.push(
    {
      id: 'bookshelf',
      type: 'shelf',
      label: 'Bookshelf',
      rect: { x: 1.6, y: 0.35, w: 3.4, h: 2.6 },
      touch: { x: 3.3, y: 3.5 },          // stand-here point (inside the room)
      marker: { x: 3.3, y: 3.02 },
      interact: 'bookshelf',
      opensBook: 't1',                    // walking up to it opens the handbook
      priority: 6
    },
    {
      id: 'poster',
      type: 'wallposter',
      label: 'Lab Rules Poster',
      rect: { x: 8.6, y: 1.7, w: 2.0, h: 1.2 },
      touch: { x: 9.6, y: 3.5 },
      marker: { x: 9.6, y: 3.02 },
      interact: 'poster'
    },
    {
      id: 'cabinet',
      type: 'cabinet',
      label: 'Storage Cabinet',
      rect: { x: 20.7, y: 3.55, w: 2.3, h: 3.0 },
      marker: { x: 21.85, y: 3.5 },
      interact: 'cabinet'
    },
    {
      id: 'teacherDesk',
      type: 'teacherdesk',
      label: "Teacher's Desk",
      rect: { x: 18.6, y: 11.35, w: 3.5, h: 1.35 },
      solid: { x: 18.6, y: 11.35, w: 3.5, h: 1.35 },
      marker: { x: 20.35, y: 11.3 }
    },
    {
      id: 'notebook',
      type: 'notebook',
      label: 'Open Notebook',
      rect: { x: 19.85, y: 11.5, w: 1.0, h: 0.55 },
      touch: { x: 20.35, y: 13.05 },      // stand in front of the desk
      parent: 'teacherDesk',              // sits on the desk; the desk never blocks it
      priority: 14,                       // beat the desk body when both are in range
      marker: { x: 20.35, y: 11.45 },
      interact: 'notebook'
    },
    {
      id: 'exitDoor',
      type: 'door',
      label: 'Lab Exit Door',
      rect: { x: 24.15, y: 13.25, w: 1.85, h: 2.75 },
      solid: { x: 24.15, y: 13.25, w: 1.85, h: 2.75 },
      marker: { x: 24.9, y: 13.15 },
      interact: 'door'
    },
    {
      id: 'entrance',
      type: 'entrance',                   // painted into the bottom wall
      label: 'Lab Entrance',
      rect: { x: 12.0, y: 17.0, w: 2.6, h: 1.0 },
      touch: { x: 13.3, y: 16.45 },
      interact: 'entrance'
    },
    {
      id: 'plant',
      type: 'plant',
      label: 'Potted Plant',
      rect: { x: 1.35, y: 14.6, w: 1.1, h: 1.2 },
      solid: { x: 1.45, y: 15.3, w: 0.85, h: 0.6 },
      low: true,
      marker: { x: 1.9, y: 14.55 },
      interact: 'plant'
    },
    {
      id: 'trash',
      type: 'trash',
      label: 'Waste Bin',
      rect: { x: 23.0, y: 15.9, w: 0.8, h: 0.9 },
      solid: { x: 23.0, y: 15.95, w: 0.8, h: 0.85 },
      low: true,
      marker: { x: 23.4, y: 15.85 },
      interact: 'trash'
    },
    {
      /* The side door to the Mock Call Bay (second room). */
      id: 'bayDoor',
      type: 'door',
      label: 'Mock Call Bay',
      rect: { x: 15.75, y: 0.6, w: 1.5, h: 2.35 },
      solid: { x: 15.75, y: 0.6, w: 1.5, h: 2.35 },
      touch: { x: 16.5, y: 3.9 },
      animated: false,          // an open archway, not the sliding exit
      interact: 'toBay',
      priority: 5
    }
  );

  /* ── THE QA & ESCALATION WING DOOR (Room 2) ───────────────────────────────
     Shut and keypad-red until the training floor is actually cleared. It sits
     on the right wall above the exit panel, so the two doors read as one
     corridor: exit = leave, wing = continue. */
  ROOM_LAB.objects.push({
    id: 'wingDoor',
    type: 'wingdoor',
    label: 'QA & Escalation Wing',
    rect: { x: 24.15, y: 4.3, w: 1.85, h: 2.75 },
    solid: { x: 24.15, y: 4.3, w: 1.85, h: 2.75 },
    touch: { x: 23.8, y: 5.85 },     // stand in front of it, inside the room
    marker: { x: 23.75, y: 4.15 },
    interact: 'toWing',
    priority: 12                     // beats the cabinet standing next to it
  });


  /* ══════════════════════════════════════════════════════════════════════════
     ROOM 2 — THE MOCK CALL BAY
     A small annex next door to the training floor: two practice booths, a QA
     scorecard board and a coaching table. Optional practice — it feeds the
     bonus review card, not the exit panel. Same object vocabulary as the lab,
     so everything (sitting, bots, handbook, collision) works unchanged.
     ══════════════════════════════════════════════════════════════════════════ */
  const ROOM_BAY = {
    id: 'bay',
    name: 'Mock Call Bay',
    cols: 20,
    rows: 14,
    spawn: { x: 16.6, y: 11.6, dir: 'left' },

    walls: [
      { x: 0,  y: 0,  w: 20, h: 3 },
      { x: 0,  y: 13, w: 20, h: 1 },
      { x: 0,  y: 0,  w: 1,  h: 14 },
      { x: 19, y: 0,  w: 1,  h: 14 }
    ],

    decor: {
      lamps: [ { x: 5.0, y: 6.6 }, { x: 12.0, y: 6.6 }, { x: 5.0, y: 10.6 }, { x: 12.0, y: 10.6 } ],
      window: { x: 16.6, y: 1.55, w: 2.0, h: 1.35 },
      posters: [ { x: 9.8, y: 1.75, w: 1.1, h: 1.05, kind: 'rules' } ],
      clock: { x: 9.3, y: 2.2 },
      rug: { x: 6.0, y: 8.4, w: 4.6, h: 2.4 },
      board: {
        x: 5.2, y: 0.55, w: 3.3, h: 2.3,
        title: 'MOCK CALL BAY',
        lines: ['HOLD', 'SIGNPOST', 'ESCALATE', 'HANDOFF', 'CLOSE']
      }
      /* no `entrance`: this room is reached through a door, not a lobby */
    },

    objects: [
      {
        id: 'bayShelf',
        type: 'shelf',
        label: 'Bay Reference Shelf',
        rect: { x: 1.5, y: 0.35, w: 3.0, h: 2.6 },
        touch: { x: 3.0, y: 3.5 },
        marker: { x: 3.0, y: 3.02 },
        interact: 'bayShelf',
        opensBook: 't3',
        priority: 6
      },

      /* Practice booth A — telephone etiquette */
      {
        id: 'boothA',
        type: 'station',
        label: 'Practice Booth A',
        rect: { x: 4.2, y: 4.6, w: 2, h: 1 },
        solid: { x: 4.2, y: 4.6, w: 2, h: 1 },
        chair: { x: 4.82, y: 5.62, w: 0.76, h: 0.66 },
        marker: { x: 5.2, y: 4.25 },
        screenTint: '#9fd0a8',
        interact: 'boothA',
        bot: {
          name: 'Nico',
          look: { shirt: '#3f7d9c', hair: '#2a1d18' },
          seated: true,
          thought: -1,
          thoughtT: 0
        }
      },

      /* Practice booth B — idioms and escalation */
      {
        id: 'boothB',
        type: 'station',
        label: 'Practice Booth B',
        rect: { x: 8.4, y: 4.6, w: 2, h: 1 },
        solid: { x: 8.4, y: 4.6, w: 2, h: 1 },
        chair: { x: 9.02, y: 5.62, w: 0.76, h: 0.66 },
        marker: { x: 9.4, y: 4.25 },
        screenTint: C.screen,
        interact: 'boothB',
        bot: {
          name: 'Tess',
          look: { shirt: '#8a5b9c', hair: '#3a2a1c' },
          seated: true,
          thought: -1,
          thoughtT: 0
        }
      },

      /* QA scorecard board on the top wall */
      {
        id: 'qaBoard',
        type: 'scoreboard',
        label: 'QA Scorecard Board',
        rect: { x: 11.5, y: 1.4, w: 3.6, h: 1.5 },
        touch: { x: 13.3, y: 3.45 },
        marker: { x: 13.3, y: 3.02 },
        interact: 'qaBoard'
      },

      /* Coaching table with the call-flow sheet */
      {
        id: 'coachTable',
        type: 'teacherdesk',
        label: 'Coaching Table',
        rect: { x: 6.4, y: 9.6, w: 3.4, h: 1.35 },
        solid: { x: 6.4, y: 9.6, w: 3.4, h: 1.35 },
        marker: { x: 8.1, y: 9.55 }
      },
      {
        id: 'coachSheet',
        type: 'notebook',
        label: 'Call-Flow Sheet',
        rect: { x: 7.6, y: 9.75, w: 1.0, h: 0.55 },
        touch: { x: 8.1, y: 11.3 },
        parent: 'coachTable',
        priority: 14,
        marker: { x: 8.1, y: 9.7 },
        interact: 'coachSheet'
      },

      /* Door back to the training floor, in the right wall */
      {
        id: 'bayExit',
        type: 'door',
        label: 'Training Floor',
        rect: { x: 17.6, y: 9.9, w: 1.5, h: 2.6 },
        solid: { x: 17.6, y: 9.9, w: 1.5, h: 2.6 },
        touch: { x: 16.3, y: 11.2 },
        marker: { x: 16.9, y: 11.0 },
        animated: false,
        interact: 'toLab',
        priority: 5
      },

      {
        id: 'bayPlant',
        type: 'plant',
        label: 'Bay Plant',
        rect: { x: 1.35, y: 11.9, w: 1.1, h: 1.2 },
        solid: { x: 1.45, y: 12.55, w: 0.85, h: 0.6 },
        low: true,
        marker: { x: 1.9, y: 11.85 },
        interact: 'bayPlant'
      },
      {
        id: 'bayTrash',
        type: 'trash',
        label: 'Waste Bin',
        rect: { x: 14.0, y: 12.0, w: 0.8, h: 0.9 },
        solid: { x: 14.0, y: 12.05, w: 0.8, h: 0.85 },
        low: true,
        marker: { x: 14.4, y: 11.95 },
        interact: 'bayTrash'
      }
    ]
  };

  /* Dialogue content is data, not logic: each key returns an array of steps.
     Step shapes:
       { text: '...' }                        → a page of text
       { text: '...', card: 'itemId' }        → also collects a clue item
       { text: '...', quiz: 'questionId' }    → shows a typed-answer box
       { text: '...', quiz: 'q', card: 'id', onSolved: fn }
       { text: '...', action: fn }            → runs fn when the step is shown
     A `card` on a quiz step is only granted once that question is solved.
     Each station asks TWO questions — covering all three terms of the
     subject before the exit opens. */
  const CONTENT = {
    bookshelf: function () {
      return [
        {
          text: 'The shelf holds the training references. The thickest binder is the ' +
                '**CCS Operations Manual** — Term 1 to Term 3, with call scripts, ' +
                'email templates and the metric formulas.\n\n' +
                'The label on the spine reads: "EVERYTHING THE TRAINING TERMINALS ASK ' +
                'IS IN HERE."'
        }
      ];
    },

    poster: function () {
      return [
        {
          text: 'CCS TRAINING FLOOR — HOUSE RULES\n\n' +
                '1. Verify the customer before you share any account detail.\n' +
                '2. Take breaks on schedule — AUX is for work, not for rest.\n' +
                '3. If it is not in the CRM, it did not happen.\n' +
                '4. Protect customer data (RA 10173).\n' +
                '5. Ask three questions before you ask your team leader.'
        },
        {
          text: 'Someone added a crooked line at the bottom: "Rule 6: the floor doors ' +
                'lock at 6 PM. Answer the terminals or sleep here."'
        },
        {
          text: 'A smaller typed memo is pinned underneath:\n\n' +
                '"Review scope for the term exam: **Term 1** operations, tools and the ' +
                'BPO industry; **Term 2** communication, voice and culture; **Term 3** ' +
                'inbound/outbound calls, non-voice and digital channels."'
        }
      ];
    },

    /* ── Station 1 (YOUR PC · Student PC 01) · Term 1 (industry + metrics) ── */
    pc1: function () {
      return [
        {
          text: 'This workstation is still logged in. A new-hire orientation deck is ' +
                'open on the monitor:\n\n' +
                '"WELCOME TO THE FLOOR — how a call travels from the customer to your ' +
                'headset, and the numbers that decide whether you did well."\n\n' +
                'Two review prompts are blinking in the corner.'
        },
        { text: 'TERMINAL 01 — TERM 1 REVIEW (1 of 2)', quiz: 'q_bpo' },
        { text: 'TERMINAL 01 — TERM 1 REVIEW (2 of 2)', quiz: 'q_aht', card: 'q1Card' },
        {
          text: 'The terminal unlocks the orientation files and prints a review card. ' +
                'Clue saved to your journal.\n\n' +
                'The cabinet keypad across the room is asking about voice control.'
        }
      ];
    },

    /* ── Station 2 · flavour: the floor tools ── */
    pc2: function () {
      return [
        {
          text: 'This station is running a call-flow demo. On screen:\n\n' +
                '  IVR: "Press 1 for billing, 2 for technical support."\n' +
                '  ACD: routing call #4471 to the next available agent...\n' +
                '  CRM: record opened — account 88213.\n\n' +
                'A sticky note on the monitor says: "CRM is the memory. ACD is the ' +
                'traffic enforcer. IVR is the menu. UPS keeps you alive when the power ' +
                'drops."'
        },
        { text: 'You leave the demo running. It is the same flow the cabinet terminal will quiz you about.' }
      ];
    },

    pcGeneric: function () {
      const notes = [
        'The screen is locked with a sticker: "ADHERENCE — breaks on schedule."',
        'A blank CRM ticket is open, cursor waiting in the notes field. Nothing else here.',
        'The knowledge base is open at the billing article. The mouse is missing its ball.',
        'A queue dashboard shows 4 chats waiting and AHT climbing. Someone is having a shift.',
        'The keyboard has a sticky note: "Never promise what the system cannot do."',
        'This station is mid-restart. The fan hums patiently.'
      ];
      const pick = notes[Math.floor(Math.random() * notes.length)];
      return [
        { text: pick },
        { text: 'This is another student\'s PC. Only your own station (**Student PC 01**), the **Storage Cabinet**, the **Teacher\'s Notebook**, and the **Mock Call Bay** booths have review questions.' }
      ];
    },

    /* ── Station 2 · Term 2 (voice + culture) ── */
    cabinet: function () {
      return [
        {
          text: 'A tall steel cabinet with a keypad. A laminated coaching card is taped ' +
                'to it:\n\n' +
                '"FLOOR KEY — two questions on Term 2. Answer both and the cabinet ' +
                'opens."\n\n' +
                'Below the keypad a red light blinks.'
        },
        { text: 'CABINET KEYPAD — TERM 2 (1 of 2)', quiz: 'q_pitch' },
        { text: 'CABINET KEYPAD — TERM 2 (2 of 2)', quiz: 'q_timezone', card: 'q2Card' },
        {
          text: 'The light turns green. The cabinet clicks open and you take the spare ' +
                'floor key plus the printed coaching card. Clue saved to your journal.'
        }
      ];
    },

    /* ── Station 3 · Term 3 (call skills) ── */
    notebook: function () {
      return [
        {
          text: "Ms. Reyes' desk. A stack of call-model cards is weighted down by a mug " +
                'that reads "WORLD\'S OKAYEST TEAM LEADER".\n\n' +
                'Beside it lies an open notebook in neat handwriting. Half of the last ' +
                'page lists the probing rule and the de-escalation model:\n\n' +
                '  open questions widen · closed questions confirm\n' +
                '  1 ?  2 Empathize  3 Clarify  4 Act  5 Confirm'
        },
        { text: "TEACHER'S NOTEBOOK — TERM 3 (1 of 2)", quiz: 'q_open' },
        { text: "TEACHER'S NOTEBOOK — TERM 3 (2 of 2)", quiz: 'q_deescalate', card: 'q3Card' },
        {
          text: 'You copy the page into your journal. The bottom line is circled twice: ' +
                '"EXIT PANEL: Complete the Training Floor, Mock Call Bay, and QA & Escalation Wing first, then take the Term 3 Final Check at the exit door."'
        }
      ];
    },

    /* ── Station 4 · Term 3 Final Check (non-voice) then the door ── */
    door: function () {
      const found = requiredCardCount();
      const solvedPreDoor = stage1PreDoorSolvedCount();
      const totalPreDoor = STAGE1_PRE_DOOR_QUESTIONS.length;
      const wingDone = wingSolvedCount();
      const wingTotal = WING_QUESTIONS.length;
      if (state.doorOpen) {
        return [{ text: 'The door stands open, cool air spilling onto the floor.\n\nStep through whenever you are ready.' }];
      }
      if (!isExitDoorReady()) {
        return [
          {
            text: 'DOOR SECURITY PANEL — LOCKED\n\n' +
                  '"REVIEW CARDS REQUIRED: ' + CLUES_REQUIRED + ' (DETECTED: ' + found + ' / ' + CLUES_REQUIRED + ')"\n' +
                  '"FLOOR & MOCK BAY QUESTIONS: ' + totalPreDoor + ' (ANSWERED: ' + solvedPreDoor + ' / ' + totalPreDoor + ')"\n' +
                  '"QA & ESCALATION WING QUESTIONS: ' + wingTotal + ' (ANSWERED: ' + wingDone + ' / ' + wingTotal + ')"\n\n' +
                  (isWingReady()
                    ? 'The **QA & Escalation Wing** door (just above this exit panel) is now OPEN! You must complete all 6 QA & Escalation Wing questions before you can unlock the Exit Door.'
                    : 'You must complete the Training Floor, the Mock Call Bay, and the QA & Escalation Wing before you can take the Exit Door final check.')
          },
          { text: missingClueHint() }
        ];
      }
      if (!state.solved.q_subject || !state.solved.q_omni) {
        return [
          {
            text: 'The panel scans your three review cards and verifies that the Training Floor, Mock Call Bay, and QA & Escalation Wing are all complete. The lock turns amber.\n\n' +
                  '"FINAL CHECK — Term 3: non-voice and digital channels."'
          },
          { text: 'EXIT PANEL — TERM 3 FINAL CHECK (1 of 2)', quiz: 'q_subject' },
          { text: 'EXIT PANEL — TERM 3 FINAL CHECK (2 of 2)', quiz: 'q_omni', onSolved: openDoor }
        ];
      }
      return [{ text: 'The panel is still waiting for you to step through.' }];
    },


    /* ══════════════════════════════════════════════════════════════════════
       MOCK CALL BAY — optional practice room
       ══════════════════════════════════════════════════════════════════════ */
    toBay: function () {
      return [
        {
          text: 'A side door marked **MOCK CALL BAY** — someone has taped a card to ' +
                'the handle:\n\n' +
                '"Practice booths. No customers were harmed. Bring your manners."'
        },
        { text: 'You push it open.', action: function () { travelTo('bay'); } }
      ];
    },

    toLab: function () {
      return [
        {
          text: 'The door back to the **CCS Training Floor**. Through the glass you can ' +
                'see the desks and the exit panel.'
        },
        { text: 'You step back onto the floor.', action: function () { travelTo('lab'); } }
      ];
    },

    bayShelf: function () {
      return [
        {
          text: 'A slimmer shelf than the one on the main floor: call-model cards, a ' +
                'stack of scorecards, and a ring binder of **live-call transcripts**.\n\n' +
                'The binder says: "READ THE CALL, THEN ANSWER THE BOOTH."'
        }
      ];
    },

    boothA: function () {
      return [
        {
          text: 'PRACTICE BOOTH A — a headset hangs on a hook beside the monitor. The ' +
                'screen is running a recorded inbound call at half speed.\n\n' +
                'On the desk: a laminated card titled **HOLD ETIQUETTE & CALL CONTROL**.'
        },
        { text: 'BOOTH A — CALL CONTROL (1 of 2)', quiz: 'q_permission' },
        { text: 'BOOTH A — CALL CONTROL (2 of 2)', quiz: 'q_signpost' },
        {
          text: 'The booth scores your answers and prints a practice slip. ' +
                'Booth B is free next door.'
        }
      ];
    },

    boothB: function () {
      return [
        {
          text: 'PRACTICE BOOTH B — the monitor shows a queue of escalation cases and a ' +
                'list of floor idioms with the plain-English versions beside them.\n\n' +
                'A note in marker: "IDIOMS ARE FOR THE HUDDLE, NOT THE CUSTOMER."'
        },
        { text: 'BOOTH B — FLOOR LANGUAGE (1 of 2)', quiz: 'q_ballpark' },
        { text: 'BOOTH B — ESCALATION (2 of 2)', quiz: 'q_escalate' },
        {
          text: 'The slip prints. One line is circled: "Escalate rather than guess."'
        }
      ];
    },

    qaBoard: function () {
      return [
        {
          text: 'QA SCORECARD BOARD\n\n' +
                'Four columns, filled in by the quality analyst:\n\n' +
                '  OPENING      greeted, identified, permission taken\n' +
                '  COMPLIANCE   verified before disclosure\n' +
                '  RESOLUTION   solved, or escalated with a handoff note\n' +
                '  CLOSING      summary, reference number, next step\n\n' +
                'Halfway down, an arrow points at the last two boxes.'
        },
        { text: 'QA BOARD — HANDOFF & ACCURACY (1 of 2)', quiz: 'q_warm' },
        { text: 'QA BOARD — HANDOFF & ACCURACY (2 of 2)', quiz: 'q_ftr' }
      ];
    },

    coachSheet: function () {
      return [
        {
          text: 'COACHING TABLE — a single laminated sheet, worn soft at the corners.\n\n' +
                '  INBOUND   1 Greet · 2 Verify · 3 Probe · 4 Solve · 5 Confirm · 6 Close · 7 Document\n' +
                '  OUTBOUND  1 Greet · 2 Permission · 3 Purpose · 4 Present · 5 Confirm · 6 Document\n\n' +
                'Underneath, in pencil: "If you cannot name the step, you are skipping it."'
        },
        {
          text: 'Someone has written the coaching rule beside it: three contacts a day ' +
                'are sampled for QA, and the notes decide whether the coaching is about ' +
                'the process or about you.'
        }
      ];
    },

    bayPlant: function () {
      return [{ text: 'A very determined plant. Somebody waters it on the night shift.' }];
    },

    bayTrash: function () {
      return [{ text: 'A bin of spent practice slips. Every one of them says "try again".' }];
    },

    entrance: function () {
      return [
        {
          text: 'The double doors you came through. A sign above them reads ' +
                '"CCS TRAINING FLOOR — HEADSETS ON, PHONES OFF".'
        },
        {
          text: 'The handles will not move. A note taped at eye level says:\n\n' +
                '"Floor doors lock at 6:00 PM. Use the EXIT panel at the far end if you ' +
                'are still inside. — Security Office"'
        }
      ];
    },

    plant: function () {
      return [{ text: 'A potted snake plant by the wall. It has survived three school years and four power interruptions — which is what the UPS is for.' }];
    },

    trash: function () {
      return [{ text: 'The waste bin is full of crumpled QA scorecards. One reads "AHT high — pacing too fast on numbers" and the rest are just failed print jobs.' }];
    },

    /* ══════════════════════════════════════════════════════════════════════
       ROOM 2 — QA & ESCALATION WING
       ══════════════════════════════════════════════════════════════════════ */

    /* The gate: the wing door opens once the Training Floor and Mock Call Bay are cleared. */
    toWing: function () {
      if (isWingReady() && !state.room2Unlocked) unlockWing(false);
      if (!state.room2Unlocked) {
        Sound.locked();
        return [
          {
            text: 'A steel door marked **QA & ESCALATION WING — AUTHORISED STAFF**. ' +
                  'The keypad is red and the shutter behind the glass is down.'
          },
          {
            text: 'The panel scrolls one line:\n\n' +
                  '  CLEARANCE REQUIRED — complete the Training Floor and Mock Call Bay first.\n' +
                  '  Review cards: ' + requiredCardCount() + ' / ' + CLUES_REQUIRED +
                  ' · Floor & Mock Bay questions: ' + stage1PreDoorSolvedCount() + ' / ' + STAGE1_PRE_DOOR_QUESTIONS.length
          },
          {
            text: 'You still have work on the floor. ' + missingClueHint()
          }
        ];
      }
      return [
        {
          text: 'The **QA & ESCALATION WING**. The keypad is green and the shutter is up.\n\n' +
                'Through the glass: scorecard boards, a nesting pod, and someone on a ' +
                'headset scoring a recorded call. Complete all 6 QA Wing questions here before unlocking the Exit Door.'
        },
        { text: 'You shoulder the door open.', action: function () { travelToLab2(); } }
      ];
    },

    toLabWing: function () {
      return [
        {
          text: state.room2Cleared
            ? 'The door back to the **CCS Training Floor**. All QA Wing consoles are complete — head to the Exit Door right below this doorway!'
            : 'The door back to the **CCS Training Floor**.'
        },
        { text: 'You step back onto the floor.', action: function () { travelToLab(); } }
      ];
    },

    wingShelf: function () {
      return [
        {
          text: 'The wing shelf is all reference: scorecards in plastic wallets, a binder ' +
                'of **calibration recordings**, and the wing edition of the operations manual.'
        }
      ];
    },

    nestingPod: function () {
      return [
        {
          text: 'NESTING POD — a headset on a hook, a monitor playing a recorded call back ' +
                'at half speed, and a printed **scorecard** taped to the divider.\n\n' +
                'Coach Mira taps the sheet: "Two to four samples a week. Every mark is a ' +
                'behaviour, not a mood."'
        },
        { text: 'SCORECARD REVIEW (1 of 2)', quiz: 'q_scorecard' },
        { text: 'SCORECARD REVIEW (2 of 2)', quiz: 'q_fatal' },
        {
          text: 'Mira marks the sample, then turns the monitor towards you.\n\n' +
                '"Read your own recording before you argue with a score. Then argue with ' +
                'the recording, not with me."'
        }
      ];
    },

    tlDesk: function () {
      return [
        {
          text: 'ESCALATION DESK — two phones (one of them red), a tier list pinned to ' +
                'the desk, and a stack of case notes. TL Dev is reading one of them.\n\n' +
                '"Everything above your authority comes to me. With notes."'
        },
        { text: 'ESCALATION PRACTICE (1 of 2)', quiz: 'q_escalate_rule' },
        { text: 'ESCALATION PRACTICE (2 of 2)', quiz: 'q_dsar' },
        {
          text: 'Dev initials the note and drops it in the tray.\n\n' +
                '"A case that arrives with notes takes ten minutes. The same case with a ' +
                'guess attached takes a week."'
        }
      ];
    },

    qaConsole: function () {
      return [
        {
          text: 'QA CONSOLE — four live meters: **QA score**, **CSAT**, **fatal errors**, ' +
                '**calibrated this week**. One of them is amber.\n\n' +
                'A panel underneath reads: "CALIBRATION — agree on the standard before you ' +
                'score the agent."'
        },
        { text: 'CONSOLE CHECK (1 of 2)', quiz: 'q_calibrate' },
        { text: 'CONSOLE CHECK (2 of 2)', quiz: 'q_nesting' },
        {
          text: 'The console logs your answers and prints a calibration slip. ' +
                'The amber meter flickers back to green.'
        }
      ];
    },

    /* Relics are one-shot collectibles, not quizzes. */
    relic: function (o) {
      const id = (o && o.relic) || 'qaRubric';
      const item = RELICS[id];
      if (!item) return [{ text: 'A display plinth. Nothing on it.' }];
      if (hasRelic(id)) {
        return [{ text: 'The plinth for the **' + item.title + '** — already in your journal.\n\n' + item.desc }];
      }
      return [
        {
          text: 'A lit plinth in the wing. On it: the **' + item.title + '**.\n\n' + item.desc
        },
        { text: 'You record it in the journal.', action: function () { takeRelic(id, o); } }
      ];
    },

    rack: function () {
      return [
        {
          text: 'RECORDING SERVER RACK — thirty-two sampled calls, encrypted at rest, ' +
                'retained for the account\'s audit window.\n\n' +
                'Every sample in here is somebody\'s shift. Yours will be too.'
        }
      ];
    },

    cooler: function () {
      return [{ text: 'The water cooler. Half the wing\'s real coaching happens here — which is also why the TL keeps walking past it.' }];
    },

    wingPlant: function () {
      return [{ text: 'A fern that has clearly been over-watered by three different shifts. Nobody will admit to it.' }];
    },

    wingTrash: function () {
      return [{ text: 'A shredding bin, cross-cut. Wing rule: anything with a customer name on it goes through the shredder, never the ordinary bin.' }];
    }
  };

  /* Send the student to the right place based on what is still missing. */
  function missingClueHint() {
    if (!hasClue('q1Card') || !state.solved.q_bpo || !state.solved.q_aht) {
      return 'Aim: your station (Student PC 01 in the front row) still has unanswered Term 1 questions.';
    }
    if (!hasClue('q2Card') || !state.solved.q_pitch || !state.solved.q_timezone) {
      return 'Aim: the Storage Cabinet by the right wall still has unanswered Term 2 questions.';
    }
    if (!hasClue('q3Card') || !state.solved.q_open || !state.solved.q_deescalate) {
      return "Aim: Ms. Reyes' Open Notebook at the teacher's desk still has unanswered Term 3 questions.";
    }
    if (!state.solved.q_permission || !state.solved.q_signpost) {
      return 'Aim: enter the Mock Call Bay through the top-wall door and answer Practice Booth A.';
    }
    if (!state.solved.q_ballpark || !state.solved.q_escalate) {
      return 'Aim: enter the Mock Call Bay through the top-wall door and answer Practice Booth B.';
    }
    if (!state.solved.q_warm || !state.solved.q_ftr) {
      return 'Aim: enter the Mock Call Bay through the top-wall door and answer the QA Scorecard Board.';
    }
    if (!state.solved.q_scorecard || !state.solved.q_fatal) {
      return 'Aim: enter the QA & Escalation Wing through the upper-right door and complete the Nesting Pod.';
    }
    if (!state.solved.q_escalate_rule || !state.solved.q_dsar) {
      return 'Aim: enter the QA & Escalation Wing through the upper-right door and complete the Team Leader Desk.';
    }
    if (!state.solved.q_calibrate || !state.solved.q_nesting) {
      return 'Aim: enter the QA & Escalation Wing through the upper-right door and complete the QA Calibration Console.';
    }
    return 'Aim: head to the exit door on the right wall to answer the final check.';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ROOM 3 — THE QA & ESCALATION WING        (the unlockable second room)
     ---------------------------------------------------------------------
     Same object vocabulary as the other two rooms (stations, desks, doors,
     shelves, relics), but a cold steel-and-teal theme instead of the warm
     training-floor palette, so it reads as a different part of the building.
     It opens only when `state.room2Unlocked` is true — set by clearing the
     training floor, and persisted in the save.
     ══════════════════════════════════════════════════════════════════════════ */
  const ROOM_WING = {
    id: 'lab2',
    name: 'QA & Escalation Wing',
    cols: 22,
    rows: 16,
    spawn: { x: 3.4, y: 11.6, dir: 'right' },

    /* colder palette — the prerender reads these before falling back to C.* */
    theme: {
      void: '#070b10',
      floorA: '#5c6a76',
      floorB: '#556270',
      wallFace: '#33424f',
      wallFaceLo: '#2b3844',
      brick: '#3b4c5a',
      wainscot: '#25313c',
      baseboard: '#18222b',
      light: '168,232,255'
    },

    walls: [
      { x: 0,  y: 0,  w: 22, h: 3 },
      { x: 0,  y: 15, w: 22, h: 1 },
      { x: 0,  y: 0,  w: 1,  h: 16 },
      { x: 21, y: 0,  w: 1,  h: 16 }
    ],

    decor: {
      lamps: [ { x: 4.5, y: 7.4 }, { x: 11.0, y: 7.4 }, { x: 17.5, y: 7.4 },
               { x: 4.5, y: 12.6 }, { x: 11.0, y: 12.6 }, { x: 17.5, y: 12.6 } ],
      window: { x: 17.9, y: 1.15, w: 2.4, h: 1.4 },
      posters: [ { x: 8.3, y: 1.7, w: 1.9, h: 1.15, kind: 'rules' } ],
      clock: { x: 7.5, y: 2.15 },
      rug: { x: 9.6, y: 11.2, w: 4.4, h: 2.3 },
      board: {
        x: 10.6, y: 0.6, w: 5.0, h: 2.15,
        title: 'QA WING — SCORECARD',
        lines: ['VERIFY', 'HOLD', 'NOTES', 'ESCALATE', 'CLOSE']
      }
      /* no `entrance`: this wing is reached through the floor door */
    },

    objects: [
      /* ── the way back to the training floor (left wall) ── */
      {
        id: 'wingReturn',
        type: 'door',
        label: 'Training Floor',
        rect: { x: 0.05, y: 9.9, w: 1.7, h: 2.6 },
        solid: { x: 0.05, y: 9.9, w: 1.7, h: 2.6 },
        touch: { x: 2.05, y: 10.9 },
        marker: { x: 2.0, y: 9.8 },
        animated: false,
        interact: 'toLabWing',
        priority: 6
      },

      /* ── the wing's reading shelf: opens the QA Wing handbook chapter ── */
      {
        id: 'wingShelf',
        type: 'shelf',
        label: 'QA Reference Shelf',
        rect: { x: 1.4, y: 0.35, w: 3.0, h: 2.6 },
        touch: { x: 2.9, y: 3.5 },
        marker: { x: 2.9, y: 3.02 },
        interact: 'wingShelf',
        opensBook: 'qa',
        priority: 6
      },

      /* ── nesting pod: Coach Mira, QA scoring ── */
      {
        id: 'nestingPod',
        type: 'pod',
        label: 'Nesting Pod',
        rect: { x: 4.6, y: 4.4, w: 2.2, h: 1.05 },
        solid: { x: 4.6, y: 4.4, w: 2.2, h: 1.05 },
        chair: { x: 5.32, y: 5.47, w: 0.76, h: 0.66 },
        marker: { x: 5.7, y: 4.05 },
        screenTint: '#9fd0a8',
        interact: 'nestingPod',
        bot: {
          name: 'Coach Mira',
          look: { shirt: '#3f7d9c', hair: '#241a16' },
          seated: true, thought: -1, thoughtT: 0
        }
      },

      /* ── escalation desk: TL Dev ── */
      {
        id: 'tlDesk',
        type: 'station',
        label: 'Escalation Desk',
        rect: { x: 12.4, y: 4.3, w: 2.2, h: 1.0 },
        solid: { x: 12.4, y: 4.3, w: 2.2, h: 1.0 },
        chair: { x: 13.12, y: 5.32, w: 0.76, h: 0.66 },
        marker: { x: 13.5, y: 3.95 },
        screenTint: '#f0b0a0',
        interact: 'tlDesk',
        bot: {
          name: 'TL Dev',
          look: { shirt: '#8a5b9c', hair: '#2a1d18' },
          seated: true, thought: -1, thoughtT: 0
        }
      },

      /* ── wall console: calibration + nesting questions ── */
      {
        id: 'qaConsole',
        type: 'qaconsole',
        label: 'QA Console',
        rect: { x: 17.2, y: 0.7, w: 3.0, h: 2.15 },
        touch: { x: 18.7, y: 3.5 },
        marker: { x: 18.7, y: 3.05 },
        interact: 'qaConsole',
        priority: 20                   // beats the rack standing below it
      },

      /* ── server rack: blinking, readable ── */
      {
        id: 'serverRack',
        type: 'rack',
        label: 'Recording Server Rack',
        rect: { x: 19.2, y: 4.0, w: 1.5, h: 3.2 },
        solid: { x: 19.2, y: 4.0, w: 1.5, h: 3.2 },
        marker: { x: 19.95, y: 3.9 },
        interact: 'rack'
      },

      /* ── QA work table with the headset relic on it ── */
      {
        id: 'qaTable',
        type: 'teacherdesk',
        label: 'QA Work Table',
        rect: { x: 9.2, y: 8.6, w: 3.4, h: 1.35 },
        solid: { x: 9.2, y: 8.6, w: 3.4, h: 1.35 },
        marker: { x: 10.9, y: 8.55 }
      },
      {
        id: 'relicHeadset',
        type: 'relic',
        label: 'QA Headset Trophy',
        relic: 'qaHeadset',
        rect: { x: 10.1, y: 8.78, w: 0.9, h: 0.5 },
        touch: { x: 10.55, y: 10.2 },
        parent: 'qaTable',
        marker: { x: 10.55, y: 8.6 },
        interact: 'relic',
        priority: 14
      },

      /* ── two floor relics ── */
      {
        id: 'relicRubric',
        type: 'relic',
        label: 'Calibration Rubric',
        relic: 'qaRubric',
        rect: { x: 6.1, y: 11.9, w: 1.0, h: 1.1 },
        solid: { x: 6.1, y: 12.35, w: 1.0, h: 0.65 },
        low: true,
        marker: { x: 6.6, y: 11.8 },
        interact: 'relic'
      },
      {
        id: 'relicMatrix',
        type: 'relic',
        label: 'Escalation Matrix Card',
        relic: 'qaMatrix',
        rect: { x: 14.6, y: 12.3, w: 1.0, h: 1.1 },
        solid: { x: 14.6, y: 12.75, w: 1.0, h: 0.65 },
        low: true,
        marker: { x: 15.1, y: 12.2 },
        interact: 'relic'
      },

      /* ── wing flavour ── */
      {
        id: 'waterCooler',
        type: 'cooler',
        label: 'Water Cooler',
        rect: { x: 19.6, y: 12.1, w: 1.1, h: 1.4 },
        solid: { x: 19.6, y: 12.6, w: 1.1, h: 0.9 },
        low: true,
        marker: { x: 20.15, y: 12.0 },
        interact: 'cooler'
      },
      {
        id: 'wingPlant',
        type: 'plant',
        label: 'Wing Plant',
        rect: { x: 1.5, y: 6.3, w: 1.1, h: 1.2 },
        solid: { x: 1.6, y: 7.0, w: 0.85, h: 0.6 },
        low: true,
        marker: { x: 2.05, y: 6.25 },
        interact: 'wingPlant'
      },
      {
        id: 'wingTrash',
        type: 'trash',
        label: 'Shredding Bin',
        rect: { x: 20.2, y: 9.3, w: 0.8, h: 0.9 },
        solid: { x: 20.2, y: 9.35, w: 0.8, h: 0.85 },
        low: true,
        marker: { x: 20.6, y: 9.25 },
        interact: 'wingTrash'
      }
    ]
  };

  /* The three wing relics. Collected once each, tracked in state.relics. */
  const RELICS = {
    qaRubric: {
      icon: '◈',
      title: 'Calibration Rubric',
      desc: 'Analysts score the same recording, then compare marks until they agree on the standard.',
      ref: 'QA Wing › Calibration'
    },
    qaHeadset: {
      icon: '☊',
      title: 'QA Headset Trophy',
      desc: 'Awarded for a perfect scorecard: verification, hold etiquette, notes and closing all clean.',
      ref: 'QA Wing › The scorecard'
    },
    qaMatrix: {
      icon: '▥',
      title: 'Escalation Matrix Card',
      desc: 'Tier 1 you · Tier 2 SME · Tier 3 TL · Tier 4 client. Escalate with notes, never guess.',
      ref: 'QA Wing › Escalation ladder'
    }
  };
  const WING_RELICS = ['qaRubric', 'qaHeadset', 'qaMatrix'];

  /* The six wing questions, grouped by the object that asks them. */
  const WING_QUESTIONS = ['q_scorecard', 'q_fatal', 'q_calibrate', 'q_escalate_rule', 'q_dsar', 'q_nesting'];

  /* Stage 1 required cards and all 12 pre-door questions (6 main + 6 floor/bay). */
  const REQUIRED_CARDS = ['q1Card', 'q2Card', 'q3Card'];
  const MAIN_QUESTIONS = ['q_bpo', 'q_aht', 'q_pitch', 'q_timezone', 'q_open', 'q_deescalate'];
  const STAGE1_PRE_DOOR_QUESTIONS = MAIN_QUESTIONS.concat(BAY_QUESTIONS); // 12 questions before exit door

  function requiredCardCount() {
    let n = 0;
    for (let i = 0; i < REQUIRED_CARDS.length; i++) if (hasClue(REQUIRED_CARDS[i])) n++;
    return n;
  }

  function stage1PreDoorSolvedCount() {
    let n = 0;
    for (let i = 0; i < STAGE1_PRE_DOOR_QUESTIONS.length; i++) {
      if (state.solved[STAGE1_PRE_DOOR_QUESTIONS[i]]) n++;
    }
    return n;
  }

  function isWingReady() {
    return requiredCardCount() >= REQUIRED_CARDS.length &&
           stage1PreDoorSolvedCount() >= STAGE1_PRE_DOOR_QUESTIONS.length;
  }

  function isExitDoorReady() {
    return isWingReady() &&
           wingSolvedCount() >= WING_QUESTIONS.length;
  }

  const ROOMS = { lab: ROOM_LAB, bay: ROOM_BAY, lab2: ROOM_WING };

  /* Which objects show a floating marker, and when.
     'new' = puzzle still to solve · 'done' = solved · 'info' = readable
     'book' = reference you can read · 'locked' / 'open' = door state. */
  const MARKER_RULES = {
    pc1:       () => (state.solved.q_bpo && state.solved.q_aht ? 'done' : 'new'),
    cabinet:   () => (state.solved.q_pitch && state.solved.q_timezone ? 'done' : 'new'),
    notebook:  () => (state.solved.q_open && state.solved.q_deescalate ? 'done' : 'new'),
    bookshelf: () => 'book',
    poster:    () => 'info',
    bayShelf:  () => 'book',
    boothA:    () => (state.solved.q_permission && state.solved.q_signpost ? 'done' : 'new'),
    boothB:    () => (state.solved.q_ballpark && state.solved.q_escalate ? 'done' : 'new'),
    qaBoard:   () => (state.solved.q_warm && state.solved.q_ftr ? 'done' : 'new'),
    bayExit:   () => 'info',
    coachSheet: () => 'info',
    door:      () => (state.doorOpen ? 'open'
                     : (isExitDoorReady() ? 'new' : 'locked')),
    /* Room 2 */
    toWing:      () => (wingSolvedCount() >= WING_QUESTIONS.length ? 'done'
                       : ((state.room2Unlocked || isWingReady()) ? 'open' : 'locked')),
    toLabWing:   () => 'info',
    wingShelf:   () => 'book',
    nestingPod:  () => (state.solved.q_scorecard && state.solved.q_fatal ? 'done' : 'new'),
    tlDesk:      () => (state.solved.q_escalate_rule && state.solved.q_dsar ? 'done' : 'new'),
    qaConsole:   () => (state.solved.q_calibrate && state.solved.q_nesting ? 'done' : 'new'),
    relic:       (o) => (o && hasRelic(o.relic) ? 'done' : 'new'),
    rack:        () => 'info',
    cooler:      () => 'info',
    wingPlant:   () => 'info',
    wingTrash:   () => 'info'
  };

  /* How many clues the exit panel demands. */
  const CLUES_REQUIRED = 3;

  /* ══════════════════════════════════════════════════════════════════════════
     3. STATE & SAVE + SETTINGS
     ---------------------------------------------------------------------
     Two separate records live in localStorage:
       callscape.save.v2      progress only (written while a run is active)
       callscape.settings.v1  player preferences (survive restarts without
                              creating a "resumable" save)
     The progress payload is deliberately a plain JSON object that maps 1:1
     onto the planned C# DTO (GameProgressDto). When the ASP.NET Core API is
     ready, swap saveLocal()/loadLocal() for HTTP calls — nothing else in the
     engine needs to change.
     ══════════════════════════════════════════════════════════════════════════ */

  const state = {
    version: 2,
    roomId: 'lab',
    clues: [],              // string[] of ITEMS keys
    solved: {},             // { questionId: true }
    attempts: {},           // { questionId: { correct: n, wrong: n } }
    doorOpen: false,
    completed: false,
    /* v2.1 — ROOM 2 (QA & Escalation Wing). All of these persist. */
    room2Unlocked: false,   // set by actually clearing the training floor
    afterWin: false,        // true once the player continues past the results panel
    room2Cleared: false,    // every wing question answered
    relics: [],             // relic ids collected in the wing
    claimed: {},            // one-time reward ids — nothing pays out twice
    letterHints: {},        // { questionId: number of letter-hint steps unlocked }
    elapsed: 0,             // seconds of active play
    started: false,
    paused: true,
    /* preferences (mirrored to the settings record) */
    sound: true,
    hints: true,
    promptOn: true,
    joystickSide: 'left',
    textSize: 'normal'
  };

  function hasClue(id) { return state.clues.indexOf(id) !== -1; }

  /* ── Room 2 helpers ───────────────────────────────────────────────────── */
  function hasRelic(id) { return state.relics.indexOf(id) !== -1; }
  function relicCount() {
    let n = 0;
    for (let i = 0; i < WING_RELICS.length; i++) if (hasRelic(WING_RELICS[i])) n++;
    return n;
  }
  function wingSolvedCount() {
    let n = 0;
    for (let i = 0; i < WING_QUESTIONS.length; i++) if (state.solved[WING_QUESTIONS[i]]) n++;
    return n;
  }
  /** The run is finished AND the player has not chosen to keep exploring. */
  function roundOver() { return state.completed && !state.afterWin; }

  /** One-time reward guard: true only the first time a claim id is used. */
  function claim(id) {
    if (!id) return false;
    if (state.claimed[id]) return false;
    state.claimed[id] = true;
    return true;
  }

  function attemptFor(qid) {
    if (!state.attempts[qid]) state.attempts[qid] = { correct: 0, wrong: 0 };
    return state.attempts[qid];
  }

  /* ---------- progress: offline save --------------------------------------
     Written only while a run is active, so browsing the menu never creates a
     phantom save. Everything is wrapped in try/catch because some environments
     (sandboxed iframes, private mode) throw on localStorage access. */
  function saveLocal() {
    if (!state.started) return;
    try {
      const payload = {
        version: state.version,
        roomId: state.roomId,
        clues: state.clues,
        solved: state.solved,
        attempts: state.attempts,
        doorOpen: state.doorOpen,
        completed: state.completed,
        bonus: !!state.bonus,
        /* v2.1: room-2 unlock + wing progress (optional for older saves) */
        room2Unlocked: !!state.room2Unlocked,
        afterWin: !!state.afterWin,
        room2Cleared: !!state.room2Cleared,
        relics: state.relics.slice(),
        claimed: state.claimed,
        letterHints: state.letterHints,
        /* v2.0: optional in the v2 payload — older saves simply omit it */
        prog: Progression.snapshot(),
        elapsed: Math.round(state.elapsed),
        player: { x: Math.round(player.x), y: Math.round(player.y), dir: player.dir },
        seated: player.seated ? player.seated.id : null,
        agent: player.seated && player.seated.bot
          ? { name: player.seated.bot.name, thought: BOT_LINES[player.seated.bot.thought] || null }
          : player.seated ? { name: null, own: true, thought: MY_DESK_LINES[player.selfThought] || null }
          : null,
        savedAt: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (err) { /* storage blocked — the game still runs */ }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== state.version) return null;
      return data;
    } catch (err) { return null; }
  }

  function clearLocal() {
    try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
  }

  /** Copy a saved payload into live state (does not touch preferences). */
  function applySave(data) {
    state.clues = Array.isArray(data.clues) ? data.clues.filter(k => ITEMS[k]) : [];
    state.solved = data.solved && typeof data.solved === 'object' ? data.solved : {};
    state.attempts = data.attempts && typeof data.attempts === 'object' ? data.attempts : {};
    state.doorOpen = !!data.doorOpen;
    state.completed = !!data.completed;
    state.bonus = !!data.bonus;
    state.elapsed = Number(data.elapsed) || 0;
    /* Room 2: unlocks as soon as Stage 1 (Training Floor) and Stage 2 (Mock Call Bay) are complete. */
    state.room2Unlocked = !!data.room2Unlocked || !!data.completed || isWingReady();
    state.afterWin = !!data.afterWin;
    state.room2Cleared = !!data.room2Cleared || (wingSolvedCount() >= WING_QUESTIONS.length);
    state.relics = Array.isArray(data.relics) ? data.relics.filter(function (k) { return !!RELICS[k]; }) : [];
    state.claimed = (data.claimed && typeof data.claimed === 'object') ? data.claimed : {};
    state.letterHints = (data.letterHints && typeof data.letterHints === 'object') ? data.letterHints : {};
    /* rewards are optional: a v2 save written before v2.0 restores as level 1 */
    Progression.restore(data.prog || null);
    renderProgHud();
    renderObjectives();
    if (data.player && isFinite(data.player.x) && isFinite(data.player.y)) {
      player.x = clamp(data.player.x, TILE, (room.cols - 1) * TILE);
      player.y = clamp(data.player.y, TILE, (room.rows - 1) * TILE);
      player.dir = DIR[data.player.dir] ? data.player.dir : 'up';
    }
    if (data.seated) restoreSeat(data.seated);
  }

  /* ---------- preferences: settings record -------------------------------- */
  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        sound: state.sound,
        hints: state.hints,
        promptOn: state.promptOn,
        joystickSide: state.joystickSide,
        textSize: state.textSize,
        device: state.device
      }));
    } catch (err) {}
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s) return;
      if (typeof s.sound === 'boolean') state.sound = s.sound;
      if (typeof s.hints === 'boolean') state.hints = s.hints;
      if (typeof s.promptOn === 'boolean') state.promptOn = s.promptOn;
      if (s.joystickSide === 'left' || s.joystickSide === 'right') state.joystickSide = s.joystickSide;
      if (s.textSize === 'normal' || s.textSize === 'large') state.textSize = s.textSize;
      if (s.device === 'pc' || s.device === 'phone') state.device = s.device;
    } catch (err) {}
  }

  /** Auto-detect: coarse pointer / touch-only devices get the touch UI. */
  function autoTouch() {
    try { return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; }
    catch (e) { return false; }
  }

  /** Re-apply the device choice: body classes, control hints, joystick scheme. */
  function applyDeviceMode() {
    const phone = state.device === 'phone' || (state.device === null && autoTouch());
    IS_TOUCH = phone;
    document.body.classList.toggle('device-phone', phone);
    document.body.classList.toggle('device-pc', !phone);
    if (el.joy) el.joy.setAttribute('aria-hidden', phone ? 'false' : 'true');
    if (el.btnAct) el.btnAct.setAttribute('aria-label',
      phone ? 'Interact with the object in front of you' : 'Interact with object (E)');
  }

  /** Push preference values into the DOM (body classes + widget states). */
  function applySettings() {
    document.body.classList.toggle('hand-right', state.joystickSide === 'right');
    document.body.classList.toggle('text-large', state.textSize === 'large');
    applyDeviceMode();
    if (el.btnSound) {
      el.btnSound.classList.toggle('is-off', !state.sound);
      el.btnSound.textContent = state.sound ? '♪' : '✕';
    }
    syncSettingUI();
  }

  /** Highlight the active option in every segmented control. */
  function syncSettingUI() {
    if (!el.setList) return;
    el.setList.querySelectorAll('.seg').forEach(function (seg) {
      const key = seg.getAttribute('data-setting');
      let value = null;
      if (key === 'sound') value = state.sound ? 'on' : 'off';
      else if (key === 'hints') value = state.hints ? 'on' : 'off';
      else if (key === 'prompt') value = state.promptOn ? 'on' : 'off';
      else if (key === 'joystick') value = state.joystickSide;
      else if (key === 'textsize') value = state.textSize;
      else if (key === 'device') value = state.device;
      seg.querySelectorAll('.seg__btn').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-value') === value);
      });
    });
    if (el.settingsSaveDesc) {
      const saved = loadLocal();
      el.settingsSaveDesc.textContent = saved
        ? 'Saved on this device · ' + describeSave(saved)
        : 'No save on this device yet.';
    }
    if (el.btnWipe) el.btnWipe.disabled = !loadLocal();
  }

  /** Human summary of a save record, used by the menu and settings. */
  function describeSave(data) {
    const clues = (data.clues || []).length;
    const solved = Object.keys(data.solved || {}).length;
    const mins = Math.floor((data.elapsed || 0) / 60);
    const secs = Math.round((data.elapsed || 0) % 60);
    const bits = [];
    if (data.completed) bits.push('completed');
    else if (data.doorOpen) bits.push('exit unlocked');
    else bits.push('in progress');
    bits.push(clues + '/' + CLUES_REQUIRED + ' clues');
    bits.push(solved + '/' + Object.keys(Questions.all()).length + ' questions');
    bits.push(mins + 'm ' + String(secs).padStart(2, '0') + 's');
    if (data.seated) bits.push('seated at ' + data.seated.replace(/^pc/, 'PC '));
    return bits.join(' · ');
  }

  function timeAgo(ts) {
    if (!ts) return 'just now';
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 45) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  }

  /* ── planned backend seam (Phase 6, not implemented yet) ─────────────────
     These are intentionally inert. They document the future contract without
     pretending any server exists.
       POST /api/auth/login        → student session (JWT, hashed passwords)
       GET  /api/progress/{id}     → GameProgressDto
       PUT  /api/progress/{id}     → save the object exported by snapshot()
       POST /api/attempts          → { questionId, correct, seconds, roomId }
     ─────────────────────────────────────────────────────────────────────── */
  const Backend = {
    enabled: false,          // flip on only after the API exists and is tested
    baseUrl: API_BASE,
    snapshot() {
      return {
        roomId: state.roomId,
        clues: state.clues.slice(),
        solved: Object.assign({}, state.solved),
        attempts: JSON.parse(JSON.stringify(state.attempts)),
        doorOpen: state.doorOpen,
        completed: state.completed,
        bonus: !!state.bonus,
        elapsedSeconds: Math.round(state.elapsed)
      };
    },
    async saveProgress() { return { ok: false, reason: 'backend-not-implemented' }; },
    async recordAttempt() { return { ok: false, reason: 'backend-not-implemented' }; }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     4. AUDIO — tiny synthesised blips, no audio files required
     ══════════════════════════════════════════════════════════════════════════ */

  const Sound = {
    ctx: null,
    master: null,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.ctx.destination);
      } catch (err) { this.ctx = null; }
    },
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    blip(freq, dur, type, vol, slideTo) {
      if (!state.sound) return;
      this.init();
      if (!this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(this.master);
      osc.start(t); osc.stop(t + dur + 0.02);
    },
    step()    { this.blip(150 + Math.random() * 40, 0.05, 'triangle', 0.16); },
    interact(){ this.blip(520, 0.07, 'square', 0.28); },
    pickup()  { this.blip(660, 0.09, 'square', 0.3); setTimeout(() => this.blip(990, 0.12, 'square', 0.28), 85); },
    good()    { this.blip(523, 0.1, 'square', 0.3); setTimeout(() => this.blip(659, 0.1, 'square', 0.3), 90); setTimeout(() => this.blip(880, 0.18, 'square', 0.3), 180); },
    bad()     { this.blip(220, 0.18, 'sawtooth', 0.24, 110); },
    locked()  { this.blip(140, 0.16, 'square', 0.24, 90); setTimeout(() => this.blip(110, 0.2, 'square', 0.2, 70), 130); },
    door()    { this.blip(90, 0.5, 'sawtooth', 0.18, 60); setTimeout(() => this.blip(320, 0.2, 'square', 0.2), 260); },
    /* paper: a short filtered noise sweep, not a tone */
    page() {
      if (!state.sound) return;
      this.init();
      if (!this.ctx) return;
      this.resume();
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * 0.16);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.5;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.frequency.exponentialRampToValueAtTime(900, t + 0.16);
      filter.Q.value = 0.9;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      src.connect(filter); filter.connect(gain); gain.connect(this.master);
      src.start(t);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     5. QUESTIONS — typed-answer checking (data lives in questions.js)
     ══════════════════════════════════════════════════════════════════════════ */

  const Questions = {
    all() { return window.CALLSCAPE_QUESTIONS || {}; },
    get(id) { return this.all()[id] || null; },
    /** Trim, lower-case, collapse spaces and drop trailing punctuation. */
    normalize(value) {
      return String(value == null ? '' : value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.!?,;]+$/g, '')
        .trim();
    },
    /** Returns { ok, empty, missing } — never mutates state. */
    check(id, raw) {
      const q = this.get(id);
      if (!q) return { ok: false, missing: true };
      const value = this.normalize(raw);
      if (!value) return { ok: false, empty: true };
      const accepted = (q.accepted || []).map(a => this.normalize(a));
      let ok = accepted.indexOf(value) !== -1;
      /* Numeric items also accept the figure followed by a unit word
         ("13", "13 hours", "13 hrs"). */
      if (!ok && q.numeric) {
        const m = value.match(/^(\d+)\s*(hours?|hrs?|h)?$/);
        if (m) ok = accepted.indexOf(m[1]) !== -1;
      }
      return { ok: ok, value: value };
    },
    record(id, correct) {
      const a = attemptFor(id);
      if (correct) {
        a.correct++;
        state.solved[id] = true;
        /* rewards only on a real completion: first try = bonus tier */
        Progression.onCorrect(id, a.correct === 1 && a.wrong === 0);
        checkBayBonus();
        checkWingUnlock();
      } else {
        a.wrong++;
        Progression.onWrong(id);
      }
      saveLocal();
      if (Backend.enabled) { Backend.recordAttempt({ questionId: id, correct: correct }); }
      return a;
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     6. DIALOGUE — text pages, clue cards and the typed-answer form
     ══════════════════════════════════════════════════════════════════════════ */

  const Dialogue = {
    open: false,
    steps: [],
    index: 0,
    speaker: '',
    stepLocked: false,    // true while a quiz step is still unsolved
    onClose: null,

    show(speaker, steps, onClose) {
      this.open = true;
      this.steps = steps || [];
      this.index = 0;
      this.speaker = speaker || '';
      this.onClose = onClose || null;
      this.stepLocked = false;
      el.dialogue.hidden = false;
      el.quizForm.hidden = true;
      el.itemCard.hidden = true;
      player.moving = false;
      this.render();
    },

    current() { return this.steps[this.index] || null; },

    render() {
      const step = this.current();
      if (!step) { this.close(); return; }

      if (el.dlgBody) el.dlgBody.scrollTop = 0;
      el.dlgSpeaker.textContent = this.speaker.toUpperCase();
      el.dlgStep.textContent = this.steps.length > 1
        ? 'PAGE ' + (this.index + 1) + ' / ' + this.steps.length : '';
      el.dlgText.innerHTML = formatText(step.text || '');
      el.quizForm.hidden = !step.quiz;
      if (el.quizPrompt && !step.quiz) el.quizPrompt.innerHTML = '';
      el.itemCard.hidden = true;
      el.quizFeedback.textContent = '';
      el.quizFeedback.className = 'quiz__feedback';
      if (el.quizXp) el.quizXp.textContent = '';
      el.quizMeta.textContent = '';
      this.stepLocked = false;

      const solvedBefore = !!(step.quiz && state.solved[step.quiz]);

      if (step.quiz) {
        const q = Questions.get(step.quiz);
        el.quizForm.dataset.qid = step.quiz;
        /* The question itself — never hidden behind the header line. */
        if (el.quizPrompt) el.quizPrompt.innerHTML = formatText((q && q.prompt) || 'Answer the question below.');
        /* Topic + handbook reference: the test and the book agree. */
        if (el.quizTopic) el.quizTopic.textContent = (q && q.topic) || 'REVIEW';
        if (el.quizBookRef) el.quizBookRef.textContent = (q && q.bookRef) || 'Handbook';
        if (el.quizBookLink) el.quizBookLink.dataset.chapter = bookChapterFor(step.quiz);
        el.quizInput.value = '';
        el.quizInput.disabled = false;
        el.quizInput.placeholder = q && q.placeholder ? q.placeholder : 'Type your answer...';
        el.quizInput.classList.remove('is-wrong', 'is-right');
        el.quizSubmit.disabled = false;
        el.quizMeta.textContent = attemptLabel(step.quiz);
        if (solvedBefore) {
          el.quizInput.disabled = true;
          el.quizSubmit.disabled = true;
          el.quizFeedback.textContent = 'Already solved in this session.';
          el.quizFeedback.className = 'quiz__feedback is-right';
        } else {
          this.stepLocked = true;
        }
        renderLetterHintUI(step.quiz);
      } else {
        renderLetterHintUI(null);
      }

      /* Clue cards are awarded when the page becomes readable. On quiz pages the
         card is held back until the student answers correctly. */
      if (step.card && (!step.quiz || solvedBefore)) this.revealCard(step.card);

      if (step.action) step.action();

      el.dlgContinue.hidden = this.stepLocked;
      el.dlgContinue.disabled = this.stepLocked;

      if (step.quiz && !solvedBefore) {
        setTimeout(function () {
          try { el.quizInput.focus({ preventScroll: true }); } catch (e) { el.quizInput.focus(); }
        }, 60);
      }
      updateInteractButton();
    },

    /** Show an item card and push the item into the clue list (idempotent). */
    revealCard(id) {
      const item = ITEMS[id];
      if (!item) return;
      el.itemCard.hidden = false;
      el.itemIcon.textContent = item.icon;
      el.itemTitle.textContent = item.title;
      el.itemDesc.textContent = item.desc;
      if (el.itemRef) el.itemRef.textContent = 'Handbook › ' + (item.ref || '');
      giveClue(id);
    },

    /** Called by the Continue button, E, Space or Enter. */
    advance() {
      const step = this.current();
      if (!step) { this.close(); return; }
      if (el.dlgContinue.disabled || this.stepLocked) return;
      if (step.quiz && !state.solved[step.quiz]) return;
      if (this.index >= this.steps.length - 1) { this.close(); return; }
      this.index++;
      Sound.interact();
      this.render();
    },

    close() {
      if (!this.open) return;
      this.open = false;
      el.dialogue.hidden = true;
      el.quizForm.hidden = true;
      el.itemCard.hidden = true;
      el.dlgContinue.disabled = false;
      el.dlgContinue.hidden = false;
      const cb = this.onClose;
      this.onClose = null;
      if (cb) cb();
      saveLocal();
      updateInteractButton();
      flushToasts();
    },

    /** Handle a typed answer for the visible quiz step. */
    submit() {
      const step = this.current();
      if (!step || !step.quiz || state.solved[step.quiz]) return;
      const qid = step.quiz;
      const raw = el.quizInput.value;
      const result = Questions.check(qid, raw);
      const q = Questions.get(qid);

      if (result.missing) {
        el.quizFeedback.textContent = 'This question is missing from questions.js.';
        el.quizFeedback.className = 'quiz__feedback is-wrong';
        return;
      }
      if (result.empty) {
        el.quizFeedback.textContent = 'Type an answer first.';
        el.quizFeedback.className = 'quiz__feedback is-wrong';
        el.quizInput.classList.add('is-wrong');
        return;
      }

      const attempt = Questions.record(qid, result.ok);

      if (result.ok) {
        el.quizInput.classList.remove('is-wrong');
        el.quizInput.classList.add('is-right');
        el.quizInput.disabled = true;
        el.quizSubmit.disabled = true;
        el.quizFeedback.textContent = (q && q.success) || 'Correct!';
        el.quizFeedback.className = 'quiz__feedback is-right';
        el.quizMeta.textContent = attemptLabel(qid);
        renderLetterHintUI(qid);
        this.stepLocked = false;
        el.dlgContinue.hidden = false;
        el.dlgContinue.disabled = false;
        Sound.good();
        pulseDialogue('is-correct');
        revealFeedback();
        if (step.card) this.revealCard(step.card);
        if (step.onSolved) { try { step.onSolved(); } catch (e) { console.error(e); } }
        updateMission();
        flashMission();
      } else {
        el.quizInput.classList.add('is-wrong');
        el.quizInput.classList.remove('is-right');
        setTimeout(function () { el.quizInput.classList.remove('is-wrong'); }, 420);
        el.quizFeedback.textContent = (q && q.fail) || 'Not quite — try again.';
        el.quizFeedback.className = 'quiz__feedback is-wrong';
        Sound.bad();
        pulseDialogue('is-wrong');
        revealFeedback();
        /* The hint appears only after the second wrong try and only if hints are on. */
        if (state.hints && attempt.wrong >= 2 && q && q.hint) {
          el.quizFeedback.textContent += '\n\nHint: ' + q.hint;
          el.quizFeedback.className = 'quiz__feedback is-hint';
        }
        el.quizMeta.textContent = attemptLabel(qid);
        renderLetterHintUI(qid);
        try { el.quizInput.select(); } catch (e) {}
      }
    },

    /** Spend XP to reveal the next letter(s) of the current quiz answer. */
    useLetterHint() {
      const step = this.current();
      if (!step || !step.quiz || state.solved[step.quiz]) return;
      const qid = step.quiz;
      const info = letterHintInfo(qid);
      if (!info.ans || info.maxSteps <= 0) return;
      const cur = clamp(Number(state.letterHints[qid]) || 0, 0, info.maxSteps);
      if (cur >= info.maxSteps) {
        if (el.quizXp) el.quizXp.textContent = 'All letters for this answer are already revealed!';
        return;
      }
      const avail = Progression.totalXp();
      if (avail < LETTER_HINT_COST) {
        Sound.bad();
        if (el.quizXp) {
          el.quizXp.innerHTML = 'Need <b>' + LETTER_HINT_COST + ' XP</b> for a letter hint (you have <b>' +
            avail + ' XP</b>). Read the handbook or inspect room notes to earn XP!';
        }
        revealFeedback();
        return;
      }
      if (!Progression.spendXp(LETTER_HINT_COST)) return;
      state.letterHints[qid] = cur + 1;
      Sound.interact();
      renderLetterHintUI(qid);
      if (el.quizXp) {
        el.quizXp.innerHTML = 'Spent <b>-' + LETTER_HINT_COST + ' XP</b> for a letter hint · <b>' +
          Progression.totalXp() + ' XP</b> remaining.';
      }
      saveLocal();
      revealFeedback();
      try { el.quizInput.focus({ preventScroll: true }); } catch (e) {}
    }
  };

  /* ── EXP-powered Letter Hint helpers ────────────────────────────────────── */
  const LETTER_HINT_COST = 10;

  function canonicalAnswerFor(qid) {
    const q = Questions.get(qid);
    if (!q || !Array.isArray(q.accepted) || !q.accepted.length) return '';
    return String(q.accepted[0] || '').trim().toUpperCase();
  }

  function letterHintInfo(qid) {
    const ans = canonicalAnswerFor(qid);
    if (!ans) return { ans: '', maxSteps: 0, multiWord: false, words: [], seps: [] };
    const parts = ans.split(/(\s+|-)/);
    const words = [];
    const seps = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) words.push(parts[i]);
      else seps.push(parts[i]);
    }
    const multiWord = words.length > 1;
    let maxSteps = 0;
    if (multiWord) {
      for (let w = 0; w < words.length; w++) {
        if (words[w].length > maxSteps) maxSteps = words[w].length;
      }
    } else {
      maxSteps = words[0] ? words[0].length : 0;
    }
    return { ans: ans, maxSteps: maxSteps, multiWord: multiWord, words: words, seps: seps };
  }

  function renderLetterHintUI(qid) {
    if (!el.quizLetterHint || !el.quizHintBtn) return;
    if (!qid) {
      el.quizLetterHint.hidden = true;
      el.quizLetterHint.innerHTML = '';
      el.quizHintBtn.hidden = true;
      return;
    }
    const info = letterHintInfo(qid);
    const step = clamp(Number(state.letterHints[qid]) || 0, 0, info.maxSteps);
    const solved = !!state.solved[qid];
    const availXp = Progression.totalXp();

    el.quizHintBtn.hidden = false;
    if (solved) {
      el.quizHintBtn.disabled = true;
      el.quizHintBtn.textContent = '✦ Letter Hint (-' + LETTER_HINT_COST + ' XP)';
    } else if (step >= info.maxSteps && info.maxSteps > 0) {
      el.quizHintBtn.disabled = true;
      el.quizHintBtn.textContent = '✦ All letters revealed (' + step + '/' + info.maxSteps + ')';
    } else {
      el.quizHintBtn.disabled = false;
      el.quizHintBtn.textContent = '✦ Letter Hint (-' + LETTER_HINT_COST + ' XP · ' + availXp + ' XP avail)';
    }

    if (step <= 0 || !info.ans) {
      el.quizLetterHint.hidden = true;
      el.quizLetterHint.innerHTML = '';
      return;
    }

    let revealedChars = 0;
    let totalChars = 0;
    const wordHtml = [];
    for (let w = 0; w < info.words.length; w++) {
      const word = info.words[w];
      const chars = [];
      for (let c = 0; c < word.length; c++) {
        totalChars++;
        const show = c < step;
        if (show) revealedChars++;
        chars.push(
          '<span class="lhint__char' + (show ? ' is-rev' : '') + '">' +
          (show ? escapeHtml(word.charAt(c)) : '_') +
          '</span>'
        );
      }
      wordHtml.push('<span class="lhint__word">' + chars.join('') + '</span>');
      if (w < info.seps.length && info.seps[w].indexOf('-') !== -1) {
        wordHtml.push('<span class="lhint__sep">-</span>');
      }
    }

    el.quizLetterHint.hidden = false;
    el.quizLetterHint.innerHTML =
      '<div class="lhint__head">' +
        '<span>✦ Letter Hint (' + revealedChars + '/' + totalChars + ' letters)</span>' +
        '<span class="lhint__meta">' + (info.words.length > 1 ? info.words.length + ' words' : totalChars + ' chars') + '</span>' +
      '</div>' +
      '<div class="lhint__words">' + wordHtml.join('') + '</div>';
  }

  /** Scroll the dialogue body just enough to show the reward + feedback block. */
  function revealFeedback() {
    setTimeout(function () {
      const body = el.dlgBody;
      const chip = el.quizXp || el.quizFeedback;
      if (!body || !chip) return;
      /* scroll only as far as needed to show the reward line */
      const bodyRect = body.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      const need = chipRect.bottom + 10 - bodyRect.bottom;
      if (need > 0) {
        const over = body.scrollHeight - body.clientHeight;
        body.scrollTop = Math.min(over, body.scrollTop + need);
      }
    }, 40);
  }

  /** All six Mock Call Bay questions solved → award the bonus card once. */
  function checkBayBonus() {
    if (state.bonus) return false;
    const done = BAY_QUESTIONS.every(function (id) { return !!state.solved[id]; });
    if (!done) return false;
    state.bonus = true;
    Sound.pickup();
    Progression.onBayBonus();
    toast('Bay cleared — bonus review card added to your journal.', 'good');
    renderJournal();
    saveLocal();
    return true;
  }

  /** Unlock the QA & Escalation Wing as soon as Stage 1 (Training Floor) and Stage 2 (Mock Call Bay) are complete. */
  function checkWingUnlock() {
    if (state.room2Unlocked) return false;
    if (!isWingReady()) return false;
    unlockWing(true);
    updateMission();
    updateHud();
    return true;
  }

  /** Which handbook chapter answers this question? (derived from `topic`) */
  function bookChapterFor(qid) {
    const q = Questions.get(qid);
    if (!q) return 't1';
    const t = String(q.topic || '').toLowerCase();
    if (t.indexOf('term 1') === 0 || t === 't1' || t.indexOf('quarter 1') === 0 || t === 'q1') return 't1';
    if (t.indexOf('term 2') === 0 || t === 't2' || t.indexOf('quarter 2') === 0 || t === 'q2') return 't2';
    if (t.indexOf('term 3') === 0 || t === 't3' || t.indexOf('quarter 3') === 0 || t === 'q3' || t.indexOf('quarter 4') === 0 || t === 'q4') return 't3';
    if (t.indexOf('qa') === 0 || t.indexOf('qa wing') !== -1) return 'qa';
    return 't1';
  }

  function attemptLabel(qid) {
    const a = state.attempts[qid] || { correct: 0, wrong: 0 };
    if (a.correct) return 'Solved · ' + a.wrong + ' wrong attempt' + (a.wrong === 1 ? '' : 's');
    return a.wrong ? 'Wrong attempts: ' + a.wrong : 'Case-insensitive · spaces are trimmed';
  }

  /** Very small text formatter: `code`, **bold**, *highlight*, newlines → <br>. */
  function formatText(text) {
    let out = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
    out = out.replace(/\n/g, '<br>');
    return out;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     7. INPUT — keyboard, virtual joystick, on-screen buttons
     ══════════════════════════════════════════════════════════════════════════ */

  /* The player's collision box is 16 × 12 world px, anchored at the feet:
     (x - hw … x + hw) horizontally and (y - hh … y) vertically. */
  const player = {
    x: 0, y: 0,
    hw: 8, hh: 12,
    dir: 'up',
    moving: false,
    animT: 0,
    stepT: 0,
    seated: null,
    selfThought: -1,   // index into MY_DESK_LINES (your own station)
    bonus: false,      // Mock Call Bay bonus card earned
    selfT: 0,       // the station object the player is sitting at, or null
    seatT: 0            // typing animation timer while seated
  };

  const Input = {
    up: false, down: false, left: false, right: false,
    joyX: 0, joyY: 0, joyActive: false,
    lastDir: 'up'
  };

  const MOVE_KEYS = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right'
  };

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  function setKey(code, down) {
    const dir = MOVE_KEYS[code];
    if (!dir) return false;
    Input[dir] = down;
    if (down) Input.lastDir = dir;
    return true;
  }

  function onKeyDown(e) {
    // Never hijack typing inside the answer field.
    if (isTypingTarget(e.target)) {
      if (e.code === 'Escape') { Dialogue.close(); }
      return;   // every other key belongs to the text field
    }

    const isMove = !!MOVE_KEYS[e.code];
    if (isMove || e.code === 'Space') e.preventDefault();

    if (isMove) {
      setKey(e.code, true);
      if (!Dialogue.open && !state.paused) player.dir = MOVE_KEYS[e.code];
      return;
    }

    if (e.code === 'Escape') {
      if (Book.open) { Book.close(); return; }
      if (!el.settings.hidden) { closeSettings(); return; }
      if (Dialogue.open) { Dialogue.close(); return; }
      if (!el.journal.hidden) { closeJournal(); return; }
      if (!el.menu.hidden || !el.complete.hidden) return;
      if (state.started && !roundOver()) togglePause();
      return;
    }

    /* B opens the handbook from the room, the pause menu or the main menu. */
    if (e.code === 'KeyB') {
      if (Dialogue.open) { Book.show(guessBookChapter()); return; }
      if (Book.open) { Book.close(); return; }
      if (!el.menu.hidden) { Book.show('t1'); return; }
      if (state.started && !roundOver()) Book.show(guessBookChapter());
      return;
    }

    /* Space stands up when seated; otherwise it is a second interact key. */
    if (e.code === 'Space' || e.code === 'KeyX') {
      if (Dialogue.open) { Dialogue.advance(); return; }
      if (state.started && !state.paused && !roundOver() && player.seated) {
        standUp();
        return;
      }
    }

    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      if (Dialogue.open) {
        Dialogue.advance();
      } else if (state.started && !state.paused && !roundOver()) {
        tryInteract();
      }
      return;
    }
  }

  function onKeyUp(e) {
    if (isTypingTarget(e.target)) return;
    if (MOVE_KEYS[e.code]) {
      setKey(e.code, false);
      if (e.code === 'Space') e.preventDefault();
    }
  }

  /* Drop all held keys when the window loses focus (prevents "stuck" walking). */
  function releaseAllKeys() {
    Input.up = Input.down = Input.left = Input.right = false;
  }

  /* ---------- virtual joystick -------------------------------------------- */
  const Joystick = {
    pointerId: null,
    maxOffset: 34,

    init() {
      const zone = el.joystick;
      const knob = el.joyKnob;

      const measure = () => {
        const size = el.joyRing.getBoundingClientRect().width || 120;
        const knobSize = knob.getBoundingClientRect().width || 52;
        this.maxOffset = Math.max(18, size / 2 - knobSize / 2 - 4);
      };
      measure();

      const setKnob = (dx, dy) => {
        knob.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
      };

      const update = (clientX, clientY) => {
        const r = el.joyRing.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const len = Math.hypot(dx, dy);
        if (len > this.maxOffset && len > 0) {
          dx = (dx / len) * this.maxOffset;
          dy = (dy / len) * this.maxOffset;
        }
        setKnob(dx, dy);

        const max = this.maxOffset;
        let nx = dx / max;
        let ny = dy / max;
        const mag = Math.min(1, Math.hypot(nx, ny));
        const dead = 0.16;
        if (mag < dead) {
          Input.joyX = 0; Input.joyY = 0;
        } else {
          // rescale past the dead zone so small pushes still walk slowly
          const k = (mag - dead) / (1 - dead) / mag;
          Input.joyX = nx * k;
          Input.joyY = ny * k;
        }
        if (Math.abs(Input.joyX) + Math.abs(Input.joyY) > 0.05) {
          Input.lastDir = Math.abs(Input.joyX) > Math.abs(Input.joyY)
            ? (Input.joyX > 0 ? 'right' : 'left')
            : (Input.joyY > 0 ? 'down' : 'up');
        }
      };

      const end = (e) => {
        if (this.pointerId === null) return;
        if (e && e.pointerId !== undefined && e.pointerId !== this.pointerId) return;
        this.pointerId = null;
        Input.joyX = 0; Input.joyY = 0; Input.joyActive = false;
        setKnob(0, 0);
        zone.classList.remove('is-active');
      };

      zone.addEventListener('pointerdown', (e) => {
        if (Dialogue.open || Book.open || state.paused || !state.started) return;
        e.preventDefault();
        Sound.init();
        this.pointerId = e.pointerId;
        Input.joyActive = true;
        zone.classList.add('is-active');
        try { zone.setPointerCapture(e.pointerId); } catch (err) {}
        update(e.clientX, e.clientY);
      }, { passive: false });

      zone.addEventListener('pointermove', (e) => {
        if (this.pointerId !== e.pointerId) return;
        e.preventDefault();
        update(e.clientX, e.clientY);
      }, { passive: false });

      zone.addEventListener('pointerup', end);
      zone.addEventListener('pointercancel', end);
      zone.addEventListener('lostpointercapture', end);
      window.addEventListener('resize', measure);
      window.addEventListener('orientationchange', () => setTimeout(measure, 120));
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     8. MOVEMENT & COLLISION
     ══════════════════════════════════════════════════════════════════════════ */

  /** Room collision boxes in world pixels. Rebuilt when the door changes. */
  let solidRects = [];

  function buildSolids() {
    const list = [];
    room.walls.forEach(function (w) {
      list.push({ x: w.x * TILE, y: w.y * TILE, w: w.w * TILE, h: w.h * TILE, wall: true });
    });
    room.objects.forEach(function (o) {
      if (!o.solid) return;
      if (o.id === 'exitDoor' && state.doorOpen) return;
      list.push({
        x: o.solid.x * TILE, y: o.solid.y * TILE,
        w: o.solid.w * TILE, h: o.solid.h * TILE,
        objId: o.id
      });
    });
    solidRects = list;
  }

  function playerBox(x, y) {
    return { x: x - player.hw, y: y - player.hh, w: player.hw * 2, h: player.hh };
  }

  /** True when the player's box at (x, y) touches no solid at all. */
  function canStand(x, y) {
    const box = playerBox(x, y);
    for (let i = 0; i < solidRects.length; i++) {
      if (rectsOverlap(box, solidRects[i])) return false;
    }
    return true;
  }

  /* Rooms are small, so a simple axis-separated sweep works well: move on X,
     then Y, and let the walls stop each axis independently (this is what lets
     the player slide along a desk instead of sticking to it). */
  function moveWithCollision(dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
    const sx = dx / steps;
    const sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (sx) {
        const nx = player.x + sx;
        if (canStand(nx, player.y)) player.x = nx;
        else {
          // snap flush against the obstacle for a tidy stop
          const box = playerBox(nx, player.y);
          for (let j = 0; j < solidRects.length; j++) {
            const s = solidRects[j];
            if (rectsOverlap(box, s)) {
              if (sx > 0) player.x = Math.min(player.x, s.x - player.hw - 0.01);
              else player.x = Math.max(player.x, s.x + s.w + player.hw + 0.01);
            }
          }
        }
      }
      if (sy) {
        const ny = player.y + sy;
        if (canStand(player.x, ny)) player.y = ny;
        else {
          const box = playerBox(player.x, ny);
          for (let j = 0; j < solidRects.length; j++) {
            const s = solidRects[j];
            if (rectsOverlap(box, s)) {
              if (sy > 0) player.y = Math.min(player.y, s.y - 0.01);
              else player.y = Math.max(player.y, s.y + s.h + player.hh + 0.01);
            }
          }
        }
      }
    }
  }

  /** Combine keyboard and joystick into one normalised direction vector. */
  function readMoveVector() {
    if (player.seated || Dialogue.open || Book.open || state.paused || !state.started || roundOver()) {
      return { x: 0, y: 0, active: false };
    }
    let kx = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
    let ky = (Input.down ? 1 : 0) - (Input.up ? 1 : 0);
    let x = kx + Input.joyX;
    let y = ky + Input.joyY;
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    const active = Math.hypot(x, y) > 0.06;
    return { x: active ? x : 0, y: active ? y : 0, active: active };
  }

  function updatePlayer(dt) {
    const move = readMoveVector();
    player.moving = move.active;

    if (move.active) {
      // Facing follows the dominant axis; ties keep the previous facing.
      if (Math.abs(move.x) > Math.abs(move.y) + 0.05) {
        player.dir = move.x > 0 ? 'right' : 'left';
      } else if (Math.abs(move.y) > Math.abs(move.x) + 0.05) {
        player.dir = move.y > 0 ? 'down' : 'up';
      } else {
        player.dir = Math.abs(move.x) > Math.abs(move.y)
          ? (move.x > 0 ? 'right' : 'left')
          : (move.y > 0 ? 'down' : 'up');
      }

      // Normalising prevents faster diagonal travel; the magnitude lets the
      // joystick walk slowly when it is only pushed a little.
      const len = Math.hypot(move.x, move.y) || 1;
      const speed = PLAYER_SPEED * Math.min(1, len);
      const vx = (move.x / len) * speed * dt;
      const vy = (move.y / len) * speed * dt;
      moveWithCollision(vx, vy);

      player.animT += dt;
      player.stepT += dt;
      if (player.stepT > 0.31) { player.stepT = 0; Sound.step(); }
    } else {
      player.animT = 0;
      player.stepT = 0;
    }

    // Absolute safety net: never leave the room rectangle.
    player.x = clamp(player.x, TILE + player.hw, (room.cols - 1) * TILE - player.hw);
    player.y = clamp(player.y, 3 * TILE + player.hh, (room.rows - 1) * TILE);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     9. CAMERA — smooth follow, clamped so the room edges never show
     ══════════════════════════════════════════════════════════════════════════ */

  const cam = { x: 0, y: 0, left: 0, top: 0, shake: 0, shakeT: 0 };

  /* `view` holds the render sizes: the offscreen frame buffer (offW × offH is
     one world pixel per buffer pixel) and the CSS size of the visible canvas. */
  const view = { S: 1, offW: 1, offH: 1, cssW: 1, cssH: 1 };

  function clampAxis(center, viewLen, worldLen) {
    if (viewLen >= worldLen) return (worldLen - viewLen) / 2; // centre small rooms
    return clamp(center - viewLen / 2, 0, worldLen - viewLen);
  }

  function updateCamera(dt, snap) {
    const worldW = room.cols * TILE;
    const worldH = room.rows * TILE;
    const targetX = player.x;
    const targetY = player.y - 10;      // look slightly above the feet
    const t = snap ? 1 : 1 - Math.exp(-dt * 11);
    cam.x = lerp(cam.x, targetX, t);
    cam.y = lerp(cam.y, targetY, t);

    cam.shakeT += dt;
    let shakeX = 0, shakeY = 0;
    if (cam.shake > 0.01) {
      cam.shake *= Math.pow(0.0016, dt);
      shakeX = Math.sin(cam.shakeT * 61) * cam.shake;
      shakeY = Math.cos(cam.shakeT * 47) * cam.shake * 0.7;
    } else { cam.shake = 0; }

    // cam.left / cam.top are the world coordinates of the view's top-left.
    // Integer snapping keeps the art grid crisp while the room scrolls.
    cam.left = Math.round(clampAxis(cam.x, view.offW, worldW) + shakeX);
    cam.top = Math.round(clampAxis(cam.y, view.offH, worldH) + shakeY);
  }

  /** World → CSS pixel position, used to place DOM prompts over the canvas. */
  function worldToCss(wx, wy) {
    return {
      x: (wx - cam.left) * (view.cssW / view.offW),
      y: (wy - cam.top) * (view.cssH / view.offH)
    };
  }

  /* ══════════════════════════════════════════════════════════════════════════
     10. INTERACTION — nearest object, line of sight, clues, door, completion
     ══════════════════════════════════════════════════════════════════════════ */

  let room = ROOM_LAB;
  let currentTarget = null;
  /* The clear bonus shown on the victory panel (paid through Progression). */
  const ROOM1_BONUS = { xp: 150, coins: 25 };
  const WING_REWARD = { xp: 200, coins: 30 };
  let completionFresh = false;      // true when this clear just paid the bonus
  let exitRearm = false;            // leave the doorway before the summary re-opens
  let lastPromptKey = '';

  /** Convert a room's tile-based numbers into world pixels once at load. */
  function normalizeRoom(r) {
    r.rectPx = { x: 0, y: 0, w: r.cols * TILE, h: r.rows * TILE };
    r.objects.forEach(function (o) {
      o.rectPx = { x: o.rect.x * TILE, y: o.rect.y * TILE, w: o.rect.w * TILE, h: o.rect.h * TILE };
      if (o.solid) {
        o.solidPx = { x: o.solid.x * TILE, y: o.solid.y * TILE, w: o.solid.w * TILE, h: o.solid.h * TILE };
      }
      if (o.chair) {
        o.chairPx = { x: o.chair.x * TILE, y: o.chair.y * TILE, w: o.chair.w * TILE, h: o.chair.h * TILE };
      }
      if (o.marker) o.markerPx = { x: o.marker.x * TILE, y: o.marker.y * TILE };
      if (o.touch) o.touchPx = { x: o.touch.x * TILE, y: o.touch.y * TILE };
    });
    r.static = null;
    buildVisuals(r);
  }

  function enterRoom(id, spawn, skipSave) {
    room = ROOMS[id] || ROOM_LAB;
    state.roomId = room.id;
    normalizeRoom(room);
    buildSolids();
    prerenderRoom();
    const at = spawn || room.spawn;
    player.x = at.x * TILE;
    player.y = at.y * TILE;
    player.dir = at.dir || room.spawn.dir || 'up';
    player.seated = null;
    player.moving = false;
    if (el.btnStand) el.btnStand.hidden = true;
    cam.x = player.x; cam.y = player.y - 10;
    updateCamera(0, true);
    el.roomName.textContent = room.name;
    robotSnapToPlayer();
    ROBOT.sayT = 0;
    ROBOT.sayLines = [];
    FX.parts.length = 0;
    ensureMotes();
    updateHud();
    updateMission();
    Progression.onVisit(room.id);
    if (!skipSave) saveLocal();
  }

  /* Where you land in each room when you walk through a doorway. A room with
     two entrances (the floor has the bay door AND the wing door) passes an
     explicit spawn instead of relying on this table. */
  const DOOR_SPAWNS = {
    bay:  { x: 16.4, y: 11.4, dir: 'left' },  // stepping out of the training floor
    lab:  { x: 16.5, y: 4.3,  dir: 'down' },  // stepping back onto the floor (bay)
    lab2: { x: 3.4,  y: 11.6, dir: 'right' }, // entering the QA wing
    labWing: { x: 22.9, y: 5.9, dir: 'left' } // back onto the floor by the wing door
  };

  /* Room 2 gate: the wing is entered from the floor door once Stage 1 & Mock Call Bay are cleared. */
  function wingIsOpen() { return !!(state.room2Unlocked || isWingReady()); }

  /* ---------- smooth room transition (fade out → swap → fade in) ---------- */
  let fadeBusy = false;
  function fadeSwap(swap) {
    if (fadeBusy) { if (swap) swap(); return; }
    if (!el.fade) { if (swap) swap(); return; }
    fadeBusy = true;
    el.fade.classList.add('is-on');
    setTimeout(function () {
      try { if (swap) swap(); }
      finally {
        el.fade.classList.remove('is-on');
        setTimeout(function () { fadeBusy = false; }, 320);
      }
    }, 280);
  }

  /* Move the player to another room (used by the doorway objects). */
  function travelTo(roomId, spawn) {
    if (!ROOMS[roomId]) return;
    if (roomId === 'lab2' && !wingIsOpen()) {
      toast('The QA & Escalation Wing is still locked.', 'bad');
      Sound.locked();
      return;
    }
    Dialogue.close();
    if (player.seated) standUp(true);
    const at = spawn || DOOR_SPAWNS[roomId];
    fadeSwap(function () {
      enterRoom(roomId, at);
      toast('Entering ' + ROOMS[roomId].name, 'info');
      Sound.door();
    });
  }

  /** Door helpers so each doorway can land in the right place. */
  function travelToLab2() { travelTo('lab2', DOOR_SPAWNS.lab2); }
  function travelToLab()  { travelTo('lab',  DOOR_SPAWNS.labWing); }

  /** Is the straight line between two points blocked by a solid the player
      cannot see through? The target object's own box never blocks its own
      interaction, so you can inspect a desk from the side you are standing on. */
  function hasLineOfSight(ax, ay, bx, by, target) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const steps = Math.max(2, Math.ceil(len / 7));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const px = ax + dx * t;
      const py = ay + dy * t;
      if (target && target.rectPx && pointInRect(px, py, target.rectPx)) continue;
      for (let j = 0; j < solidRects.length; j++) {
        const s = solidRects[j];
        if (s.seeThrough) continue;
        if (target && s.objId &&
            (s.objId === target.id || s.objId === target.parent ||
             s.objId.indexOf(target.id + ':') === 0)) continue;
        if (pointInRect(px, py, s)) return false;
      }
    }
    return true;
  }

  /** Nearest reachable interactive object, biased toward the facing direction. */
  function nearestInteractable() {
    if (!room) return null;
    const px = player.x;
    const py = player.y - player.hh * 0.5;
    const face = DIR[player.dir] || DIR.down;
    let best = null;

    for (let i = 0; i < room.objects.length; i++) {
      const o = room.objects[i];
      if (!o.interact || !o.rectPx) continue;

      // Wall-mounted objects point at a reachable spot in the room.
      let tx, ty;
      if (o.touchPx) {
        tx = o.touchPx.x; ty = o.touchPx.y;
      } else {
        tx = clamp(px, o.rectPx.x, o.rectPx.x + o.rectPx.w);
        ty = clamp(py, o.rectPx.y, o.rectPx.y + o.rectPx.h);
      }

      const d = Math.hypot(px - tx, py - ty);
      if (d > INTERACT_RANGE) continue;
      if (!hasLineOfSight(px, py, tx, ty, o)) continue;

      const nx = (tx - px) / (d || 1);
      const ny = (ty - py) / (d || 1);
      const facing = face.x * nx + face.y * ny;      // -1..1
      const score = d - facing * 12 - (o.priority || 0); // prefer what you face

      if (!best || score < best.score) best = { obj: o, score: score, dist: d };
    }
    return best ? best.obj : null;
  }

  /* ---------- sitting at a desk ------------------------------------------- */
  /** The station whose chair the player could take right now (or null). */
  function nearestSeat() {
    if (!room || player.seated) return null;
    const px = player.x;
    const py = player.y - player.hh * 0.5;
    let best = null;
    for (let i = 0; i < room.objects.length; i++) {
      const o = room.objects[i];
      if (o.type !== 'station') continue;

      // The standing spot is just in front of (south of) the chair.
      const cx = (o.chair.x + o.chair.w / 2) * TILE;
      const cy = (o.chair.y + o.chair.h) * TILE;
      const d = Math.hypot(px - cx, py - cy);
      if (d > INTERACT_RANGE + 10) continue;
      if (!hasLineOfSight(px, py, cx, cy - 4, o)) continue;
      if (!best || d < best.d) best = { obj: o, d: d };
    }
    return best ? best.obj : null;
  }

  /** Sit down at a station: the agent there steps aside and shares a thought. */
  function sitDown(station) {
    if (!station || !station.chair) return;
    player.seated = station;
    player.seatT = 0;
    player.moving = false;
    player.x = (station.chair.x + station.chair.w / 2) * TILE;
    player.y = (station.chair.y + station.chair.h) * TILE - 2;
    player.dir = 'up';
    clearMovement();
    if (station.bot) {
      station.bot.roaming = false;
      station.bot.returning = false;
      station.bot.moving = false;
      station.bot.seated = false;          // the agent gives up the chair
      station.bot.thoughtT = 0;
      nextThought(station.bot, true);      // fresh line every time you sit
    } else {
      player.selfT = 0;
      player.selfThought = rollLine(player.selfThought, MY_DESK_LINES.length);
    }
    Sound.interact();
    toast(station.bot
      ? 'Seated with ' + station.bot.name + ' — E to use the PC, Space to stand.'
      : 'Seated at your own station — E to use the PC, Space to stand.', 'info');
    if (el.btnStand) el.btnStand.hidden = false;
    updateInteractButton();
    updateHudHints();
  }

  /** Stand up: step out in front of the chair and let the agent sit back down. */
  function standUp(silent) {
    const station = player.seated;
    if (!station) return false;
    player.seated = null;
    if (station.bot) {
      station.bot.roaming = false;
      station.bot.returning = false;
      station.bot.moving = false;
      station.bot.seated = true;
      station.bot.thought = -1;
      station.bot.cooldownT = 6 + Math.random() * 6;
    } else {
      player.selfThought = -1;
    }
    const cx = (station.chair.x + station.chair.w / 2) * TILE;
    let ty = (station.chair.y + station.chair.h) * TILE + player.hh + 6;
    // If that spot is blocked, fall back to the chair's own position.
    if (!canStand(cx, ty)) ty = (station.chair.y + station.chair.h) * TILE + player.hh;
    player.x = cx;
    player.y = Math.min(ty, (room.rows - 1) * TILE);
    player.dir = 'down';
    player.moving = false;
    if (el.btnStand) el.btnStand.hidden = true;
    if (!silent) Sound.interact();
    updateInteractButton();
    updateHudHints();
    return true;
  }

  /** Put the player back in a chair without the toast/sound (save resume). */
  function restoreSeat(stationId) {
    const station = room.objects.find(function (o) { return o.id === stationId && o.chair; });
    if (!station) return false;
    player.seated = station;
    player.seatT = 0;
    player.moving = false;
    player.dir = 'up';
    player.x = (station.chair.x + station.chair.w / 2) * TILE;
    player.y = (station.chair.y + station.chair.h) * TILE - 2;
    if (station.bot) {
      station.bot.seated = false;
      station.bot.thoughtT = 0;
      nextThought(station.bot, true);
    } else {
      player.selfT = 0;
      player.selfThought = rollLine(-1, MY_DESK_LINES.length);
    }
    if (el.btnStand) el.btnStand.hidden = false;
    updateHudHints();
    return true;
  }

  /** Roll a new thought for an agent (never repeats the current line). */
  /** Pick a random index that differs from `current` (used by every line pool). */
  function rollLine(current, total) {
    if (total <= 1) return 0;
    let i = Math.floor(Math.random() * total);
    if (i === current) i = (i + 1 + Math.floor(Math.random() * (total - 1))) % total;
    return i;
  }

  function nextThought(bot, force) {
    if (!bot) return;
    const total = BOT_LINES.length;
    let i = Math.floor(Math.random() * total);
    if (!force && total > 1 && i === bot.thought) i = (i + 1 + Math.floor(Math.random() * (total - 1))) % total;
    bot.thought = i;
    bot.thoughtT = 0;
  }

  /** Talk to the agent you are sitting beside, or a nearby roaming student. */
  function nearestRoamingBot() {
    if (!room || !room.objects) return null;
    const px = player.x;
    const py = player.y;
    let best = null;
    for (let i = 0; i < room.objects.length; i++) {
      const o = room.objects[i];
      if (!o.bot || !o.bot.roaming) continue;
      const d = Math.hypot(px - o.bot.x, py - o.bot.y);
      if (d <= INTERACT_RANGE + 14 && (!best || d < best.d)) {
        best = { obj: o, bot: o.bot, d: d };
      }
    }
    return best ? best.bot : null;
  }

  function askBot() {
    const station = player.seated;
    if (station && station.bot) {
      nextThought(station.bot, true);
      return BOT_LINES[station.bot.thought];
    }
    const roamer = nearestRoamingBot();
    if (roamer) {
      roamer.thought = pickJargonIndex(roamer.thought);
      roamer.thoughtT = 0;
      roamer.pauseT = Math.max(roamer.pauseT || 0, 4.0);
      return BOT_LINES[roamer.thought];
    }
    return null;
  }

  const STUDY_OBJECTS = { poster: 15, pc2: 15, coachSheet: 15, rack: 15 };

  function tryInteract() {
    if (Dialogue.open) { Dialogue.advance(); return; }
    if (!state.started || state.paused || roundOver()) return;

    /* Seated: E works the computer you sat down at. */
    if (player.seated) {
      const station = player.seated;
      const build = CONTENT[station.interact];
      if (!build) return;
      Sound.interact();
      let seatSteps = [];
      try { seatSteps = build(station) || []; } catch (err) { console.error(err); return; }
      if (!seatSteps.length) return;
      if (STUDY_OBJECTS[station.interact] && claim('study_' + station.interact)) {
        Progression.addXp(STUDY_OBJECTS[station.interact]);
        saveLocal();
      }
      Dialogue.show(station.label, seatSteps, function () {
        if (player.seated === station) updateHudHints();
      });
      return;
    }

    /* Standing at a chair: E sits down instead of opening the terminal. */
    const seat = nearestSeat();
    if (seat) { sitDown(seat); return; }

    const target = nearestInteractable();
    if (!target) {
      const roamer = nearestRoamingBot();
      if (roamer) {
        roamer.thought = pickJargonIndex(roamer.thought);
        roamer.thoughtT = 0;
        roamer.pauseT = 4.5;
        Sound.interact();
        const line = BOT_LINES[roamer.thought];
        toast(roamer.name + ': "' + (line ? line.text : '') + '"', 'info');
        return;
      }
      toast('Nothing close enough to inspect.', 'info');
      return;
    }
    /* Reading objects open the handbook instead of a dialogue panel. */
    if (target.opensBook) {
      Sound.interact();
      Book.show(target.opensBook);
      clearMovement();
      return;
    }

    const build = CONTENT[target.interact];
    if (!build) return;

    Sound.interact();
    let steps = [];
    try { steps = build(target) || []; } catch (err) { console.error(err); return; }
    if (!steps.length) return;

    if (STUDY_OBJECTS[target.interact] && claim('study_' + target.interact)) {
      Progression.addXp(STUDY_OBJECTS[target.interact]);
      saveLocal();
    }

    Dialogue.show(target.label, steps, function () {
      if (target.id === 'exitDoor' && state.doorOpen) updateMission();
    });
    if (target.id === 'exitDoor' && !state.doorOpen) Sound.locked();
    player.moving = false;
    clearMovement();
  }

  function clearMovement() {
    releaseAllKeys();
    Input.joyX = 0; Input.joyY = 0;
  }

  /** Add a clue item (idempotent — unique items can never be collected twice). */
  function giveClue(id) {
    const item = ITEMS[id];
    if (!item) return;
    if (hasClue(id)) return;
    state.clues.push(id);
    Sound.pickup();
    fxBurst(player.x, player.y - 12, '247,200,90', 16);
    toast('Review card added — ' + item.title, 'good');
    renderClueChips();
    checkWingUnlock();
    updateHud();
    updateMission();
    flashMission();
    Progression.onClue(id);
    saveLocal();
  }

  /** Unlock the exit. Called by the final question once it is answered. */
  function openDoor() {
    if (state.doorOpen) return;
    if (!isExitDoorReady() || !state.solved.q_subject || !state.solved.q_omni) return;
    state.doorOpen = true;
    buildSolids();
    Sound.door();
    cam.shake = 4;
    fxBurst(player.x, player.y - 12, '255,233,138', 22);
    Progression.onDoorOpen();
    toast('Lock released — the exit door is open!', 'good');
    updateMission();
    updateHud();
    renderClueChips();
    saveLocal();
  }

  /** Completing the room = walking through the now-open doorway. */
  function checkExitTrigger() {
    if (!state.doorOpen) return;
    const door = room.objects.find(o => o.id === 'exitDoor');
    if (!door) return;
    const zone = {
      x: door.rectPx.x - 4,
      y: door.rectPx.y + door.rectPx.h * 0.25,
      w: door.rectPx.w * 0.8,
      h: door.rectPx.h * 0.5
    };
    if (!pointInRect(player.x, player.y - 6, zone)) { exitRearm = true; return; }
    if (!state.completed) { showComplete(); return; }
    /* already cleared: stepping into the exit AGAIN re-opens the summary.
       `exitRearm` requires the player to leave the doorway first, so the panel
       never re-opens on the frame you dismiss it. Rewards are never re-paid —
       those only happen in showComplete(). */
    if (state.afterWin && exitRearm && el.complete.hidden && !state.paused) {
      exitRearm = false;
      showCompleteScreen();
    }
  }

  function showComplete() {
    if (state.completed) return;
    state.completed = true;
    Sound.good();
    /* the clear bonus is paid exactly once — a second walk-through, a reload or
       a resumed save can never claim it again */
    completionFresh = claim('room1:clear');
    if (completionFresh) {
      Progression.onComplete();
    } else {
      saveLocal();
    }
    unlockWing(false);        // <-- Room 2 becomes reachable here and only here
    fxBurst(player.x, player.y - 16, '247,200,90', 26);
    cam.shake = 5;
    saveLocal();
    updateMission();
    showCompleteScreen();
  }

  /** Stage 1 + Stage 2 cleared → the QA & Escalation Wing door opens (idempotent). */
  function unlockWing(loud) {
    if (state.room2Unlocked) return false;
    state.room2Unlocked = true;
    if (loud) {
      toast('QA & Escalation Wing unlocked! Enter the upper-right door before the Exit Door.', 'good');
      Sound.door();
      robotSay('Training Floor & Mock Call Bay complete! The QA & Escalation Wing door is now open.', 'cheer', 4);
    }
    saveLocal();
    return true;
  }

  /** All six wing questions answered → the wing itself is cleared (once). */
  function checkWingClear() {
    if (state.room2Cleared) return false;
    if (wingSolvedCount() < WING_QUESTIONS.length) return false;
    state.room2Cleared = true;
    const fresh = claim('wing:clear');
    if (fresh) {
      Progression.addXp(WING_REWARD.xp);
      Progression.addCoins(WING_REWARD.coins);
      Progression.unlock('wing_clear');
    }
    toast('QA & Escalation Wing cleared! Return to the Training Floor to unlock the Exit Door.', 'good');
    flashMission();
    fxBurst(player.x, player.y - 14, '116,230,214', 26);
    robotSay('Wing cleared! Return to the Training Floor and answer the Exit Door final check.', 'cheer', 4);
    renderObjectives();
    updateMission();
    saveLocal();
    return true;
  }

  /** Collect a wing relic (one-shot collectible, never pays twice). */
  function takeRelic(id, obj) {
    const item = RELICS[id];
    if (!item || hasRelic(id)) return;
    state.relics.push(id);
    Sound.pickup();
    const at = obj && obj.rectPx
      ? { x: obj.rectPx.x + obj.rectPx.w / 2, y: obj.rectPx.y + obj.rectPx.h }
      : { x: player.x, y: player.y };
    fxBurst(at.x, at.y - 8, '116,230,214', 18);
    toast('Relic logged — ' + item.title, 'good');
    if (claim('relic:' + id)) {
      Progression.addXp(70);
      Progression.addCoins(8);
    }
    robotSay('Relic logged: ' + item.title + '. ' + relicCount() + '/' + WING_RELICS.length + '.', 'cheer', 3.4);
    if (relicCount() >= WING_RELICS.length) Progression.unlock('wing_relics');
    updateHud();
    updateMission();
    renderJournal();
    saveLocal();
  }

  /** Render the results panel (also used when resuming a finished save). */
  function showCompleteScreen() {
    state.paused = true;
    clearMovement();
    renderStats();
    renderCompletionPanel();
    el.complete.hidden = false;
    el.pause.hidden = true;
    el.menu.hidden = true;
  }

  /** Victory panel: unlock ribbon, the clear bonus, and the way onward. */
  function renderCompletionPanel() {
    const unlocked = !!state.room2Unlocked;
    if (el.winRibbon) {
      el.winRibbon.hidden = !unlocked;
      if (unlocked) {
        el.winRibbon.innerHTML = '<span class="ribbon__k">ROOM 2 UNLOCKED</span>' +
          '<span class="ribbon__v">QA &amp; Escalation Wing</span>' +
          '<span class="ribbon__h">the door on the right wall is open</span>';
      }
    }
    if (el.winReward) {
      el.winReward.textContent = completionFresh
        ? 'Clear bonus: +' + ROOM1_BONUS.xp + ' XP · +' + ROOM1_BONUS.coins + ' ◎'
        : 'Clear bonus already collected on this run.';
    }
    if (el.btnEnterWing) {
      el.btnEnterWing.hidden = !unlocked;
      el.btnEnterWing.textContent = state.room2Cleared
        ? 'Return to the QA Wing →'
        : 'Enter the QA Wing →';
    }
    if (el.completeTitle) {
      el.completeTitle.textContent = state.room2Cleared
        ? 'Building Cleared!'
        : 'Training Floor Cleared!';
    }
  }

  /** Leave the victory panel and keep playing (optionally straight into Room 2). */
  function continueAfterWin(goWing) {
    state.afterWin = true;
    state.paused = false;
    completionFresh = false;
    exitRearm = false;
    el.complete.hidden = true;
    if (goWing && state.room2Unlocked) {
      travelTo('lab2', DOOR_SPAWNS.lab2);
    } else {
      toast('The QA & Escalation Wing door is open — right wall, above the exit.', 'info');
    }
    clearMovement();
    updateCamera(0, true);
    updateHud();
    updateMission();
    updatePromptUI();
    saveLocal();
  }

  function renderStats() {
    const wrong = Object.keys(state.attempts).reduce((n, k) => n + (state.attempts[k].wrong || 0), 0);
    const correct = Object.keys(state.attempts).reduce((n, k) => n + (state.attempts[k].correct || 0), 0);
    const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 100;
    const mins = Math.floor(state.elapsed / 60);
    const secs = Math.floor(state.elapsed % 60);
    const totalQ = Object.keys(Questions.all()).length;
    const bayDone = BAY_QUESTIONS.filter(function (id) { return !!state.solved[id]; }).length;
    const rows = [
      ['Time', mins + 'm ' + String(secs).padStart(2, '0') + 's'],
      ['Clues', state.clues.length + ' / ' + CLUES_REQUIRED],
      ['Questions', Object.keys(state.solved).length + ' / ' + totalQ],
      ['Accuracy', accuracy + '%'],
      ['Mock Call Bay', bayDone + ' / ' + BAY_QUESTIONS.length + (state.bonus ? ' ★' : '')],
      ['QA Wing', (state.room2Unlocked ? 'unlocked' : 'locked') + ' · ' +
                  wingSolvedCount() + ' / ' + WING_QUESTIONS.length + ' consoles'],
      ['QA relics', relicCount() + ' / ' + WING_RELICS.length],
      ['Level', 'LV ' + PROG.level + ' · ' + PROG.xp + '/' + xpForLevel(PROG.level) + ' XP'],
      ['Coins', PROG.coins + ' ◎'],
      ['Best streak', PROG.bestStreak + ' ▲'],
      ['Achievements', achievementCount() + ' / ' + ACHIEVEMENTS.length]
    ];
    renderAchvStrip();
    el.statGrid.innerHTML = rows.map(function (r) {
      return '<div class="stat"><div class="stat__k">' + r[0] + '</div>' +
             '<div class="stat__v">' + r[1] + '</div></div>';
    }).join('');
    el.completeSub.textContent = accuracy >= 80
      ? 'You escaped the CCS training floor. Solid review — bring that to the term exam.'
      : 'You escaped the CCS training floor. Read the handbook once more before the exam.';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     11. HUD, MISSION, JOURNAL, PAUSE & TOASTS
     ══════════════════════════════════════════════════════════════════════════ */

  function updateHud() {
    const n = requiredCardCount();
    el.clueCount.textContent = n + ' / ' + CLUES_REQUIRED;
    el.clueBar.style.width = Math.round((n / CLUES_REQUIRED) * 100) + '%';
    /* v2.0 progression HUD */
    renderProgHud();
    renderObjectives();
  }

  /** Small reminder line under the mission text (sit / stand state). */
  function updateHudHints() {
    if (!el.missionNext) return;
    if (player.seated) {
      el.missionNext.textContent = 'Seated at ' + player.seated.label +
        (player.seated.bot ? ' · with ' + player.seated.bot.name : ' (your station)') +
        ' · E to use · SPACE to stand';
    } else {
      updateMission();
    }
  }

  function updateMission() {
    const n = requiredCardCount();
    const solvedPreDoor = stage1PreDoorSolvedCount();
    const totalPreDoor = STAGE1_PRE_DOOR_QUESTIONS.length;
    let text, next;

    /* The bay is part of Stage 1: it has its own objective line. */
    if (room && room.id === 'bay') {
      const done = BAY_QUESTIONS.filter(function (id) { return !!state.solved[id]; }).length;
      if (state.bonus) {
        text = 'Mock Call Bay cleared — all 6 practice questions answered.';
        next = 'Step back through the door to the training floor';
      } else if (done === 0) {
        text = 'Mock Call Bay — answer all 6 practice questions (Booths A & B and the QA Board).';
        next = 'Booths A & B · the QA board on the wall';
      } else {
        text = 'Mock Call Bay — ' + done + ' / ' + BAY_QUESTIONS.length + ' practice questions answered.';
        next = 'Next: ' + bayNextHint();
      }
      el.missionText.textContent = text;
      if (player.seated) updateHudHints();
      else el.missionNext.textContent = next;
      return;
    }

    if (room && room.id === 'lab2') {
      const wdone = wingSolvedCount();
      const relics = relicCount();
      if (state.room2Cleared && !state.completed) {
        text = 'QA & Escalation Wing cleared! Return to the Training Floor to unlock the Exit Door.';
        next = (relics < WING_RELICS.length ? 'Optional: ' + relics + '/' + WING_RELICS.length + ' relics · ' : '') + 'Door on left wall returns to the Training Floor';
      } else if (state.room2Cleared && relics >= WING_RELICS.length) {
        text = 'QA & Escalation Wing cleared — consoles answered, relics logged.';
        next = 'Free review · the door on the left wall returns to the training floor';
      } else if (state.room2Cleared) {
        text = 'Wing cleared — relic ' + relics + ' / ' + WING_RELICS.length + ' still unlogged.';
        next = 'Relics: a lit plinth on the floor, and one on the QA table';
      } else {
        text = 'QA & Escalation Wing — ' + wdone + ' / ' + WING_QUESTIONS.length +
               ' console questions answered · ' + relics + ' / ' + WING_RELICS.length + ' relics.';
        next = wdone === 0
          ? 'Next: the nesting pod (Coach Mira) · the escalation desk (TL Dev)'
          : 'Next: ' + wingNextHint();
      }
      el.missionText.textContent = text;
      if (player.seated) updateHudHints();
      else el.missionNext.textContent = next;
      return;
    }

    if (state.completed) {
      text = 'Building cleared! Training Floor, Mock Call Bay, QA Wing & Exit Door complete.';
      next = 'Free review · B opens the handbook';
    } else if (state.doorOpen) {
      text = 'The exit is open — step through the doorway.';
      next = 'Door: right wall';
    } else if (isExitDoorReady()) {
      text = 'Training Floor, Mock Call Bay & QA Wing complete! Return to the Exit Door for the final check.';
      next = 'Exit door: right wall · answer the final check';
    } else if (isWingReady()) {
      const wdone = wingSolvedCount();
      text = 'Stage 1 & Mock Call Bay cleared! Complete the QA & Escalation Wing (' + wdone + '/' + WING_QUESTIONS.length + ' consoles) before the Exit Door.';
      next = 'Next: ' + nextHint() + ' · B opens the handbook';
    } else if (n >= CLUES_REQUIRED) {
      const qLeft = totalPreDoor - solvedPreDoor;
      text = '3/3 review cards found — answer ' + qLeft + ' more Mock Call Bay ' + (qLeft === 1 ? 'question' : 'questions') + ' (' + solvedPreDoor + '/' + totalPreDoor + ') to unlock the QA & Escalation Wing.';
      next = 'Next: ' + nextHint() + ' · B opens the handbook';
    } else {
      const left = CLUES_REQUIRED - n;
      text = 'Recover ' + left + ' more review ' + (left === 1 ? 'card' : 'cards') + ' and clear the Training Floor & Mock Call Bay (' + solvedPreDoor + '/' + totalPreDoor + ').';
      next = 'Next: ' + nextHint() + ' · B opens the handbook';
    }
    el.missionText.textContent = text;
    /* While seated the sub-line belongs to the sit state, not the mission. */
    if (player.seated) updateHudHints();
    else el.missionNext.textContent = next;
  }

  /** Where to send the player next inside the QA wing. */
  function wingNextHint() {
    if (!state.solved.q_scorecard) return 'the nesting pod — scorecard basics';
    if (!state.solved.q_fatal) return 'the nesting pod — fatal errors';
    if (!state.solved.q_escalate_rule) return 'the escalation desk — the ladder';
    if (!state.solved.q_dsar) return 'the escalation desk — data privacy';
    if (!state.solved.q_calibrate) return 'the QA console — calibration';
    if (!state.solved.q_nesting) return 'the QA console — nesting';
    if (relicCount() < WING_RELICS.length) return 'the remaining lit plinths';
    return 'the door back to the training floor';
  }

  /** Where to send the player next inside the bay. */
  function bayNextHint() {
    if (!state.solved.q_permission || !state.solved.q_signpost) return 'Practice Booth A (call control)';
    if (!state.solved.q_ballpark || !state.solved.q_escalate) return 'Practice Booth B (floor language)';
    if (!state.solved.q_warm || !state.solved.q_ftr) return 'the QA scorecard board';
    return 'finish the remaining booth questions';
  }

  function nextHint() {
    if (!hasClue('q1Card') || !state.solved.q_bpo || !state.solved.q_aht) return 'your station (Student PC 01) in the front row';
    if (!hasClue('q2Card') || !state.solved.q_pitch || !state.solved.q_timezone) return 'the Storage Cabinet against the right wall';
    if (!hasClue('q3Card') || !state.solved.q_open || !state.solved.q_deescalate) return "Ms. Reyes' desk and its Open Notebook";
    if (!BAY_QUESTIONS.every(function (id) { return !!state.solved[id]; })) return 'the Mock Call Bay door on the top wall';
    if (wingSolvedCount() < WING_QUESTIONS.length) return 'the QA & Escalation Wing door (upper-right wall)';
    return 'the exit door on the right wall';
  }

  function flashMission() {
    el.missionText.classList.remove('is-bump');
    void el.missionText.offsetWidth;
    el.missionText.classList.add('is-bump');
  }

  function renderClueChips() {
    el.clueTray.innerHTML = '';
    state.clues.forEach(function (id) {
      const item = ITEMS[id];
      if (!item) return;
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = '<span class="chip__icon">' + item.icon + '</span>' + escapeHtml(item.title);
      el.clueTray.appendChild(chip);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const pendingToasts = [];

  function toast(message, kind) {
    // While a dialogue is on screen the toasts would fight with it for space,
    // so they are queued and shown once the player closes the panel.
    if (Dialogue.open) { pendingToasts.push([message, kind]); return; }
    const node = document.createElement('div');
    node.className = 'toast' + (kind ? ' toast--' + kind : '');
    node.textContent = message;
    el.toasts.appendChild(node);
    while (el.toasts.children.length > 2) el.toasts.removeChild(el.toasts.firstChild);
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 3100);
  }

  function flushToasts() {
    if (!pendingToasts.length) return;
    const batch = pendingToasts.splice(0, pendingToasts.length);
    batch.forEach(function (t, i) {
      setTimeout(function () { toast(t[0], t[1]); }, 260 + i * 420);
    });
  }

  /* ---------- journal ------------------------------------------------------ */
  let journalFromPause = false;

  function openJournal() {
    renderJournal();
    journalFromPause = !el.pause.hidden;
    if (journalFromPause) el.pause.hidden = true;   // never stack two overlays
    el.journal.hidden = false;
    state.paused = true;
    clearMovement();
  }
  function closeJournal() {
    el.journal.hidden = true;
    if (journalFromPause) {
      journalFromPause = false;
      el.pause.hidden = false;                     // back to the pause menu
      return;
    }
    state.paused = false;
  }
  function renderJournal() {
    if (!state.clues.length && !state.bonus && !state.relics.length) {
      el.journalList.innerHTML =
        '<li class="journal-empty">No clues yet. Walk up to a glowing object and press E ' +
        'or tap Interact. You can also read the handbook at any time.</li>';
      return;
    }
    /* Every clue restates the exact fact its question asks, and points at the
       handbook section that teaches it — book, clue and test stay in sync. */
    el.journalList.innerHTML = state.clues.map(function (id) {
      const item = ITEMS[id];
      if (!item) return '';
      return '<li class="journal-item"><span class="journal-item__icon">' + item.icon + '</span>' +
             '<div><div class="journal-item__title">' + escapeHtml(item.title) + '</div>' +
             '<div class="journal-item__text">' + escapeHtml(item.desc) + '</div>' +
             (item.ref ? '<div class="journal-item__ref">Handbook › ' + escapeHtml(item.ref) + '</div>' : '') +
             '</div></li>';
    }).join('') + relicJournalEntries() + bonusJournalEntry();
  }

  /** The QA Wing relics, listed after the review cards. */
  function relicJournalEntries() {
    if (!state.relics.length) return '';
    return state.relics.map(function (id) {
      const item = RELICS[id];
      if (!item) return '';
      return '<li class="journal-item journal-item--relic">' +
             '<span class="journal-item__icon">' + item.icon + '</span>' +
             '<div><div class="journal-item__title">' + escapeHtml(item.title) + ' · RELIC</div>' +
             '<div class="journal-item__text">' + escapeHtml(item.desc) + '</div>' +
             '<div class="journal-item__ref">Handbook › ' + escapeHtml(item.ref) + '</div>' +
             '</div></li>';
    }).join('');
  }

  /** The Mock Call Bay card, shown after the three required cards. */
  function bonusJournalEntry() {
    if (!state.bonus || !ITEMS.bayCard) return '';
    const item = ITEMS.bayCard;
    return '<li class="journal-item journal-item--bonus">' +
           '<span class="journal-item__icon">' + item.icon + '</span>' +
           '<div><div class="journal-item__title">' + escapeHtml(item.title) + ' · BONUS</div>' +
           '<div class="journal-item__text">' + escapeHtml(item.desc) + '</div>' +
           '<div class="journal-item__ref">Handbook › ' + escapeHtml(item.ref) + '</div>' +
           '</div></li>';
  }

  /* ---------- pause -------------------------------------------------------- */
  function togglePause() {
    if (state.paused) closePause(); else openPause();
  }
  function openPause() {
    if (!state.started || roundOver()) return;
    if (player.seated) standUp(true);
    if (Dialogue.open) Dialogue.close();
    if (Book.open) Book.close();
    state.paused = true;
    clearMovement();
    el.pause.hidden = false;
    el.menu.hidden = true;
    saveLocal();
    refreshPauseLabels();
    renderPauseProgress();
  }
  function closePause() {
    el.pause.hidden = true;
    if (el.menu && !el.menu.hidden) { refreshMenu(); return; }  // stay on the menu
    state.paused = false;
    Sound.init();
  }

  /** Pause menu labels reflect whether there is a save to return to. */
  function refreshPauseLabels() {
    if (el.btnSaveMenu) el.btnSaveMenu.textContent = '💾 Save & main menu';
  }

  /* ---------- main menu ---------------------------------------------------- */
  function refreshMenu() {
    const saved = loadLocal();
    if (el.saveCard) {
      el.saveCard.classList.toggle('is-ready', !!saved);
      if (saved) {
        el.saveTitle.textContent = saved.completed ? 'Offline save · lab cleared' : 'Offline save found';
        el.saveBody.innerHTML =
          'Room: <b>' + (ROOMS[saved.roomId] ? ROOMS[saved.roomId].name : 'CCS Training Floor') + '</b><br>' +
          describeSave(saved) + '<br>' +
          'Saved ' + timeAgo(saved.savedAt) + ' on this device.';
      } else {
        el.saveTitle.textContent = 'No offline save found';
        el.saveBody.textContent = 'Start a new game — progress will be saved on this device automatically.';
      }
    }
    if (el.btnResume) {
      el.btnResume.disabled = !saved;
      el.btnResume.textContent = saved ? '▶ Resume offline save' : '▶ Resume offline save (none)';
    }
    if (el.btnNewGame) {
      el.btnNewGame.textContent = saved ? '✦ New game (overwrites save)' : '✦ New game';
    }
  }

  function showMenu() {
    if (player.seated) standUp(true);
    if (Dialogue.open) Dialogue.close();
    if (Book.open) Book.close();
    state.paused = true;
    state.started = false;
    clearMovement();
    el.menu.hidden = false;
    el.pause.hidden = true;
    el.complete.hidden = true;
    el.journal.hidden = true;
    refreshMenu();
    updateHud();
    updateMission();
  }

  /** Save and step back to the main menu (progress keeps its save). */
  function goToMenu() {
    saveLocal();
    showMenu();
    toast('Progress saved offline.', 'info');
  }

  /* ---------- run control -------------------------------------------------- */
  function startGame() {
    state.started = true;
    state.paused = false;
    el.menu.hidden = true;
    el.complete.hidden = true;
    el.pause.hidden = true;
    Sound.init();
    Sound.resume();
    updateCamera(0, true);
    if (!ROBOT.sayT) robotSay(robotPickLine('start'), 'wave', 4);
    updateHud();
    updateMission();
    updateInteractButton();
    saveLocal();
  }

  /** Main menu → resume the saved run. */
  function resumeSave() {
    const saved = loadLocal();
    if (!saved) { toast('There is no offline save on this device yet.', 'bad'); return; }
    /* Put the player back in whichever room the save was made in. */
    if (saved.roomId && ROOMS[saved.roomId] && saved.roomId !== state.roomId) {
      enterRoom(saved.roomId, null, true);
    }
    applySave(saved);
    buildSolids();
    doorAnim = state.doorOpen ? 1 : 0;
    if (!player.seated) {
      player.x = clamp(player.x, TILE, (room.cols - 1) * TILE);
      player.y = clamp(player.y, TILE, (room.rows - 1) * TILE);
    }
    updateCamera(0, true);
    /* a save from before v2.1 that already cleared the floor gets the wing */
    if (state.completed) unlockWing(false);
    checkWingClear();
    renderClueChips();
    updateHud();
    updateMission();
    startGame();
    if (state.completed && !state.afterWin) {
      completionFresh = false;          // resumed clear never re-pays the bonus
      showCompleteScreen();
      return;
    }
    toast('Offline save resumed.', 'good');
  }

  /** Main menu → wipe and start from the beginning. */
  function beginNewGame() {
    clearLocal();
    resetGame();
    startGame();
    toast('New run — the training floor is locked again.', 'info');
  }

  /* ---------- reset / restart --------------------------------------------- */
  function resetGame() {
    clearLocal();
    if (player.seated) standUp(true);
    if (el.btnStand) el.btnStand.hidden = true;
    if (state.roomId !== 'lab') enterRoom('lab', null, true);
    state.clues = [];
    state.solved = {};
    state.attempts = {};
    state.doorOpen = false;
    state.completed = false;
    state.room2Unlocked = false;
    state.afterWin = false;
    state.room2Cleared = false;
    state.relics = [];
    state.claimed = {};
    state.letterHints = {};
    completionFresh = false;
    state.elapsed = 0;
    state.paused = false;
    Dialogue.close();
    el.pause.hidden = true;
    el.journal.hidden = true;
    el.complete.hidden = true;
    el.menu.hidden = true;
    doorAnim = 0;
    buildSolids();
    player.x = room.spawn.x * TILE;
    player.y = room.spawn.y * TILE;
    player.dir = room.spawn.dir || 'up';
    player.moving = false;
    player.animT = 0;
    Progression.reset();
    robotSnapToPlayer();
    ROBOT.sayT = 0;
    FX.parts.length = 0;
    cam.x = player.x; cam.y = player.y - 10;
    updateCamera(0, true);
    clearMovement();
    renderClueChips();
    updateHud();
    updateMission();
    saveLocal();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     11b. CODE BOOK — the study notes the questions are drawn from
     ---------------------------------------------------------------------
     Content lives in codebook.js (window.CALLSCAPE_BOOK) as plain data. This
     module only renders it: chapter tabs, lesson text, colourised code samples
     and the  ★ REVIEW ANSWER  callouts that match the questions one to one.
     Opened from the bookshelf in the room, the HUD button, a question panel or
     the pause menu — and it never disturbs the run underneath.
     ══════════════════════════════════════════════════════════════════════════ */

  const Book = {
    open: false,
    chapterId: null,
    _resumePaused: false,

    data: function () { return window.CALLSCAPE_BOOK || null; },

    init: function () {
      const d = this.data();
      if (!d || !el.bookTabs) return;
      el.bookTabs.innerHTML = '';
      d.chapters.forEach(function (ch) {
        const b = document.createElement('button');
        b.className = 'book__tab';
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.dataset.chapter = ch.id;
        b.textContent = ch.tab;
        b.addEventListener('click', function () { Book.show(ch.id); });
        el.bookTabs.appendChild(b);
      });
    },

    show: function (chapterId, returnTo) {
      const d = this.data();
      if (!d) return;
      if (!this.open) {
        this._resumePaused = state.paused;
        this._returnTo = returnTo || null;   // 'pause' | 'journal' | null
        this.open = true;
      }
      const firstOpen = !this.open;
      const aliasMap = { q1: 't1', q2: 't2', q3: 't3', q4: 't3' };
      const resolvedId = aliasMap[chapterId] || chapterId;
      this.chapterId = resolvedId || d.chapters[0].id;
      state.paused = true;
      clearMovement();
      el.book.hidden = false;
      if (el.bookTitle) el.bookTitle.textContent = d.title || 'CCS Operations Manual';
      if (el.bookSub) el.bookSub.textContent = d.subtitle || '';
      if (el.bookEdition) el.bookEdition.textContent = d.edition || '';
      if (el.bookPlateTitle) el.bookPlateTitle.textContent = d.title || 'CCS Operations Manual';
      if (el.bookPlateEdition) el.bookPlateEdition.textContent = d.edition || '';
      this.render();

      /* The leather cover swings open the first time; later visits fade in. */
      const shell = el.bookShell;
      if (shell) {
        shell.classList.remove('is-open');
        if (firstOpen) {
          /* force a reflow so the closed state is painted before the flip */
          void shell.offsetWidth;
          requestAnimationFrame(function () { shell.classList.add('is-open'); });
        } else {
          shell.classList.add('is-open');
        }
      }
      Sound.page();
      Progression.onBookOpen();
    },

    render: function () {
      const d = this.data();
      const chapter = d.chapters.find(c => c.id === this.chapterId) || d.chapters[0];
      if (!chapter) return;

      el.bookTabs.querySelectorAll('.book__tab').forEach(function (t) {
        const on = t.dataset.chapter === chapter.id;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        /* keep the active tab visible when the strip has been scrolled */
        if (on && t.scrollIntoView) {
          try { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
        }
      });

      const parts = [];
      parts.push('<h3 class="book__chapter-title">' + escapeHtml(chapter.title) + '</h3>');
      parts.push('<p class="book__blurb">' + formatText(chapter.blurb || '') + '</p>');

      chapter.sections.forEach(function (sec) {
        parts.push('<section class="book-sec">');
        parts.push('<h4 class="book-sec__h">' + escapeHtml(sec.heading) + '</h4>');
        parts.push('<p class="book-sec__body">' + formatText(sec.body || '') + '</p>');
        const block = sec.sample || sec.code;
        if (block) {
          const kind = block.kind || block.lang || 'text';
          parts.push('<pre class="book-code"><code>' +
            highlightSample(block.src || '', kind) + '</code></pre>');
        }
        if (sec.answer) {
          parts.push('<div class="book-answer"><span class="book-answer__k">★ Review answer</span>' +
            formatText(sec.answer) + '</div>');
        }
        if (sec.notes && sec.notes.length) {
          parts.push('<ul class="book-notes">' + sec.notes.map(function (n) {
            return '<li>' + formatText(n) + '</li>';
          }).join('') + '</ul>');
        }
        parts.push('</section>');
      });

      /* left page: contents of the open chapter, clickable */
      if (el.bookToc) {
        el.bookToc.innerHTML = '';
        chapter.sections.forEach(function (sec, i) {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = sec.heading;
          b.addEventListener('click', function () {
            Book.flipTo(i);
          });
          li.appendChild(b);
          el.bookToc.appendChild(li);
        });
        el.bookToc.scrollTop = 0;
      }
      if (el.bookPlateChapter) el.bookPlateChapter.textContent = chapter.tab || chapter.title;

      el.bookPage.innerHTML = parts.join('');
      el.bookPage.scrollTop = 0;
      el.bookPage.querySelectorAll('.book-sec').forEach(function (sec, i) {
        sec.dataset.index = String(i);
      });
      this.turn();
    },

    /** Play the paper-turn animation (used on every chapter change). */
    turn: function () {
      const shell = el.bookShell;
      if (!shell) return;
      shell.classList.remove('is-turning');
      void shell.offsetWidth;
      shell.classList.add('is-turning');
      clearTimeout(this._turnTimer);
      this._turnTimer = setTimeout(function () { shell.classList.remove('is-turning'); }, 470);
    },

    /** Jump to a section on the open page (contents click). */
    flipTo: function (index) {
      const page = el.bookPage;
      if (!page) return;
      const sec = page.querySelector('.book-sec[data-index="' + index + '"]');
      this.turn();
      if (sec) {
        const top = sec.getBoundingClientRect().top - page.getBoundingClientRect().top +
          page.scrollTop - 6;
        page.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    },

    close: function () {
      if (!this.open) return;
      this.open = false;
      /* close the cover first, then put the book away */
      if (el.bookShell) {
        el.bookShell.classList.remove('is-open');
        el.bookShell.classList.add('is-closing');
      }
      const wasOpen = el.book;
      const finish = function () {
        wasOpen.hidden = true;
        if (el.bookShell) el.bookShell.classList.remove('is-closing');
      };
      if (el.bookShell) {
        clearTimeout(this._closeTimer);
        this._closeTimer = setTimeout(finish, 340);
      } else {
        finish();
      }
      const back = this._returnTo;
      this._returnTo = null;
      state.paused = this._resumePaused;
      Sound.page();
      /* Re-open whichever overlay the book was launched from, so the player is
         never left paused with nothing on screen. */
      if (back === 'pause' && state.started && !roundOver()) {
        el.pause.hidden = false;
      } else if (back === 'journal') {
        renderJournal();
        el.journal.hidden = false;
      }
      saveLocal();
    }
  };

  /* ---------- sample highlighter (single pass, no dependencies) ------------
     The handbook's monospace blocks are call scripts, emails, chat logs,
     metric formulas and plain notes — not source code. Each `kind` gets a small
     set of accent rules so students can scan a template quickly. */
  function highlightSample(source, kind) {
    let out = escapeHtml(source);
    const starLine = function (text) {
      return text.replace(/^★(.*)$/gm, '<span class="tok-key">★$1</span>');
    };
    const KINDS = {
      phone: function (text) {
        // speaker labels on a call script, plus [stage directions]
        return starLine(text)
          .replace(/^(Agent|Customer|Supervisor|IVR|System|TL|QA|Coach)\b:/gm,
                   '<span class="tok-say">$1</span>:')
          .replace(/\[([^\]]+)\]/g, '<span class="tok-com">[$1]</span>');
      },
      email: function (text) {
        return starLine(text)
          .replace(/^(Subject|To|From|Cc|Bcc|Attachment)\b:/gm, '<span class="tok-attr">$1</span>:');
      },
      chat: function (text) {
        return starLine(text)
          .replace(/^\[(\d{2}:\d{2})\]\s*(Customer|Agent)\b:/gm,
                   '<span class="tok-num">[$1]</span> <span class="tok-say">$2</span>:')
          .replace(/\[MACRO:([^\]]+)\]/g, '<span class="tok-com">[MACRO:$1]</span>')
          .replace(/^(\s*)(\/[a-z]+)/gm, '$1<span class="tok-key">$2</span>');
      },
      formula: function (text) {
        return starLine(text)
          .replace(/\b(AHT|CSAT|FCR|ACW|AUX|NPS|SLA|QA|WFM|ACD|IVR|CRM|UPS|USP|PECs?|BPO|IT-BPM|PEZA|IBPAP)\b/g,
                   '<span class="tok-key">$1</span>')
          .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
      },
      text: function (text) { return starLine(text); }
    };
    const fn = KINDS[kind] || KINDS.text;
    try { return fn(out); } catch (e) { return out; }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     11c. SETTINGS — preferences that survive restarts
     ══════════════════════════════════════════════════════════════════════════ */

  let settingsFromMenu = true;

  function openSettings(fromMenu) {
    settingsFromMenu = !!fromMenu;
    el.menu.hidden = true;
    el.pause.hidden = true;
    state.paused = true;
    clearMovement();
    syncSettingUI();
    el.settings.hidden = false;
  }

  function closeSettings() {
    el.settings.hidden = true;
    if (settingsFromMenu) {
      showMenu();
    } else if (state.started) {
      el.pause.hidden = false;
    } else {
      showMenu();
    }
  }

  function setSetting(key, value) {
    if (key === 'sound') {
      state.sound = value === 'on';
      if (state.sound) { Sound.init(); Sound.resume(); Sound.interact(); }
    } else if (key === 'hints') {
      state.hints = value === 'on';
    } else if (key === 'prompt') {
      state.promptOn = value === 'on';
      if (!state.promptOn) el.prompt.hidden = true;
    } else if (key === 'joystick') {
      state.joystickSide = value === 'right' ? 'right' : 'left';
    } else if (key === 'textsize') {
      state.textSize = value === 'large' ? 'large' : 'normal';
    } else if (key === 'device') {
      state.device = value === 'phone' ? 'phone' : 'pc';
      Sound.interact();
    }
    saveSettings();
    applySettings();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     12a. DOM REFERENCES & UI WIRING
     ══════════════════════════════════════════════════════════════════════════ */

  const $ = (id) => document.getElementById(id);

  const el = {
    shell: $('game-shell'),
    canvas: $('game'),
    hud: $('hud'),
    roomPanel: $('room-panel') || document.querySelector('.panel--room'),
    roomBody: $('room-body'),
    roomToggleInd: $('room-toggle-ind'),
    roomName: $('room-name'),
    clueCount: $('clue-count'),
    clueBar: $('clue-bar'),
    missionPanel: $('mission-panel') || document.querySelector('.panel--mission'),
    missionBody: $('mission-body'),
    missionToggleInd: $('mission-toggle-ind'),
    missionText: $('mission-text'),
    missionNext: $('mission-next'),
    clueTray: $('clue-tray'),
    fade: $('fade'),
    winRibbon: $('win-ribbon'),
    winReward: $('win-reward'),
    completeTitle: $('complete-title'),
    btnEnterWing: $('btn-enter-wing'),
    btnKeepExploring: $('btn-keep-exploring'),
    prompt: $('prompt'),
    promptKey: $('prompt-key'),
    promptText: $('prompt-text'),

    /* dialogue + quiz */
    dialogue: $('dialogue'),
    dlgSpeaker: $('dlg-speaker'),
    dlgStep: $('dlg-step'),
    dlgText: $('dlg-text'),
    dlgBody: $('dlg-body'),
    dlgClose: $('dlg-close'),
    dlgContinue: $('dlg-continue'),
    quizForm: $('quiz-form'),
    quizInput: $('quiz-input'),
    quizSubmit: $('quiz-submit'),
    quizLetterHint: $('quiz-letter-hint'),
    quizHintBtn: $('quiz-hint-btn'),
    quizFeedback: $('quiz-feedback'),
    quizMeta: $('quiz-meta'),
    quizPrompt: $('quiz-prompt'),
    quizTopic: $('quiz-topic'),
    quizBookRef: $('quiz-bookref'),
    quizBookLink: $('quiz-booklink'),
    itemCard: $('item-card'),
    itemIcon: $('item-icon'),
    itemTitle: $('item-title'),
    itemDesc: $('item-desc'),
    itemRef: $('item-ref'),
    toasts: $('toasts'),

    /* screens */
    menu: $('menu'),
    device: $('device'),
    saveCard: $('save-card'),
    saveTitle: $('save-title'),
    saveBody: $('save-body'),
    btnResume: $('btn-resume'),
    btnNewGame: $('btn-newgame'),
    btnMenuBook: $('btn-menu-book'),
    btnMenuSettings: $('btn-menu-settings'),
    btnMenuHelp: $('btn-menu-help'),
    menuHelp: $('menu-help'),

    settings: $('settings'),
    setList: $('set-list'),
    settingsSaveDesc: $('settings-save-desc'),
    btnWipe: $('btn-wipe'),
    btnSettingsClose: $('btn-settings-close'),

    book: $('book'),
    bookShell: $('book-shell'),
    bookToc: $('book-toc'),
    bookPlateChapter: $('book-plate-chapter'),
    bookPlateTitle: $('book-plate-title'),
    bookPlateEdition: $('book-plate-edition'),
    bookTabs: $('book-tabs'),
    bookPage: $('book-page'),
    bookTitle: $('book-title'),
    bookSub: $('book-sub'),
    bookEdition: $('book-edition'),
    btnBookClose: $('btn-book-close'),
    btnBookDone: $('btn-book-done'),
    btnBook: $('btn-book'),

    pause: $('pause'),
    journal: $('journal'),
    journalList: $('journal-list'),
    complete: $('complete'),
    completeSub: $('complete-sub'),
    statGrid: $('stat-grid'),
    achvStrip: $('achv-strip'),
    pauseProgRow: $('pause-prog-row'),
    pauseAchv: $('pause-achv'),

    /* progression HUD (v2.0) */
    lvlBadge: $('lvl-badge'),
    xpLabel: $('xp-label'),
    xpBar: $('xp-bar'),
    coinCount: $('coin-count'),
    streakChip: $('streak-chip'),
    badgeCount: $('badge-count'),
    objList: $('obj-list'),
    rewardLayer: $('reward-layer'),
    levelburst: $('levelburst'),
    levelburstV: $('levelburst-v'),
    achvHost: $('achv-host'),
    quizXp: $('quiz-xp'),
    dlgWindow: document.querySelector('#dialogue .dialogue__window'),

    /* controls */
    btnAct: $('btn-act'),
    btnActLabel: $('act-label'),
    btnStand: $('btn-stand'),
    btnPause: $('btn-pause'),
    btnSound: $('btn-sound'),
    btnNotes: $('btn-notes'),
    btnResumePlay: $('btn-resume-play'),
    btnReset: $('btn-reset'),
    btnSaveMenu: $('btn-save-menu'),
    btnPauseSettings: $('btn-pause-settings'),
    btnPauseBook: $('btn-pause-book'),
    btnJournalPause: $('btn-journal-pause'),
    btnJournalClose: $('btn-journal-close'),
    btnJournalBook: $('btn-journal-book'),
    btnPlayAgain: $('btn-play-again'),
    btnCompleteMenu: $('btn-complete-menu'),
    joystick: $('joystick'),
    joyRing: $('joy-ring'),
    joyKnob: $('joy-knob')
  };

  /* Whether the touch UI (joystick + big buttons) is the active scheme.
     The first-run device screen and Settings can override the auto-detect. */
  let IS_TOUCH = (function () {
    try { return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; }
    catch (e) { return false; }
  })();

  /* ---------- interaction prompt + on-screen Interact button ---------------- */
  const promptState = { visible: false, objId: null };

  function updateInteractButton() { updatePromptUI(); }

  function updatePromptUI() {
    if (!el.btnAct) return;
    const blocked = !state.started || state.paused || roundOver() || Dialogue.open || Book.open;

    /* Seated: the only prompt is "use this computer". */
    if (!blocked && player.seated) {
      currentTarget = player.seated;
      if (el.btnAct.disabled) el.btnAct.disabled = false;
      el.btnAct.classList.add('is-near');
      if (el.btnActLabel) el.btnActLabel.textContent = 'Use PC';
      if (!el.prompt.hidden) el.prompt.hidden = true;   // the thought bubble owns this space
      promptState.visible = false;
      promptState.objId = null;
      return;
    }

    const seat = blocked ? null : nearestSeat();
    const target = seat || (blocked ? null : nearestInteractable());
    currentTarget = target;

    const disabled = !target;
    if (el.btnAct.disabled !== disabled) el.btnAct.disabled = disabled;
    el.btnAct.classList.toggle('is-near', !!target);
    if (el.btnActLabel) el.btnActLabel.textContent = seat ? 'Sit down' : 'Interact';

    if (!target || !state.promptOn) {
      if (!el.prompt.hidden) el.prompt.hidden = true;
      promptState.visible = false;
      promptState.objId = null;
      return;
    }

    const anchor = target.markerPx ||
      { x: target.rectPx.x + target.rectPx.w / 2, y: target.rectPx.y };
    const p = worldToCss(anchor.x, anchor.y - 20);
    el.prompt.style.left = clamp(p.x, 78, Math.max(78, view.cssW - 78)) + 'px';
    el.prompt.style.top = clamp(p.y, 150, Math.max(150, view.cssH - 120)) + 'px';

    if (promptState.objId !== target.id) {
      el.promptText.textContent = seat
        ? 'Sit at ' + target.label
        : (target.opensBook ? 'Read handbook' : target.label);
      el.promptKey.textContent = IS_TOUCH ? 'TAP' : 'E';
      promptState.objId = target.id;
    }
    if (el.prompt.hidden) el.prompt.hidden = false;
    promptState.visible = true;
  }

  /* ---------- wiring -------------------------------------------------------- */
  function wireUI() {
    /* game controls */
    el.btnAct.addEventListener('click', function () {
      Sound.init();
      if (Dialogue.open) Dialogue.advance(); else tryInteract();
    });
    if (el.btnStand) el.btnStand.addEventListener('click', function () {
      if (Dialogue.open) Dialogue.close();
      standUp();
    });
    if (el.bookShell) {
      const cover = el.bookShell.querySelector('.book__cover');
      if (cover) cover.addEventListener('click', function () {
        el.bookShell.classList.add('is-open');
      });
    }
    if (el.device) {
      el.device.querySelectorAll('.device__card').forEach(function (card) {
        card.addEventListener('click', function () { chooseDevice(card.dataset.device); });
      });
    }
    el.dlgContinue.addEventListener('click', function () { Dialogue.advance(); });
    el.dlgClose.addEventListener('click', function () { Dialogue.close(); });
    el.quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      Dialogue.submit();
    });
    if (el.quizHintBtn) {
      el.quizHintBtn.addEventListener('click', function () {
        Dialogue.useLetterHint();
      });
    }
    if (el.quizBookLink) {
      el.quizBookLink.addEventListener('click', function () {
        Book.show(this.dataset.chapter || 't1');
      });
    }
    if (el.roomPanel) {
      el.roomPanel.addEventListener('click', function () {
        Sound.interact();
        toggleRoomPanel();
      });
      el.roomPanel.addEventListener('keydown', function (e) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          Sound.interact();
          toggleRoomPanel();
        }
      });
    }
    if (el.missionPanel) {
      el.missionPanel.addEventListener('click', function () {
        Sound.interact();
        toggleMissionPanel();
      });
      el.missionPanel.addEventListener('keydown', function (e) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          Sound.interact();
          toggleMissionPanel();
        }
      });
    }

    /* pause menu */
    el.btnPause.addEventListener('click', function () {
      if (Dialogue.open) Dialogue.close();
      if (Book.open) { Book.close(); return; }
      if (el.menu.hidden === false) return;
      togglePause();
    });
    el.btnResumePlay.addEventListener('click', closePause);
    el.btnNotes.addEventListener('click', openJournal);
    el.btnJournalPause.addEventListener('click', openJournal);
    el.btnJournalClose.addEventListener('click', closeJournal);
    if (el.btnJournalBook) el.btnJournalBook.addEventListener('click', function () {
      el.journal.hidden = true;
      Book.show(guessBookChapter(), 'journal');
    });
    if (el.btnPauseBook) el.btnPauseBook.addEventListener('click', function () {
      el.pause.hidden = true;
      Book.show(guessBookChapter(), 'pause');
    });
    if (el.btnPauseSettings) el.btnPauseSettings.addEventListener('click', function () {
      openSettings(false);
    });

    el.btnReset.addEventListener('click', function () {
      resetGame();
      el.pause.hidden = true;
      state.paused = false;
    });
    if (el.btnSaveMenu) el.btnSaveMenu.addEventListener('click', goToMenu);

    /* sound toggle in the HUD */
    el.btnSound.addEventListener('click', function () {
      setSetting('sound', state.sound ? 'off' : 'on');
      if (state.sound) { Sound.init(); Sound.resume(); Sound.interact(); }
    });
    if (el.btnBook) el.btnBook.addEventListener('click', function () {
      if (state.paused && el.book.hidden && el.menu.hidden === false) return;
      Book.show(guessBookChapter());
    });

    /* main menu */
    el.btnResume.addEventListener('click', resumeSave);
    el.btnNewGame.addEventListener('click', beginNewGame);
    el.btnMenuBook.addEventListener('click', function () { Book.show('t1'); });
    el.btnMenuSettings.addEventListener('click', function () { openSettings(true); });
    el.btnMenuHelp.addEventListener('click', function () {
      el.menuHelp.hidden = !el.menuHelp.hidden;
      el.btnMenuHelp.textContent = el.menuHelp.hidden ? 'How to play' : 'Hide instructions';
    });

    /* settings */
    el.btnSettingsClose.addEventListener('click', closeSettings);
    el.setList.addEventListener('click', function (e) {
      const btn = e.target.closest('.seg__btn');
      if (!btn) return;
      const seg = btn.closest('.seg');
      setSetting(seg.getAttribute('data-setting'), btn.getAttribute('data-value'));
      Sound.interact();
    });
    el.btnWipe.addEventListener('click', function () {
      clearLocal();
      syncSettingUI();
      refreshMenu();
      toast('Offline save deleted from this device.', 'info');
    });

    /* code book */
    el.btnBookClose.addEventListener('click', function () { Book.close(); });
    el.btnBookDone.addEventListener('click', function () { Book.close(); });

    /* completion */
    el.btnPlayAgain.addEventListener('click', function () {
      clearLocal();
      resetGame();
      startGame();
    });
    if (el.btnCompleteMenu) el.btnCompleteMenu.addEventListener('click', function () {
      clearLocal();
      resetGame();
      showMenu();
    });
    /* Room 2: straight into the wing, or back onto the floor to explore */
    if (el.btnEnterWing) el.btnEnterWing.addEventListener('click', function () {
      continueAfterWin(true);
    });
    if (el.btnKeepExploring) el.btnKeepExploring.addEventListener('click', function () {
      continueAfterWin(false);
    });

    /* keyboard + lifecycle */
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAllKeys);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) releaseAllKeys();
    });

    /* Block browser gestures that would otherwise scroll the page while the
       player is dragging the joystick or holding movement keys. */
    document.addEventListener('contextmenu', function (e) {
      if (e.target.closest && e.target.closest('#joystick, #game')) e.preventDefault();
    });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('touchmove', function (e) {
      if (e.target.closest && e.target.closest('#joystick, #game')) e.preventDefault();
    }, { passive: false });
  }

  /** Toggle the top-left room / XP panel details on click without removing the tab. */
  function toggleRoomPanel(forceCollapsed) {
    if (!el.roomPanel) return false;
    const collapsed = typeof forceCollapsed === 'boolean'
      ? forceCollapsed
      : !el.roomPanel.classList.contains('is-collapsed');
    el.roomPanel.classList.toggle('is-collapsed', collapsed);
    el.roomPanel.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (document.body && document.body.classList) {
      document.body.classList.toggle('room-collapsed', collapsed);
    }
    if (el.roomBody) el.roomBody.hidden = collapsed;
    if (el.roomToggleInd) el.roomToggleInd.textContent = collapsed ? '▸' : '▾';
    return collapsed;
  }

  /** Toggle the mission panel details on click without removing the mission tab. */
  function toggleMissionPanel(forceCollapsed) {
    if (!el.missionPanel) return false;
    const collapsed = typeof forceCollapsed === 'boolean'
      ? forceCollapsed
      : !el.missionPanel.classList.contains('is-collapsed');
    el.missionPanel.classList.toggle('is-collapsed', collapsed);
    el.missionPanel.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (el.missionBody) el.missionBody.hidden = collapsed;
    if (el.missionToggleInd) el.missionToggleInd.textContent = collapsed ? '▸' : '▾';
    return collapsed;
  }

  /** Best guess at which chapter the student needs right now. */
  function guessBookChapter() {
    if (room && room.id === 'lab2' && state.room2Unlocked) return 'qa';
    if (!hasClue('q1Card')) return 't1';
    if (!hasClue('q2Card')) return 't2';
    if (!hasClue('q3Card') || !state.solved.q_subject || !state.solved.q_omni) return 't3';
    if (state.room2Unlocked) return 'qa';
    return 'glossary';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     12. RENDERING — pre-rendered room + pixel-art sprites
     ---------------------------------------------------------------------
     Two canvases are used:
       frame   — one world pixel per buffer pixel (the art stays on its grid)
       canvas  — the visible canvas; the frame is upscaled with smoothing OFF
     This keeps the pixel art crisp at any zoom level.
     ══════════════════════════════════════════════════════════════════════════ */

  const canvas = el.canvas;
  let vis = canvas.getContext('2d');
  const frame = document.createElement('canvas');
  let frameCtx = frame.getContext('2d');
  const vignette = document.createElement('canvas');
  let doorAnim = 0;
  let stepAccum = 0;
  let lastTs = 0;
  const drawList = [];
  const playerVisual = { depth: 0, draw: null };

  /* ---------- small drawing helpers ---------------------------------------- */
  function fill(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function shadowUnder(g, x, y, w, h, alpha) {
    g.fillStyle = 'rgba(8,5,14,' + (alpha || 0.28) + ')';
    g.fillRect(Math.round(x + 2), Math.round(y + h - 4), Math.round(w - 4), 5);
    g.fillRect(Math.round(x + 5), Math.round(y + h - 6), Math.round(w - 10), 3);
  }
  function glow(g, x, y, radius, rgb, alpha) {
    const grd = g.createRadialGradient(x, y, 0, x, y, radius);
    grd.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    grd.addColorStop(0.5, 'rgba(' + rgb + ',' + (alpha * 0.4) + ')');
    grd.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grd;
    g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function hash2(x, y) {
    let n = (x * 374761393 + y * 668265263) | 0;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  /* ---------- static room: floor, walls, decor, light ---------------------- */
  function prerenderRoom() {
    const c = document.createElement('canvas');
    c.width = room.cols * TILE;
    c.height = room.rows * TILE;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    drawFloor(g, c.width, c.height);
    drawWalls(g, c.width, c.height);
    drawWallDecor(g);
    drawFloorDecals(g);
    drawLightPools(g);

    room.static = c;
  }

  function drawFloor(g, W, H) {
    const T = room.theme || {};
    fill(g, 0, 0, W, H, T.void || C.void);

    for (let ty = 3; ty < room.rows - 1; ty++) {
      for (let tx = 1; tx < room.cols - 1; tx++) {
        const x = tx * TILE;
        const y = ty * TILE;
        const checker = ((tx + ty) & 1) === 0;
        fill(g, x, y, TILE, TILE, checker ? (T.floorA || C.floorA) : (T.floorB || C.floorB));

        // soft top light and bottom shade on every tile for a bit of relief
        fill(g, x, y, TILE, 2, 'rgba(255,255,255,0.035)');
        fill(g, x, y + TILE - 2, TILE, 2, 'rgba(0,0,0,0.07)');

        // deterministic scuffs so the floor is not flat
        const r = hash2(tx, ty);
        if (r > 0.72) {
          const sx = x + 4 + Math.floor(hash2(tx + 7, ty) * 20);
          const sy = y + 5 + Math.floor(hash2(tx, ty + 11) * 18);
          fill(g, sx, sy, 5, 2, 'rgba(0,0,0,0.06)');
        }
        if (r < 0.12) {
          fill(g, x + 8, y + 14, 3, 3, 'rgba(255,255,255,0.05)');
        }
      }
    }

    // grout lines
    for (let tx = 1; tx <= room.cols - 1; tx++) {
      fill(g, tx * TILE - 1, 3 * TILE, 1, (room.rows - 4) * TILE, 'rgba(0,0,0,0.16)');
    }
    for (let ty = 3; ty <= room.rows - 1; ty++) {
      fill(g, TILE, ty * TILE - 1, (room.cols - 2) * TILE, 1, 'rgba(0,0,0,0.16)');
    }
  }

  function drawWalls(g, W, H) {
    const T = room.theme || {};
    // ── top wall (drawn as a wall face, classic RPG style) ──
    fill(g, 0, 0, W, 34, T.wallTop || '#332e45');
    fill(g, 0, 34, W, 54, T.wallFace || C.wallFace);
    fill(g, 0, 34, W, 10, T.brick || C.brick);
    // brick courses
    for (let row = 0; row < 4; row++) {
      const y = 46 + row * 11;
      fill(g, 0, y, W, 1, 'rgba(0,0,0,0.18)');
      for (let x = (row % 2 ? 0 : 16); x < W; x += 32) {
        fill(g, x, y, 1, 11, 'rgba(0,0,0,0.13)');
      }
    }
    fill(g, 0, 84, W, 4, T.wainscot || C.wainscot);
    fill(g, 0, 88, W, 8, T.baseboard || C.baseboard);
    fill(g, 0, 88, W, 1, 'rgba(255,255,255,0.08)');

    // ── side walls ──
    fill(g, 0, 0, TILE, H, T.wallFaceLo || C.wallFaceLo);
    fill(g, TILE - 5, 0, 5, H, '#3d3852');
    fill(g, TILE - 2, 0, 2, H, 'rgba(0,0,0,0.25)');
    fill(g, 0, 0, 6, H, 'rgba(0,0,0,0.22)');

    fill(g, W - TILE, 0, TILE, H, T.wallFaceLo || C.wallFaceLo);
    fill(g, W - TILE, 0, 5, H, '#3d3852');
    fill(g, W - TILE, 0, 2, H, 'rgba(0,0,0,0.25)');
    fill(g, W - 6, 0, 6, H, 'rgba(0,0,0,0.22)');

    // ── bottom wall with the lab entrance ──
    fill(g, 0, H - TILE, W, TILE, T.wallFaceLo || C.wallFaceLo);
    fill(g, 0, H - TILE, W, 5, T.wainscot || C.wainscot);
    fill(g, 0, H - TILE, W, 1, 'rgba(255,255,255,0.08)');
    fill(g, 0, H - TILE + 5, W, 3, 'rgba(0,0,0,0.2)');

    // entrance double door (you walked in through here) — optional per room
    const ent = (room.decor && room.decor.entrance) || null;
    if (ent) {
    const dx = ent.x * TILE, dy = H - TILE, dw = ent.w * TILE, dh = TILE;
    fill(g, dx - 5, dy - 7, dw + 10, dh + 7, '#252135');
    fill(g, dx - 3, dy - 5, dw + 6, dh + 5, '#9d8452');
    fill(g, dx, dy - 2, dw, dh + 2, '#0d0b16');
    fill(g, dx, dy, dw / 2 - 1, dh, '#4d5772');
    fill(g, dx + dw / 2 + 1, dy, dw / 2 - 1, dh, '#4d5772');
    fill(g, dx, dy, dw / 2 - 1, 2, '#6c7898');
    fill(g, dx + dw / 2 + 1, dy, dw / 2 - 1, 2, '#6c7898');
    fill(g, dx + dw / 2 - 5, dy + 12, 2, 10, '#cbd3e4');
    fill(g, dx + dw / 2 + 3, dy + 12, 2, 10, '#cbd3e4');
    fill(g, dx + dw / 2 - 1, dy, 2, dh, 'rgba(0,0,0,0.45)');

    // welcome mat + sign
    fill(g, dx + 14, H - 13, dw - 28, 9, '#3f4a5c');
    fill(g, dx + 16, H - 11, dw - 32, 5, '#54617a');
    fill(g, dx + dw / 2 - 26, dy - 6, 52, 10, '#1b2438');
    g.fillStyle = '#9fdcff';
    g.font = 'bold 5px "Courier New", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(ent.label || '', dx + dw / 2, dy - 1);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    }
  }

  function drawWallDecor(g) {
    const d = room.decor || {};

    // window with a night sky
    if (d.window) {
      const w = d.window;
      const x = w.x * TILE, y = w.y * TILE, ww = w.w * TILE, wh = w.h * TILE;
      fill(g, x - 3, y - 3, ww + 6, wh + 6, '#2a2637');
      fill(g, x, y, ww, wh, '#172038');
      fill(g, x, y + wh * 0.55, ww, wh * 0.45, '#10182b');
      // stars
      for (let i = 0; i < 16; i++) {
        const r = hash2(i + 3, i * 7 + 1);
        const sx = x + 3 + r * (ww - 6);
        const sy = y + 3 + hash2(i * 5, i + 9) * (wh * 0.6);
        fill(g, sx, sy, 1, 1, i % 4 ? 'rgba(220,230,255,0.75)' : 'rgba(255,255,255,0.95)');
      }
      // moon
      fill(g, x + ww - 20, y + 8, 11, 11, '#e9edf7');
      fill(g, x + ww - 17, y + 6, 9, 7, '#e9edf7');
      fill(g, x + ww - 22, y + 11, 5, 6, '#e9edf7');
      fill(g, x + ww - 19, y + 9, 4, 4, '#c9d2e6');
      // mullions + sill
      fill(g, x + ww / 2 - 1, y, 3, wh, '#2a2637');
      fill(g, x, y + wh / 2 - 1, ww, 3, '#2a2637');
      fill(g, x - 4, y + wh, ww + 8, 5, C.woodDark);
      fill(g, x - 4, y + wh, ww + 8, 2, C.wood);
    }

    // posters
    (d.posters || []).forEach(function (p) {
      const x = p.x * TILE, y = p.y * TILE, w = p.w * TILE, h = p.h * TILE;
      fill(g, x + 1, y + 2, w - 2, h - 2, 'rgba(0,0,0,0.28)');
      fill(g, x, y, w, h, '#e7e2d2');
      fill(g, x, y, w, 3, 'rgba(255,255,255,0.5)');
      fill(g, x, y + h - 3, w, 3, 'rgba(0,0,0,0.12)');

      if (p.kind === 'ccs') {
        fill(g, x + 3, y + 3, w - 6, h - 9, '#20304e');
        g.fillStyle = '#8fe3ff';
        g.font = 'bold 9px "Courier New", monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('CCS', x + w / 2, y + h / 2 - 3);
        g.fillStyle = 'rgba(143,227,255,0.6)';
        g.font = '5px "Courier New", monospace';
        g.fillText('FLOOR 2', x + w / 2, y + h / 2 + 8);
        g.textAlign = 'left';
        g.textBaseline = 'alphabetic';
      } else {
        g.fillStyle = 'rgba(60,60,80,0.75)';
        for (let i = 0; i < 5; i++) {
          g.fillRect(x + 4, y + 5 + i * 5, w - 8 - (i % 3) * 5, 1);
        }
        fill(g, x + 4, y + 3, w - 8, 3, '#c2543f');
      }
    });

    // clock
    if (d.clock) {
      const cx = d.clock.x * TILE, cy = d.clock.y * TILE;
      fill(g, cx - 10, cy - 10, 20, 20, '#2b2739');
      fill(g, cx - 9, cy - 9, 18, 18, '#e9e4d6');
      fill(g, cx - 8, cy - 8, 16, 16, '#f6f2e6');
      fill(g, cx - 2, cy - 8, 1, 8, '#2b2739');
      fill(g, cx, cy - 1, 7, 1, '#2b2739');
      fill(g, cx - 1, cy - 1, 2, 2, '#a33b34');
    }

    // big fitted whiteboard / display on the top wall — optional per room
    const bd = d.board || null;
    if (bd) {
    const bx = bd.x * TILE, by = bd.y * TILE, bw = bd.w * TILE, bh = bd.h * TILE;
    fill(g, bx, by, bw, bh, '#c9c4b4');
    fill(g, bx + 1, by + 1, bw - 2, bh - 2, '#e8e5d8');
    fill(g, bx, by + bh, bw, 3, '#8f8b7c');
    // lesson notes left on the board
    g.fillStyle = 'rgba(52,60,84,0.55)';
    g.font = 'bold 7px "Courier New", monospace';
    g.fillText(bd.title || '', bx + 10, by + 18);
    g.fillStyle = 'rgba(52,60,84,0.32)';
    const boardLines = bd.lines || [];
    for (let i = 0; i < boardLines.length; i++) {
      g.fillRect(bx + 10, by + 24 + i * 8, 26, 1);
      g.fillRect(bx + 42, by + 24 + i * 8, 52 - (i % 3) * 12, 1);
      g.fillRect(bx + 108, by + 24 + i * 8, 44 - (i % 2) * 14, 1);
    }
    g.fillStyle = 'rgba(160,60,52,0.45)';
    g.fillRect(bx + 92, by + 22, 96, 1.5);
    g.beginPath();
    g.arc(bx + 158, by + 52, 7, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(52,60,84,0.3)';
    g.lineWidth = 1;
    g.stroke();
    // marker tray
    fill(g, bx + 12, by + bh, 34, 3, '#b9b4a4');
    }
  }

  function drawFloorDecals(g) {
    const d = room.decor || {};
    if (d.rug) {
      const r = d.rug;
      const x = r.x * TILE, y = r.y * TILE, w = r.w * TILE, h = r.h * TILE;
      fill(g, x + 2, y + 3, w, h, 'rgba(0,0,0,0.18)');
      fill(g, x, y, w, h, '#3d4a68');
      fill(g, x, y, w, h * 0.06, '#4d5c80');
      fill(g, x + 5, y + 5, w - 10, h - 10, 'rgba(0,0,0,0.12)');
      fill(g, x + 5, y + 5, w - 10, 2, 'rgba(124,200,220,0.35)');
      fill(g, x + 5, y + h - 7, w - 10, 2, 'rgba(124,200,220,0.35)');
      // stripes
      for (let i = 0; i < 6; i++) {
        fill(g, x + 14 + i * 20, y + 12, 6, h - 24, 'rgba(255,255,255,0.04)');
      }
    }

    // floor mat in front of the exit door
    const door = room.objects.find(o => o.id === 'exitDoor');
    if (door) {
      const x = door.rectPx.x - 34;
      const y = door.rectPx.y + 22;
      fill(g, x, y, 34, 48, 'rgba(0,0,0,0.16)');
      fill(g, x, y, 30, 44, '#4a3f33');
      fill(g, x + 2, y + 2, 26, 40, '#5b4d3d');
      for (let i = 0; i < 6; i++) {
        fill(g, x + 4, y + 6 + i * 6, 22, 2, 'rgba(0,0,0,0.16)');
      }
    }
  }

  function drawLightPools(g) {
    const lamps = (room.decor && room.decor.lamps) || [];
    const rgb = (room.theme && room.theme.light) || '255,226,172';
    lamps.forEach(function (l) {
      const x = l.x * TILE, y = l.y * TILE;
      // Two stacked pools read as a ceiling lamp without drawing an object
      // in the middle of the floor.
      glow(g, x, y, 120, rgb, 0.10);
      glow(g, x, y, 62, room.theme ? rgb : '255,238,204', 0.10);
    });
  }

  /* ---------- visuals list: what gets depth-sorted every frame ------------- */
  function buildVisuals(r) {
    r.visuals = [];
    r.objects.forEach(function (o) {
      const bottom = (o.rect.y + o.rect.h) * TILE;
      switch (o.type) {
        case 'station':
          r.visuals.push({ depth: bottom, draw: function (g) { drawStation(g, o); } });
          if (o.chairPx) {
            r.visuals.push({
              depth: (o.chair.y + o.chair.h) * TILE,
              draw: function (g) { drawChair(g, o); }
            });
          }
          if (o.bot) {
            r.visuals.push({
              depth: (o.chair.y + o.chair.h) * TILE + 1,
              botObj: o,
              draw: function (g) { drawAgent(g, o); }
            });
          }
          break;
        case 'shelf':
          r.visuals.push({ depth: bottom, draw: function (g) { drawShelf(g, o); } });
          break;
        case 'cabinet':
          r.visuals.push({ depth: bottom, draw: function (g) { drawCabinet(g, o); } });
          break;
        case 'scoreboard':
          r.visuals.push({ depth: bottom, draw: function (g) { drawScoreboard(g, o); } });
          break;
        case 'wingdoor':
          r.visuals.push({ depth: bottom, draw: function (g) { drawWingDoor(g, o); } });
          break;
        case 'pod':
          r.visuals.push({ depth: bottom, draw: function (g) { drawPod(g, o); } });
          if (o.chairPx) {
            r.visuals.push({ depth: (o.chair.y + o.chair.h) * TILE,
                             draw: function (g) { drawChair(g, o); } });
          }
          if (o.bot) {
            r.visuals.push({ depth: (o.chair.y + o.chair.h) * TILE + 1,
                             botObj: o,
                             draw: function (g) { drawAgent(g, o); } });
          }
          break;
        case 'qaconsole':
          r.visuals.push({ depth: bottom, draw: function (g) { drawQaConsole(g, o); } });
          break;
        case 'rack':
          r.visuals.push({ depth: bottom, draw: function (g) { drawRack(g, o); } });
          break;
        case 'relic':
          r.visuals.push({ depth: bottom, draw: function (g) { drawRelic(g, o); } });
          break;
        case 'cooler':
          r.visuals.push({ depth: bottom, draw: function (g) { drawCooler(g, o); } });
          break;
        case 'teacherdesk':
          r.visuals.push({ depth: bottom, draw: function (g) { drawTeacherDesk(g, o); } });
          break;
        case 'notebook':
          r.visuals.push({
            depth: bottom + TILE * 0.95,   // sits on the desk surface
            draw: function (g) { drawNotebook(g, o); }
          });
          break;
        case 'door':
          r.visuals.push({ depth: bottom, draw: function (g) { drawDoor(g, o); } });
          break;
        case 'plant':
          r.visuals.push({ depth: bottom, draw: function (g) { drawPlant(g, o); } });
          break;
        case 'trash':
          r.visuals.push({ depth: bottom, draw: function (g) { drawTrash(g, o); } });
          break;
        case 'wallposter':
        case 'entrance':
          break; // painted into the static wall art
        default:
          r.visuals.push({
            depth: bottom,
            draw: function (g) { fill(g, o.rectPx.x, o.rectPx.y, o.rectPx.w, o.rectPx.h, '#884488'); }
          });
      }
    });
  }

  /* ---------- furniture sprites ------------------------------------------- */
  function drawDeskSlab(g, x, y, w, h) {
    fill(g, x + 3, y + 12, 4, h - 12, C.woodDark);
    fill(g, x + w - 7, y + 12, 4, h - 12, C.woodDark);
    fill(g, x, y + 3, w, 14, C.wood);
    fill(g, x, y + 2, w, 7, C.woodLit);
    fill(g, x + 1, y + 2, w - 2, 2, C.woodHi);
    fill(g, x, y + 16, w, 3, C.woodDark);
    fill(g, x, y + 16, w, 1, 'rgba(0,0,0,0.25)');
  }

  function drawStation(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.3);
    drawDeskSlab(g, r.x, r.y, r.w, r.h);

    // monitor (drawn above the desk so it reads as standing on it)
    const mw = 30, mh = 22;
    const mx = r.x + r.w / 2 - mw / 2;
    const my = r.y - 12;
    fill(g, mx + mw / 2 - 3, my + mh, 6, 5, '#2a2739');
    fill(g, mx + mw / 2 - 9, my + mh + 4, 18, 3, '#3a3650');
    fill(g, mx, my, mw, mh, '#242233');
    fill(g, mx + 1, my + 1, mw - 2, mh - 4, '#35314a');
    fill(g, mx + 3, my + 3, mw - 6, mh - 9, C.screenDark);

    // screen contents
    const tint = o.screenTint || C.screen;
    fill(g, mx + 5, my + 6, 12, 1, 'rgba(255,255,255,0.55)');
    fill(g, mx + 5, my + 9, 18, 1, tint);
    fill(g, mx + 7, my + 12, 13, 1, 'rgba(255,255,255,0.35)');
    fill(g, mx + 7, my + 15, 8, 1, 'rgba(255,255,255,0.25)');
    glow(g, mx + mw / 2, my + mh / 2, 26, '127,214,232', 0.10);

    // keyboard + mouse on the desk surface
    fill(g, r.x + 16, r.y + 6, 30, 7, '#d3cec0');
    fill(g, r.x + 16, r.y + 12, 30, 1, '#a9a494');
    for (let i = 0; i < 8; i++) fill(g, r.x + 18 + i * 3.5, r.y + 8, 2, 2, 'rgba(0,0,0,0.22)');
    fill(g, r.x + 49, r.y + 8, 5, 4, '#c9c4b6');

    // edge glow when this station is the active target
    if (currentTarget === o) {
      fill(g, r.x, r.y - 1, r.w, 1, 'rgba(247,200,90,0.5)');
    }
  }

  function drawChair(g, o) {
    const c = o.chairPx;
    fill(g, 'rgba(0,0,0,0.0)'); // no-op guard for early frames
    g.fillStyle = 'rgba(8,5,14,0.25)';
    g.fillRect(c.x + 2, c.y + c.h - 3, c.w - 4, 4);
    fill(g, c.x, c.y + 4, c.w, c.h - 8, '#3b4668');
    fill(g, c.x + 1, c.y + 4, c.w - 2, 3, '#55618f');
    fill(g, c.x + 1, c.y + c.h - 5, c.w - 2, 3, '#2b3350');
    fill(g, c.x + 2, c.y, c.w - 4, 4, '#2f3a5c');   // backrest
    fill(g, c.x + 3, c.y + 1, c.w - 6, 1, '#44507a');
    fill(g, c.x + 2, c.y + c.h - 2, 2, 3, '#22283d');
    fill(g, c.x + c.w - 4, c.y + c.h - 2, 2, 3, '#22283d');
  }

  function drawShelf(g, o) {
    const r = o.rectPx;
    fill(g, r.x + 2, r.y + r.h - 6, r.w - 4, 6, 'rgba(8,5,14,0.3)');
    fill(g, r.x, r.y, r.w, r.h, C.woodDark);
    fill(g, r.x + 3, r.y + 3, r.w - 6, r.h - 8, '#3d2a17');
    fill(g, r.x, r.y, r.w, 3, C.woodLit);
    fill(g, r.x, r.y, 3, r.h, C.wood);
    fill(g, r.x + r.w - 3, r.y, 3, r.h, '#5b3a1c');

    const bookCols = ['#a84a3d', '#3f6f8f', '#7b8f43', '#a8863f', '#6d4d8a', '#b0603c', '#3d7d6a'];
    const rows = 3;
    const rowH = (r.h - 12) / rows;
    for (let row = 0; row < rows; row++) {
      const ry = r.y + 6 + row * rowH;
      fill(g, r.x + 3, ry, r.w - 6, rowH - 2, '#241a12');
      let bx = r.x + 6;
      let i = 0;
      while (bx < r.x + r.w - 10) {
        const bw = 4 + Math.floor(hash2(row + 1, i + 2) * 4);
        const bh = Math.round((rowH - 6) * (0.72 + hash2(i + 5, row) * 0.26));
        const col = bookCols[(row * 3 + i) % bookCols.length];
        fill(g, bx, ry + (rowH - 4 - bh), bw, bh, col);
        fill(g, bx, ry + (rowH - 4 - bh), bw, 1, 'rgba(255,255,255,0.22)');
        bx += bw + 1;
        i++;
      }
      fill(g, r.x + 3, ry + rowH - 3, r.w - 6, 2, C.wood);
    }
  }

  /** The QA scorecard board in the Mock Call Bay: frame, four rows, red ticks. */
  function drawScoreboard(g, o) {
    const r = o.rectPx;
    // frame + board
    fill(g, r.x - 4, r.y - 4, r.w + 8, r.h + 8, '#2b2739');
    fill(g, r.x - 2, r.y - 2, r.w + 4, r.h + 4, '#b9b2a0');
    fill(g, r.x, r.y, r.w, r.h, '#f2ead6');
    // header strip
    fill(g, r.x, r.y, r.w, 11, '#3f5a6b');
    fill(g, r.x + 4, r.y + 3, r.w * 0.42, 5, '#cfe6ef');
    // four scorecard rows, each with a verdict box
    const rows = ['OPENING', 'COMPLIANCE', 'RESOLUTION', 'CLOSING'];
    for (let i = 0; i < rows.length; i++) {
      const ry = r.y + 17 + i * 10;
      fill(g, r.x + 4, ry, r.w - 30, 2, 'rgba(40,36,28,0.55)');
      fill(g, r.x + r.w - 22, ry - 3, 8, 8, i === 3 ? '#c9a24a' : '#8fbf8a');
      fill(g, r.x + r.w - 20, ry - 1, 4, 4, i === 3 ? '#f7e2a8' : '#e8f5e4');
    }
    // a red circle around the last two boxes (the escalation pair)
    g.strokeStyle = 'rgba(190,70,60,0.85)';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(r.x + r.w - 17, r.y + r.h - 19, 15, 16, 0, 0, Math.PI * 2);
    g.stroke();
    // push pin glow when it is the active target
    if (currentTarget === o) fill(g, r.x, r.y - 1, r.w, 2, 'rgba(247,200,90,0.6)');
  }

  function drawCabinet(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.32);
    fill(g, r.x, r.y, r.w, r.h, C.metalLo);
    fill(g, r.x + 2, r.y + 2, r.w - 4, r.h - 5, C.metal);
    fill(g, r.x + 3, r.y + 3, r.w - 6, 4, C.metalHi);
    fill(g, r.x + 3, r.y + 3, 2, r.h - 7, 'rgba(255,255,255,0.10)');
    fill(g, r.x + r.w - 5, r.y + 3, 2, r.h - 7, 'rgba(0,0,0,0.22)');
    // door split
    fill(g, r.x + r.w / 2 - 1, r.y + 6, 2, r.h - 12, 'rgba(0,0,0,0.35)');
    // vents
    for (let i = 0; i < 5; i++) {
      fill(g, r.x + 7, r.y + 10 + i * 3, r.w - 14, 1, 'rgba(0,0,0,0.2)');
    }
    // handles
    fill(g, r.x + r.w / 2 - 8, r.y + r.h * 0.45, 5, 2, C.metalHi);
    fill(g, r.x + r.w / 2 + 3, r.y + r.h * 0.45, 5, 2, C.metalHi);
    // keypad
    const kx = r.x + 6, ky = r.y + r.h - 42;
    fill(g, kx, ky, 22, 26, '#1d2130');
    fill(g, kx + 1, ky + 1, 20, 24, '#2a3044');
    for (let i = 0; i < 9; i++) {
      fill(g, kx + 3 + (i % 3) * 6, ky + 3 + Math.floor(i / 3) * 6, 4, 4, '#4a5470');
    }
    fill(g, kx + 4, ky + 22, 14, 2, '#101420');
    // status light
    const ready = state.clues.length >= 3;
    const led = state.solved.q_bits ? C.green : (ready ? C.gold : C.red);
    fill(g, kx + 17, ky + 2, 3, 3, led);
    glow(g, kx + 18.5, ky + 3.5, 14, state.solved.q_bits ? '134,229,140' : '238,106,114', 0.22);
    // label plate
    fill(g, r.x + r.w - 26, r.y + 12, 18, 9, '#d8d3c4');
    fill(g, r.x + r.w - 24, r.y + 15, 14, 1, 'rgba(0,0,0,0.4)');
    fill(g, r.x + r.w - 24, r.y + 18, 9, 1, 'rgba(0,0,0,0.3)');
  }

  function drawTeacherDesk(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.3);
    drawDeskSlab(g, r.x, r.y, r.w, r.h);
    // drawer tower
    fill(g, r.x + r.w - 22, r.y + 8, 18, r.h - 12, '#7d5027');
    fill(g, r.x + r.w - 20, r.y + 11, 14, 4, '#a9743c');
    fill(g, r.x + r.w - 20, r.y + 17, 14, 4, '#a9743c');
    fill(g, r.x + r.w - 14, r.y + 13, 3, 1, '#3a2611');
    fill(g, r.x + r.w - 14, r.y + 19, 3, 1, '#3a2611');
    // papers
    fill(g, r.x + 8, r.y + 5, 20, 12, '#efeade');
    fill(g, r.x + 9, r.y + 7, 16, 1, 'rgba(0,0,0,0.25)');
    fill(g, r.x + 9, r.y + 10, 12, 1, 'rgba(0,0,0,0.2)');
    fill(g, r.x + 9, r.y + 13, 14, 1, 'rgba(0,0,0,0.2)');
    // mug
    fill(g, r.x + 40, r.y + 5, 9, 9, '#c9d7e2');
    fill(g, r.x + 40, r.y + 5, 9, 2, '#e8f1f7');
    fill(g, r.x + 49, r.y + 8, 3, 4, '#c9d7e2');
    fill(g, r.x + 42, r.y + 7, 5, 4, '#5a3a24');
  }

  function drawNotebook(g, o) {
    const r = o.rectPx;
    fill(g, r.x + 1, r.y + 3, r.w, 4, 'rgba(0,0,0,0.3)');
    fill(g, r.x, r.y + 2, r.w, r.h - 2, '#8a4b2f');
    fill(g, r.x + 2, r.y, r.w - 4, r.h - 4, '#efe9d8');
    fill(g, r.x + r.w / 2 - 1, r.y, 2, r.h - 4, '#d8d0ba');
    for (let i = 0; i < 3; i++) {
      fill(g, r.x + 4, r.y + 3 + i * 3, r.w / 2 - 6, 1, 'rgba(60,60,90,0.35)');
      fill(g, r.x + r.w / 2 + 2, r.y + 3 + i * 3, r.w / 2 - 6, 1, 'rgba(60,60,90,0.35)');
    }
    fill(g, r.x + 6, r.y + 10, 5, 2, '#a33b34');
  }

  function drawDoor(g, o) {
    const r = o.rectPx;
    // Doorways between rooms are always open; only the exit door animates.
    const open = o.animated === false ? 0.62 : doorAnim;
    // frame
    fill(g, r.x - 4, r.y - 5, r.w + 8, r.h + 10, '#2b2739');
    fill(g, r.x - 2, r.y - 3, r.w + 4, r.h + 6, '#c9a24a');
    // dark opening behind the panels
    fill(g, r.x, r.y, r.w, r.h, '#0a0810');
    if (open > 0.02) {
      glow(g, r.x + 4, r.y + r.h / 2, 46, '255,232,180', 0.22 * open);
    }
    // two sliding panels
    const half = r.w / 2;
    const slide = open * (half - 3);
    const doorBody = '#5a6480';
    const doorLit = '#7d89a8';
    // left panel
    fill(g, r.x - slide, r.y + 2, half - 1, r.h - 4, doorBody);
    fill(g, r.x - slide, r.y + 2, half - 1, 3, doorLit);
    fill(g, r.x - slide + 4, r.y + 12, half - 10, 2, 'rgba(0,0,0,0.28)');
    fill(g, r.x - slide + 4, r.y + r.h - 22, half - 10, 2, 'rgba(0,0,0,0.28)');
    fill(g, r.x + half - 6 - slide, r.y + r.h / 2 - 6, 3, 12, '#cfd6e6'); // handle
    // right panel
    fill(g, r.x + half + 1 + slide, r.y + 2, half - 3, r.h - 4, doorBody);
    fill(g, r.x + half + 1 + slide, r.y + 2, half - 3, 3, doorLit);
    fill(g, r.x + half + 6 + slide, r.y + 12, half - 12, 2, 'rgba(0,0,0,0.28)');
    fill(g, r.x + half + 6 + slide, r.y + r.h - 22, half - 12, 2, 'rgba(0,0,0,0.28)');
    fill(g, r.x + half + 4 + slide, r.y + r.h / 2 - 6, 3, 12, '#cfd6e6');

    if (o.animated === false) return;   // plain doorway: no sign, no keypad

    // "EXIT" sign above the door
    const sx = r.x + r.w / 2 - 17, sy = r.y - 20;
    fill(g, sx, sy, 34, 12, '#12281c');
    fill(g, sx + 1, sy + 1, 32, 10, state.doorOpen ? '#1d5c37' : '#1a3a2a');
    g.fillStyle = state.doorOpen ? '#a8ffbf' : '#4f7d63';
    g.font = 'bold 7px "Courier New", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('EXIT', r.x + r.w / 2, sy + 7);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    glow(g, r.x + r.w / 2, sy + 6, 24, state.doorOpen ? '134,229,140' : '90,150,110', 0.18);

    // keypad on the wall next to the door
    const kx = r.x - 16, ky = r.y + r.h * 0.42;
    fill(g, kx, ky, 12, 16, '#1d2130');
    fill(g, kx + 1, ky + 1, 10, 14, '#2a3044');
    for (let i = 0; i < 6; i++) {
      fill(g, kx + 2 + (i % 2) * 4, ky + 3 + Math.floor(i / 2) * 3, 3, 2, '#4a5470');
    }
    const ledColor = state.doorOpen ? '134,229,140' : (isExitDoorReady() ? '247,200,90' : '238,106,114');
    fill(g, kx + 4, ky + 12, 4, 2, 'rgb(' + ledColor + ')');
    glow(g, kx + 6, ky + 13, 12, ledColor, 0.3);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ROOM 2 SPRITES — QA & Escalation Wing
     ══════════════════════════════════════════════════════════════════════════ */

  /** The unlockable door between the floor and the wing. */
  function drawWingDoor(g, o) {
    const r = o.rectPx;
    const open = wingIsOpen();
    const t = ROBOT.hoverT;

    // heavy frame, cold steel
    fill(g, r.x - 5, r.y - 6, r.w + 10, r.h + 12, '#141c24');
    fill(g, r.x - 2, r.y - 3, r.w + 4, r.h + 6, open ? '#59d2c4' : '#3c4c5c');
    fill(g, r.x, r.y, r.w, r.h, '#0a0f14');

    if (open) {
      // lit corridor beyond
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      fill(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, '#0d2430');
      glow(g, r.x + r.w / 2, r.y + r.h * 0.55, 44 + pulse * 8, '116,230,214', 0.20 + pulse * 0.10);
      // shutter rails, rolled up at the top
      fill(g, r.x + 3, r.y + 3, r.w - 6, 7, '#3f5464');
      fill(g, r.x + 3, r.y + 3, r.w - 6, 2, '#6d8898');
    } else {
      // closed shutter with a diagonal hazard band
      fill(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, '#2f3d49');
      for (let i = 0; i < 9; i++) {
        fill(g, r.x + 3, r.y + 6 + i * ((r.h - 12) / 9), r.w - 6, 2, '#26323d');
      }
      for (let i = 0; i < 12; i++) {
        fill(g, r.x + 4 + i * 3.2, r.y + r.h - 22, 3, 9, i % 2 ? '#f7c85a' : '#2a3540');
      }
    }

    // "QA WING" sign above the door
    const sx = r.x + r.w / 2 - 24, sy = r.y - 22;
    fill(g, sx, sy, 48, 13, '#111a22');
    fill(g, sx + 1, sy + 1, 46, 11, open ? '#123a3a' : '#1b242e');
    g.fillStyle = open ? '#8ff7ea' : '#5d7484';
    g.font = 'bold 7px "Courier New", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('QA WING', r.x + r.w / 2, sy + 7);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    glow(g, r.x + r.w / 2, sy + 6, 22, open ? '116,230,214' : '60,80,96', 0.16);

    // keypad: red until the floor is cleared, green after
    const kx = r.x - 18, ky = r.y + r.h * 0.40;
    fill(g, kx, ky, 13, 17, '#151d26');
    fill(g, kx + 1, ky + 1, 11, 15, '#202c38');
    for (let i = 0; i < 6; i++) {
      fill(g, kx + 2 + (i % 2) * 5, ky + 3 + Math.floor(i / 2) * 3, 4, 2, open ? '#3d6a62' : '#3a4552');
    }
    const led = open ? '116,230,214' : '238,106,114';
    fill(g, kx + 4, ky + 12, 5, 3, 'rgb(' + led + ')');
    glow(g, kx + 6, ky + 13, 13, led, open ? 0.34 : 0.24);
  }

  /** Nesting pod: a half-booth with a sound panel and a headset hook. */
  function drawPod(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.3);

    // sound-absorbing back panel
    fill(g, r.x + 4, r.y - 26, r.w - 8, 28, '#37505c');
    fill(g, r.x + 4, r.y - 26, r.w - 8, 3, '#4b6b79');
    for (let i = 0; i < 5; i++) {
      fill(g, r.x + 8, r.y - 22 + i * 5, r.w - 16, 1, 'rgba(0,0,0,0.22)');
    }

    // desk slab (cool grey, not wood — different from the floor)
    fill(g, r.x + 2, r.y + 12, 4, r.h - 12, '#2b3a44');
    fill(g, r.x + r.w - 6, r.y + 12, 4, r.h - 12, '#2b3a44');
    fill(g, r.x, r.y + 2, r.w, 14, '#5b6f7c');
    fill(g, r.x, r.y + 2, r.w, 6, '#7b93a1');
    fill(g, r.x + 1, r.y + 2, r.w - 2, 2, '#9db4c1');
    fill(g, r.x, r.y + 16, r.w, 3, '#25323b');

    // monitor with a recorded call waveform
    const mx = r.x + 10, my = r.y - 18;
    fill(g, mx - 2, my - 2, 34, 24, '#1a242c');
    fill(g, mx, my, 30, 20, '#122c3a');
    fill(g, mx, my, 30, 2, '#2f5f70');
    g.fillStyle = 'rgba(159,208,168,0.9)';
    for (let i = 0; i < 13; i++) {
      const h = 2 + Math.abs(Math.sin((i + ROBOT.hoverT * 2) * 1.1)) * 7;
      g.fillRect(mx + 3 + i * 2, my + 10 - h / 2, 1, h);
    }
    fill(g, mx + 10, my + 20, 10, 3, '#26333c');

    // headset on its hook
    fill(g, r.x + r.w - 18, r.y - 14, 2, 12, '#8fa3b0');
    g.strokeStyle = '#c9d8e2';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(r.x + r.w - 17, r.y - 6, 5, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
    fill(g, r.x + r.w - 23, r.y - 4, 3, 4, '#c9d8e2');
    fill(g, r.x + r.w - 14, r.y - 4, 3, 4, '#c9d8e2');
  }

  /** Wall console: four live QA meters. */
  function drawQaConsole(g, o) {
    const r = o.rectPx;
    const t = ROBOT.hoverT;
    fill(g, r.x - 3, r.y - 3, r.w + 6, r.h + 6, '#141d25');
    fill(g, r.x, r.y, r.w, r.h, '#243340');
    fill(g, r.x, r.y, r.w, 5, '#324655');

    g.fillStyle = '#8ff7ea';
    g.font = 'bold 6px "Courier New", monospace';
    g.fillText('QA CONSOLE', r.x + 5, r.y + 13);

    const rows = [
      { label: 'QA', val: 0.86, rgb: '134,229,140' },
      { label: 'CSAT', val: 0.92, rgb: '116,230,214' },
      { label: 'FATAL', val: state.solved.q_fatal ? 0.08 : 0.3, rgb: '238,106,114' },
      { label: 'CAL', val: state.solved.q_calibrate ? 1 : 0.45, rgb: '247,200,90' }
    ];
    rows.forEach(function (row, i) {
      const y = r.y + 20 + i * 12;
      g.fillStyle = 'rgba(200,230,255,0.75)';
      g.font = '5px "Courier New", monospace';
      g.fillText(row.label, r.x + 5, y + 5);
      fill(g, r.x + 24, y, r.w - 32, 6, '#16222b');
      const wobble = 0.03 * Math.sin(t * 2 + i);
      const w = Math.max(2, (r.w - 34) * clamp(row.val + wobble, 0.04, 1));
      fill(g, r.x + 25, y + 1, w, 4, 'rgb(' + row.rgb + ')');
      fill(g, r.x + 25, y + 1, w, 1, 'rgba(255,255,255,0.35)');
    });

    // blinking status LED
    const on = Math.sin(t * 4) > 0;
    fill(g, r.x + r.w - 8, r.y + 6, 4, 4, on ? '#86e58c' : '#2c4c36');
    glow(g, r.x + r.w - 6, r.y + 8, 10, '134,229,140', on ? 0.3 : 0.1);
  }

  /** Recording server rack with blinking drive LEDs. */
  function drawRack(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.32);
    fill(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, '#1b242c');
    fill(g, r.x + 4, r.y + 4, r.w - 8, r.h - 8, '#26323c');
    const t = ROBOT.hoverT;
    for (let i = 0; i < 8; i++) {
      const y = r.y + 8 + i * ((r.h - 16) / 8);
      fill(g, r.x + 6, y, r.w - 12, 7, '#1f2a33');
      fill(g, r.x + 7, y + 1, r.w - 14, 1, '#334450');
      for (let k = 0; k < 3; k++) {
        const blink = Math.sin(t * (3 + k) + i + k) > 0.1;
        fill(g, r.x + 9 + k * 4, y + 3, 2, 2,
             blink ? (k === 2 ? '#f7c85a' : '#8ff7ea') : '#2b3b47');
      }
      fill(g, r.x + r.w - 12, y + 2, 3, 3, '#3a4c58');
    }
    fill(g, r.x + 2, r.y + 2, r.w - 4, 2, '#3f5866');
    glow(g, r.x + r.w / 2, r.y + r.h / 2, 40, '116,230,214', 0.08);
  }

  /** A lit plinth holding one of the three wing relics. */
  function drawRelic(g, o) {
    const r = o.rectPx;
    const id = o.relic;
    const taken = hasRelic(id);
    const t = ROBOT.hoverT;
    const lift = Math.sin(t * 2.2) * 1.6;

    // plinth
    shadowUnder(g, r.x, r.y + r.h - 10, r.w, 10, 0.3);
    fill(g, r.x + r.w / 2 - 11, r.y + r.h - 20, 22, 16, '#2b3a46');
    fill(g, r.x + r.w / 2 - 11, r.y + r.h - 20, 22, 3, '#43606f');
    fill(g, r.x + r.w / 2 - 13, r.y + r.h - 5, 26, 5, '#1d2830');

    if (taken) {
      // empty plinth with a spent glow ring
      fill(g, r.x + r.w / 2 - 6, r.y + r.h - 24, 12, 3, 'rgba(116,230,214,0.22)');
      return;
    }

    const cx = r.x + r.w / 2;
    const cy = r.y + r.h - 30 + lift;
    glow(g, cx, cy, 26, '116,230,214', 0.24);

    if (id === 'qaRubric') {
      // clipboard rubric
      fill(g, cx - 7, cy - 8, 14, 17, '#e8e2d2');
      fill(g, cx - 7, cy - 8, 14, 2, '#f6f2e6');
      fill(g, cx - 3, cy - 10, 6, 3, '#8d99a6');
      for (let i = 0; i < 4; i++) fill(g, cx - 5, cy - 4 + i * 3, 10 - (i % 2) * 3, 1, '#5d6b78');
    } else if (id === 'qaHeadset') {
      // headset trophy
      g.strokeStyle = '#f7c85a';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy - 2, 7, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      fill(g, cx - 9, cy - 2, 4, 6, '#f7c85a');
      fill(g, cx + 5, cy - 2, 4, 6, '#f7c85a');
      fill(g, cx - 1, cy + 5, 2, 5, '#b9832a');
      fill(g, cx - 5, cy + 9, 10, 3, '#b9832a');
    } else {
      // escalation matrix card
      fill(g, cx - 8, cy - 6, 16, 13, '#243a4a');
      fill(g, cx - 8, cy - 6, 16, 2, '#8ff7ea');
      for (let i = 0; i < 3; i++) fill(g, cx - 6, cy - 2 + i * 4, 12, 1, 'rgba(143,247,234,0.55)');
      fill(g, cx + 4, cy - 4, 2, 9, '#f7c85a');
    }
  }

  /** Water cooler — wing flavour object. */
  function drawCooler(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.3);
    // bottle
    fill(g, r.x + 6, r.y + 2, r.w - 12, 16, 'rgba(150,215,240,0.55)');
    fill(g, r.x + 7, r.y + 6, r.w - 14, 11, 'rgba(190,235,255,0.65)');
    fill(g, r.x + 6, r.y + 2, r.w - 12, 3, 'rgba(220,245,255,0.5)');
    // stand
    fill(g, r.x + 4, r.y + 18, r.w - 8, r.h - 18, '#4a5a68');
    fill(g, r.x + 4, r.y + 18, r.w - 8, 3, '#66798a');
    fill(g, r.x + r.w / 2 - 3, r.y + 21, 6, 5, '#2f3d49');
    fill(g, r.x + r.w / 2 - 5, r.y + r.h - 6, 10, 4, '#1d2830');
  }

  function drawPlant(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.26);
    const cx = r.x + r.w / 2;
    // pot
    fill(g, r.x + 6, r.y + 22, r.w - 12, r.h - 22, '#a05a3d');
    fill(g, r.x + 5, r.y + 20, r.w - 10, 4, '#c07050');
    fill(g, r.x + 6, r.y + 22, r.w - 12, 2, '#7d422c');
    // leaves
    const leaves = [[-6, -2], [5, -1], [-2, -7], [8, 4], [-9, 6]];
    leaves.forEach(function (l, i) {
      g.fillStyle = i % 2 ? '#4f8f57' : '#3f7a48';
      g.beginPath();
      g.ellipse(cx + l[0], r.y + 14 + l[1], 5, 9, 0.4, 0, Math.PI * 2);
      g.fill();
    });
    fill(g, cx - 1, r.y + 8, 2, 14, '#2f5e36');
  }

  function drawTrash(g, o) {
    const r = o.rectPx;
    shadowUnder(g, r.x, r.y, r.w, r.h, 0.26);
    fill(g, r.x + 2, r.y + 6, r.w - 4, r.h - 6, '#3f4a5e');
    fill(g, r.x + 2, r.y + 6, r.w - 4, 3, '#55647f');
    fill(g, r.x + 1, r.y + 3, r.w - 2, 5, '#4c5a72');
    fill(g, r.x + 4, r.y + 12, 2, r.h - 16, 'rgba(255,255,255,0.12)');
    fill(g, r.x + r.w - 6, r.y + 12, 2, r.h - 16, 'rgba(0,0,0,0.2)');
    fill(g, r.x + r.w / 2 - 3, r.y, 6, 4, '#5b6a84');
  }

  /* ---------- the agents at the desks & roaming in the aisles ------------- */
  function drawAgent(g, o) {
    const bot = o.bot;
    if (!bot) return;
    const look = bot.look || { shirt: '#3f7d9c', hair: '#2a1d18' };
    const cx = (o.chair.x + o.chair.w / 2) * TILE;

    if (bot.roaming && player.seated !== o) {
      drawRoamingAgent(g, bot, look);
      return;
    }

    if (bot.seated && player.seated !== o) {
      drawSeatedFigure(g, cx, (o.chair.y + o.chair.h) * TILE, look, false);
      return;
    }

    /* Standing aside: the agent leans on the desk edge so the player can sit. */
    const ax = (o.rect.x + o.rect.w) * TILE + 1;
    const ay = (o.chair.y + o.chair.h) * TILE;
    g.fillStyle = 'rgba(8,5,14,0.32)';
    g.fillRect(Math.round(ax - 7), Math.round(ay - 2), 14, 3);
    // legs
    fill(g, ax - 5, ay - 12, 4, 10, '#2d3654');
    fill(g, ax + 1, ay - 12, 4, 10, '#2d3654');
    fill(g, ax - 5, ay - 4, 5, 3, '#191724');
    fill(g, ax + 1, ay - 4, 5, 3, '#191724');
    // torso
    fill(g, ax - 7, ay - 26, 15, 15, look.shirt);
    fill(g, ax - 7, ay - 26, 15, 2, 'rgba(255,255,255,0.22)');
    fill(g, ax - 7, ay - 26, 2, 15, 'rgba(0,0,0,0.18)');
    // arms crossed
    fill(g, ax - 6, ay - 22, 12, 3, look.shirt);
    fill(g, ax - 6, ay - 20, 12, 2, 'rgba(255,255,255,0.14)');
    // head
    fill(g, ax - 5, ay - 36, 11, 10, look.hair);
    fill(g, ax - 4, ay - 30, 9, 5, '#e6b183');
    fill(g, ax - 5, ay - 36, 11, 3, look.hair);
    fill(g, ax - 3, ay - 28, 2, 1, '#2b2020');
    fill(g, ax + 2, ay - 28, 2, 1, '#2b2020');
  }

  /** Walking / standing student agent roaming the floor and sharing jargons. */
  function drawRoamingAgent(g, bot, look) {
    const x = Math.round(bot.x);
    const y = Math.round(bot.y);
    const walking = !!bot.moving;
    const phase = Math.floor((bot.animT || 0) * 8) % 4;
    const stepFrame = walking ? [0, 1, 0, 2][phase] : 0;
    const bob = walking && stepFrame !== 0 ? -1 : 0;
    const left = x - 9;
    const top = y - 27 + bob;

    // ground shadow
    g.fillStyle = 'rgba(8,5,14,0.34)';
    g.fillRect(x - 8, y - 3, 16, 3);
    g.fillRect(x - 5, y - 4, 10, 1);

    const P = function (dx, dy, w, h, color) {
      g.fillStyle = color;
      g.fillRect(left + dx, top + dy, w, h);
    };

    const skin = '#e6b183';
    const skinShade = '#c48f62';
    const hair = look.hair || '#2a1d18';
    const shirt = look.shirt || '#3f7d9c';
    const pants = '#2d3654';
    const pantsShade = '#212940';
    const shoe = '#191724';
    const dir = bot.dir || 'down';

    if (dir === 'up') {
      P(3, 1, 12, 11, hair);
      P(4, 0, 10, 2, hair);
      P(4, 11, 10, 2, skinShade);
      P(4, 9, 10, 9, shirt);
      P(2, 10, 2, 6, shirt);
      P(14, 10, 2, 6, shirt);
      P(2, 15, 2, 2, skin);
      P(14, 15, 2, 2, skin);
      const la = stepFrame === 1 ? 1 : 0;
      const lb = stepFrame === 2 ? 1 : 0;
      P(5, 18, 3, 5 + la, pants);
      P(10, 18, 3, 5 + lb, pants);
      P(5, 23 + la, 3, 3, shoe);
      P(10, 23 + lb, 3, 3, shoe);
    } else if (dir === 'left' || dir === 'right') {
      const flip = dir === 'left';
      const fx = function (dx, w) { return flip ? (18 - dx - w) : dx; };
      P(fx(4, 10), 0, 10, 4, hair);
      P(fx(3, 5), 2, 5, 7, hair);
      P(fx(6, 7), 4, 7, 5, skin);
      P(fx(11, 2), 6, 2, 1, '#2b2020');
      P(fx(5, 8), 9, 8, 9, shirt);
      const sw = stepFrame === 1 ? 1 : stepFrame === 2 ? -1 : 0;
      P(fx(7 + sw, 3), 10, 3, 6, shirt);
      P(fx(7 + sw, 3), 15, 3, 2, skin);
      const la = stepFrame === 1 ? -1 : stepFrame === 2 ? 1 : 0;
      const lb = -la;
      P(fx(6 + la, 3), 18, 3, 5, pantsShade);
      P(fx(6 + la, 4), 23, 4, 3, shoe);
      P(fx(8 + lb, 3), 18, 3, 5, pants);
      P(fx(8 + lb, 4), 23, 4, 3, shoe);
    } else {
      // facing down
      P(4, 0, 10, 3, hair);
      P(3, 2, 12, 3, hair);
      P(3, 4, 2, 5, hair);
      P(13, 4, 2, 5, hair);
      P(5, 4, 8, 5, skin);
      P(5, 3, 8, 1, hair);
      P(7, 6, 2, 1, '#2b2020');
      P(10, 6, 2, 1, '#2b2020');
      P(8, 8, 3, 1, skinShade);
      P(4, 9, 10, 9, shirt);
      P(7, 9, 4, 2, 'rgba(255,255,255,0.22)');
      P(8, 11, 2, 4, '#f7c85a'); // lanyard badge
      P(2, 10, 2, 6, shirt);
      P(14, 10, 2, 6, shirt);
      P(2, 15, 2, 2, skin);
      P(14, 15, 2, 2, skin);
      const la = stepFrame === 1 ? 1 : 0;
      const lb = stepFrame === 2 ? 1 : 0;
      P(5, 18, 3, 5 + la, pants);
      P(10, 18, 3, 5 + lb, pants);
      P(5, 23 + la, 3, 3, shoe);
      P(10, 23 + lb, 3, 3, shoe);
    }
  }

  /** Seated figure (a colleague, or the player) facing the monitor. */
  function drawSeatedFigure(g, cx, baseY, look, isPlayer) {
    const shirt = look.shirt || '#e8e4da';
    const hair = look.hair || '#261b18';
    const bob = isPlayer ? (Math.floor(player.seatT * 4) % 2 ? -1 : 0) : 0;

    // soft shadow on the seat
    g.fillStyle = 'rgba(8,5,14,0.3)';
    g.fillRect(Math.round(cx - 8), Math.round(baseY - 3), 16, 3);

    // torso leaning toward the desk
    fill(g, cx - 7, baseY - 19 + bob, 15, 14, shirt);
    fill(g, cx - 7, baseY - 19 + bob, 15, 2, 'rgba(255,255,255,0.25)');
    fill(g, cx - 7, baseY - 19 + bob, 2, 14, 'rgba(0,0,0,0.16)');
    fill(g, cx + 5, baseY - 19 + bob, 2, 14, 'rgba(0,0,0,0.22)');

    // shoulders + arms reaching to the keyboard
    const reach = isPlayer ? (Math.floor(player.seatT * 9) % 2) : 0;
    fill(g, cx - 10, baseY - 17 + bob, 4, 5, shirt);
    fill(g, cx + 7, baseY - 17 + bob, 4, 5, shirt);
    fill(g, cx - 10, baseY - 22 + reach + bob, 3, 6, shirt);
    fill(g, cx + 8, baseY - 22 - reach + bob, 3, 6, shirt);
    fill(g, cx - 10, baseY - 16 + reach + bob, 3, 2, '#e6b183');
    fill(g, cx + 8, baseY - 16 - reach + bob, 3, 2, '#e6b183');

    // head (we see the back of it)
    fill(g, cx - 6, baseY - 30 + bob, 13, 12, hair);
    fill(g, cx - 6, baseY - 30 + bob, 13, 3, hair);
    fill(g, cx - 5, baseY - 21 + bob, 11, 2, '#c48f62');

    if (isPlayer) {
      // backpack strap so the player reads as "you"
      fill(g, cx - 7, baseY - 19 + bob, 3, 13, '#b14a33');
      fill(g, cx + 4, baseY - 19 + bob, 3, 13, '#b14a33');
      fill(g, cx - 5, baseY - 30 + bob, 11, 1, 'rgba(255,255,255,0.12)');
    }
  }

  /* ---------- thought bubble ------------------------------------------------- */
  function wrapText(g, text, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (g.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Draws the agent's speech/thought bubble in crisp CSS screen space on `vis`. */
  function drawThoughtBubble(g, anchorX, anchorY, line, name, minY, placedRects) {
    if (!line) return;
    g.save();
    const bodyFont = '600 13px "Segoe UI", "Trebuchet MS", system-ui, -apple-system, sans-serif';
    const tagFont = 'bold 11px "Segoe UI", "Trebuchet MS", system-ui, -apple-system, sans-serif';
    g.font = bodyFont;
    g.textBaseline = 'alphabetic';

    const cssW = view.cssW || 800;
    const cssH = view.cssH || 600;
    const maxW = Math.min(268, Math.max(176, cssW - 36));
    const lines = wrapText(g, line.text, maxW);
    let textW = 0;
    lines.forEach(function (l) { textW = Math.max(textW, g.measureText(l).width); });

    const label = line.tag === 'jargon' ? 'JARGON' : line.tag === 'idiom' ? 'IDIOM' : line.tag === 'tip' ? 'TIP'
                : line.tag === 'note' ? 'MY DESK' : 'FACT';
    const tag = (name ? name.toUpperCase() + ' · ' : '') + label;
    g.font = tagFont;
    const tagW = g.measureText(tag).width + 6;

    const padX = 12;
    const padY = 10;
    const tagH = 22;
    const lineH = 18;
    const boxW = Math.min(maxW + padX * 2, Math.ceil(Math.max(textW, tagW)) + padX * 2);
    const boxH = tagH + lines.length * lineH + padY + 4;

    const pt = worldToCss(anchorX, anchorY);
    const sx = pt.x;
    const sy = pt.y;
    const gapAbove = (player.seated && line.tag !== 'jargon') ? 26 : 12;

    let bx = Math.round(sx - boxW / 2);
    let by = Math.round(sy - boxH - gapAbove);

    bx = clamp(bx, 8, Math.max(8, cssW - boxW - 8));
    by = clamp(by, minY == null ? 8 : minY, Math.max(8, cssH - boxH - 14));

    // Avoid overlapping previously drawn bubbles
    if (placedRects && placedRects.length) {
      for (let i = 0; i < placedRects.length; i++) {
        const r = placedRects[i];
        const overlapX = bx < r.x + r.w + 6 && bx + boxW + 6 > r.x;
        const overlapY = by < r.y + r.h + 6 && by + boxH + 6 > r.y;
        if (overlapX && overlapY) {
          const tryAbove = r.y - boxH - 8;
          if (tryAbove >= (minY == null ? 8 : minY)) {
            by = tryAbove;
          } else {
            by = Math.min(cssH - boxH - 14, r.y + r.h + 8);
          }
        }
      }
      placedRects.push({ x: bx, y: by, w: boxW, h: boxH });
    }

    const bgFill = line.tag === 'jargon' ? '#1a1330'
                 : line.tag === 'idiom'  ? '#211838'
                 : line.tag === 'note'   ? '#14231b'
                 : '#13202a';
    const borderCol = line.tag === 'jargon' ? '#f7c85a'
                    : line.tag === 'idiom'  ? '#d6ad54'
                    : line.tag === 'note'   ? '#74c686'
                    : '#74e6d6';
    const tagCol = (line.tag === 'jargon' || line.tag === 'idiom') ? '#ffd666'
                 : line.tag === 'note' ? '#9ef0ac'
                 : '#7cebe0';

    // outer shadow + crisp panel
    g.fillStyle = 'rgba(5, 3, 12, 0.72)';
    g.fillRect(bx + 2, by + 3, boxW, boxH);
    g.fillStyle = bgFill;
    g.fillRect(bx, by, boxW, boxH);
    g.strokeStyle = borderCol;
    g.lineWidth = 1.75;
    g.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

    // tag row
    g.fillStyle = tagCol;
    g.font = tagFont;
    g.fillText(tag, bx + padX, by + 15);
    g.fillStyle = 'rgba(255, 255, 255, 0.16)';
    g.fillRect(bx + padX, by + 20, boxW - padX * 2, 1);

    // body text (crisp white with subtle dark shadow for readability)
    g.font = bodyFont;
    for (let i = 0; i < lines.length; i++) {
      const ty = by + tagH + 14 + i * lineH;
      g.fillStyle = 'rgba(0, 0, 0, 0.75)';
      g.fillText(lines[i], bx + padX + 1, ty + 1);
      g.fillStyle = '#ffffff';
      g.fillText(lines[i], bx + padX, ty);
    }

    // pointer tail
    const tailX = clamp(Math.round(sx), bx + 14, bx + boxW - 14);
    g.fillStyle = borderCol;
    g.fillRect(tailX - 5, by + boxH, 10, 3);
    g.fillRect(tailX - 3, by + boxH + 3, 6, 3);
    g.fillRect(tailX - 1, by + boxH + 6, 2, 2);
    g.fillStyle = bgFill;
    g.fillRect(tailX - 4, by + boxH - 1, 8, 3);
    g.fillRect(tailX - 2, by + boxH + 2, 4, 2);
    g.restore();
  }

  /* ---------- the player character ---------------------------------------- */
  function drawPlayer(g) {
    const x = Math.round(player.x);
    const y = Math.round(player.y);

    /* Seated at a desk: draw the same character from behind, facing the screen. */
    if (player.seated) {
      drawSeatedFigure(g, x, y, { shirt: '#e8e4da', hair: '#261b18' }, true);
      return;
    }

    // ground shadow (pixel-stepped so it stays in style)
    g.fillStyle = 'rgba(8,5,14,0.34)';
    g.fillRect(x - 8, y - 3, 16, 3);
    g.fillRect(x - 5, y - 4, 10, 1);

    const walking = player.moving;
    const phase = Math.floor(player.animT * 9) % 4;
    const stepFrame = walking ? [0, 1, 0, 2][phase] : 0;
    const bob = walking && stepFrame !== 0 ? -1 : 0;
    const left = x - 9;
    const top = y - 27 + bob;

    const P = function (dx, dy, w, h, color) {
      g.fillStyle = color;
      g.fillRect(left + dx, top + dy, w, h);
    };

    const skin = '#e6b183';
    const skinShade = '#c48f62';
    const hair = '#261b18';
    const shirt = '#e8e4da';
    const shirtShade = '#c8c2b4';
    const pants = '#2d3654';
    const pantsShade = '#212940';
    const shoe = '#191724';
    const pack = '#b14a33';
    const packShade = '#8b3624';

    if (player.dir === 'down') {
      P(4, 0, 10, 3, hair);
      P(3, 2, 12, 3, hair);
      P(3, 4, 2, 5, hair);
      P(13, 4, 2, 5, hair);
      P(5, 4, 8, 5, skin);
      P(5, 3, 8, 1, hair);
      P(7, 6, 2, 1, '#2b2020');
      P(10, 6, 2, 1, '#2b2020');
      P(8, 8, 3, 1, skinShade);
      // torso
      P(4, 9, 10, 9, shirt);
      P(4, 9, 2, 9, shirtShade);
      P(12, 9, 2, 9, shirtShade);
      P(8, 9, 3, 2, '#9db3d6');
      P(8, 11, 3, 2, '#7d94bd');
      // arms
      P(2, 10, 2, 6, shirt);
      P(14, 10, 2, 6, shirt);
      P(2, 15, 2, 2, skin);
      P(14, 15, 2, 2, skin);
      // legs
      const la = stepFrame === 1 ? 1 : 0;
      const lb = stepFrame === 2 ? 1 : 0;
      P(5, 18, 3, 5 + la, pants);
      P(10, 18, 3, 5 + lb, pants);
      P(5, 23 + la, 3, 3, shoe);
      P(10, 23 + lb, 3, 3, shoe);
      P(5, 18, 3, 1, pantsShade);
      P(10, 18, 3, 1, pantsShade);
    } else if (player.dir === 'up') {
      P(3, 1, 12, 11, hair);
      P(4, 0, 10, 2, hair);
      P(4, 11, 10, 2, skinShade);
      // backpack
      P(4, 10, 10, 10, pack);
      P(4, 10, 10, 3, '#c25a42');
      P(5, 12, 8, 6, packShade);
      P(6, 13, 6, 2, '#d97a5f');
      // arms
      P(2, 11, 2, 6, shirt);
      P(14, 11, 2, 6, shirt);
      P(2, 16, 2, 2, skin);
      P(14, 16, 2, 2, skin);
      // legs
      const la = stepFrame === 1 ? 1 : 0;
      const lb = stepFrame === 2 ? 1 : 0;
      P(5, 19, 3, 5 + la, pants);
      P(10, 19, 3, 5 + lb, pants);
      P(5, 24 + la, 3, 3, shoe);
      P(10, 24 + lb, 3, 3, shoe);
    } else {
      const flip = player.dir === 'left';
      const M = function (dx, dy, w, h, color) {
        const nx = flip ? 18 - dx - w : dx;
        g.fillStyle = color;
        g.fillRect(left + nx, top + dy, w, h);
      };
      // head
      M(4, 1, 10, 10, hair);
      M(5, 3, 8, 6, skin);
      M(4, 1, 10, 2, hair);
      M(4, 8, 4, 3, hair);          // hair at the back of the head
      M(11, 5, 2, 1, '#2b2020');    // eye
      M(12, 7, 2, 1, skinShade);    // nose
      // torso
      M(5, 10, 8, 9, shirt);
      M(5, 10, 2, 9, shirtShade);
      M(11, 10, 2, 9, shirtShade);
      M(9, 10, 2, 3, '#9db3d6');
      // arm swings
      const armY = stepFrame === 1 ? 1 : 0;
      M(13, 11 - armY, 2, 5, shirt);
      M(13, 15 - armY, 2, 2, skin);
      M(3, 11 + armY, 2, 5, shirtShade);
      M(3, 15 + armY, 2, 2, skinShade);
      // legs
      const la = stepFrame === 1 ? 1 : 0;
      const lb = stepFrame === 2 ? 1 : 0;
      M(6, 19, 3, 5 + la, pants);
      M(9, 19, 3, 5 + lb, pants);
      M(6, 24 + la, 4, 3, shoe);
      M(9, 24 + lb, 4, 3, shoe);
    }
  }

  /* ---------- floating markers + target outline --------------------------- */
  const MARKER_STYLE = {
    new:    { bg: '#f7c85a', fg: '#2a1f0a', glyph: '!' },
    done:   { bg: '#6fce8b', fg: '#0d2716', glyph: '✓' },
    info:   { bg: '#7fb6c9', fg: '#0b1e26', glyph: '?' },
    locked: { bg: '#8e8399', fg: '#211a2c', glyph: '⌂' },
    open:   { bg: '#86e58c', fg: '#0d2716', glyph: '▸' }
  };

  function drawIndicators(g) {
    const t = performance.now() / 1000;
    room.objects.forEach(function (o) {
      if (!o.markerPx) return;
      const rule = MARKER_RULES[o.interact];
      if (!rule) return;
      let kind;
      try { kind = rule(o); } catch (e) { return; }   // `o` lets per-object rules decide
      if (!kind) return;

      const st = MARKER_STYLE[kind];
      if (!st) return;
      const bx = o.markerPx.x;
      const by = o.markerPx.y - 6 + Math.sin(t * 2.4 + bx * 0.02) * 2;
      const focused = currentTarget && currentTarget.id === o.id;

      if (kind === 'new' || kind === 'open' || focused) {
        glow(g, bx, by, 16, '247,200,90', 0.20);
      }

      // badge
      g.fillStyle = 'rgba(8,5,14,0.4)';
      g.fillRect(bx - 7, by - 6, 15, 15);
      g.fillStyle = st.bg;
      g.fillRect(bx - 7, by - 7, 14, 14);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(bx - 7, by - 7, 14, 2);

      g.fillStyle = st.fg;
      g.font = 'bold 10px "Courier New", monospace';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(st.glyph, bx, by + 1);

      // little pointer
      g.fillStyle = st.bg;
      g.fillRect(bx - 2, by + 7, 4, 2);
      g.fillRect(bx - 1, by + 9, 2, 2);

      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
    });

    // outline on whatever the player can currently inspect
    if (currentTarget && currentTarget.rectPx && !player.seated) {
      const r = currentTarget.rectPx;
      g.save();
      g.strokeStyle = 'rgba(247,200,90,0.8)';
      g.lineWidth = 1;
      g.setLineDash([4, 3]);
      g.lineDashOffset = -(t * 14) % 7;
      g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      g.restore();
    }
  }

  /* ---------- roaming student jargon helpers ------------------------------- */
  function initBotState(o) {
    const bot = o && o.bot;
    if (!bot || bot._inited) return;
    bot._inited = true;
    bot.homeX = (o.chair.x + o.chair.w / 2) * TILE;
    bot.homeY = (o.chair.y + o.chair.h) * TILE + 8;
    bot.x = bot.homeX;
    bot.y = bot.homeY;
    bot.dir = 'down';
    bot.moving = false;
    bot.animT = 0;
    bot.roaming = false;
    bot.returning = false;
    bot.targetX = bot.homeX;
    bot.targetY = bot.homeY;
    bot.roamT = 0;
    bot.maxRoamT = 14;
    bot.pauseT = 0;
    bot.cooldownT = 1.2 + Math.random() * 4.5;
  }

  function pickJargonIndex(current) {
    const jargonIndices = [];
    for (let i = 0; i < BOT_LINES.length; i++) {
      if (BOT_LINES[i].tag === 'jargon') jargonIndices.push(i);
    }
    const pool = jargonIndices.length
      ? jargonIndices
      : BOT_LINES.map(function (_, idx) { return idx; });
    if (!pool.length) return 0;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && pick === current) {
      pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    }
    return pick;
  }

  function pickBotWaypoint(o, bot) {
    const candidates = [
      { x: (o.chair.x + o.chair.w / 2) * TILE, y: (o.chair.y + o.chair.h + 1.2) * TILE },
      { x: 6.2 * TILE, y: 8.2 * TILE },
      { x: 10.2 * TILE, y: 8.2 * TILE },
      { x: 14.2 * TILE, y: 8.2 * TILE },
      { x: 17.8 * TILE, y: 8.2 * TILE },
      { x: 6.2 * TILE, y: 12.6 * TILE },
      { x: 10.5 * TILE, y: 12.6 * TILE },
      { x: 14.5 * TILE, y: 12.6 * TILE },
      { x: 9.5 * TILE, y: 4.3 * TILE },
      { x: 13.5 * TILE, y: 4.3 * TILE }
    ];
    for (let tries = 0; tries < 14; tries++) {
      const c = candidates[Math.floor(Math.random() * candidates.length)];
      const tx = clamp(c.x + (Math.random() - 0.5) * 16, 2 * TILE, (room.cols - 2) * TILE);
      const ty = clamp(c.y + (Math.random() - 0.5) * 10, 3.8 * TILE, (room.rows - 1.8) * TILE);
      if (canStand(tx, ty) && Math.hypot(tx - bot.x, ty - bot.y) > 20) {
        return { x: tx, y: ty };
      }
    }
    return { x: bot.homeX, y: bot.homeY };
  }

  function updateBots(dt) {
    if (!room || !room.objects) return;
    if (!state.started || state.paused || roundOver() || Dialogue.open || Book.open) return;

    let roamingCount = 0;
    const stations = [];
    for (let i = 0; i < room.objects.length; i++) {
      const o = room.objects[i];
      if (!o.bot || !o.chair) continue;
      initBotState(o);
      if (player.seated === o) {
        o.bot.roaming = false;
        o.bot.returning = false;
        o.bot.moving = false;
        continue;
      }
      if (o.bot.roaming) roamingCount++;
      stations.push(o);
    }

    for (let i = 0; i < stations.length; i++) {
      const o = stations[i];
      const bot = o.bot;
      if (bot.roaming) {
        bot.roamT += dt;
        bot.thoughtT += dt;
        if (bot.thoughtT > 6.5) {
          bot.thought = pickJargonIndex(bot.thought);
          bot.thoughtT = 0;
        }
        if (bot.roamT >= bot.maxRoamT && !bot.returning) {
          bot.returning = true;
          bot.targetX = bot.homeX;
          bot.targetY = bot.homeY;
          bot.pauseT = 0;
        }

        if (bot.pauseT > 0) {
          bot.pauseT -= dt;
          bot.moving = false;
          bot.dir = 'down';
          if (bot.pauseT <= 0 && !bot.returning) {
            const wp = pickBotWaypoint(o, bot);
            bot.targetX = wp.x;
            bot.targetY = wp.y;
          }
        } else {
          const dx = bot.targetX - bot.x;
          const dy = bot.targetY - bot.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 3) {
            bot.x = bot.targetX;
            bot.y = bot.targetY;
            bot.moving = false;
            if (bot.returning) {
              bot.roaming = false;
              bot.returning = false;
              bot.seated = true;
              bot.thought = -1;
              bot.cooldownT = 6 + Math.random() * 8;
              roamingCount = Math.max(0, roamingCount - 1);
            } else {
              bot.pauseT = 2.6 + Math.random() * 1.8;
              bot.dir = 'down';
            }
          } else {
            const speed = 40;
            const step = Math.min(dist, speed * dt);
            const nx = bot.x + (dx / dist) * step;
            const ny = bot.y + (dy / dist) * step;
            if (Math.abs(dx) > Math.abs(dy)) bot.dir = dx < 0 ? 'left' : 'right';
            else bot.dir = dy < 0 ? 'up' : 'down';

            if (bot.returning || canStand(nx, ny)) {
              bot.x = nx;
              bot.y = ny;
              bot.moving = true;
              bot.animT += dt;
            } else if (canStand(nx, bot.y)) {
              bot.x = nx;
              bot.moving = true;
              bot.animT += dt;
            } else if (canStand(bot.x, ny)) {
              bot.y = ny;
              bot.moving = true;
              bot.animT += dt;
            } else {
              const wp = pickBotWaypoint(o, bot);
              bot.targetX = wp.x;
              bot.targetY = wp.y;
              bot.pauseT = 1.0;
              bot.moving = false;
            }
          }
        }
      } else {
        bot.cooldownT -= dt;
        if (bot.cooldownT <= 0 && roamingCount < 2) {
          bot.roaming = true;
          bot.returning = false;
          bot.seated = false;
          bot.x = bot.homeX;
          bot.y = bot.homeY;
          bot.roamT = 0;
          bot.maxRoamT = 13 + Math.random() * 6;
          bot.thought = pickJargonIndex(bot.thought);
          bot.thoughtT = 0;
          const wp = pickBotWaypoint(o, bot);
          bot.targetX = wp.x;
          bot.targetY = wp.y;
          bot.pauseT = 0.5;
          roamingCount++;
        } else if (bot.cooldownT <= 0) {
          bot.cooldownT = 2 + Math.random() * 4;
        }
      }
    }
  }

  /** Draws the thought bubble of a seated or roaming student agent in CSS space. */
  function drawThoughts(g) {
    const minY = 52;
    const placedRects = [];

    const station = player.seated;
    if (station && !Dialogue.open && !Book.open) {
      const line = station.bot ? BOT_LINES[station.bot.thought] : MY_DESK_LINES[player.selfThought];
      if (line) {
        const anchorX = (station.chair.x + station.chair.w / 2) * TILE;
        const anchorY = (station.chair.y + station.chair.h) * TILE - 30;
        drawThoughtBubble(g, anchorX, anchorY, line, station.bot ? station.bot.name : null, minY, placedRects);
      }
    }

    /* Roaming students sharing helpful BPO jargons around the floor */
    if (room && room.objects && !Dialogue.open && !Book.open) {
      for (let i = 0; i < room.objects.length; i++) {
        const o = room.objects[i];
        const bot = o.bot;
        if (!bot || !bot.roaming || player.seated === o) continue;
        const rLine = BOT_LINES[bot.thought];
        if (!rLine) continue;
        drawThoughtBubble(g, bot.x, bot.y - 28, rLine, bot.name, minY, placedRects);
      }
    }
  }

  /* ---------- viewport sizing --------------------------------------------- */
  function buildVignette() {
    vignette.width = frame.width;
    vignette.height = frame.height;
    const vg = vignette.getContext('2d');
    const w = vignette.width, h = vignette.height;
    vg.clearRect(0, 0, w, h);
    const grd = vg.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.26,
                                        w / 2, h * 0.5, Math.max(w, h) * 0.72);
    grd.addColorStop(0, 'rgba(8,5,16,0)');
    grd.addColorStop(0.62, 'rgba(8,5,16,0.16)');
    grd.addColorStop(1, 'rgba(6,4,12,0.62)');
    vg.fillStyle = grd;
    vg.fillRect(0, 0, w, h);

    const warm = vg.createRadialGradient(w / 2, h * 0.44, 0, w / 2, h * 0.46, Math.max(w, h) * 0.6);
    warm.addColorStop(0, 'rgba(255,214,150,0.05)');
    warm.addColorStop(1, 'rgba(255,214,150,0)');
    vg.fillStyle = warm;
    vg.fillRect(0, 0, w, h);
  }

  function resize() {
    const rect = el.shell.getBoundingClientRect();
    const cssW = Math.max(320, Math.round(rect.width));
    const cssH = Math.max(320, Math.round(rect.height));
    const worldW = room.cols * TILE;
    const worldH = room.rows * TILE;

    /* Prefer a scale where the whole room fits (single-screen rooms). On a
       narrow phone the minimum scale wins and the follow camera scrolls. */
    let S = Math.min((cssW - 8) / worldW, (cssH - 24) / worldH);
    if (S > 2.15) S = Math.min(S, 2.4);        // do not over-zoom small rooms
    else if (S < 1.45) S = 1.45;               // readable minimum on phones
    S = clamp(S, 1.0, 2.5);
    S = Math.max(1.0, Math.floor(S * 8) / 8);

    view.S = S;
    view.cssW = cssW;
    view.cssH = cssH;
    view.offW = Math.max(220, Math.round(cssW / S));
    view.offH = Math.max(220, Math.round(cssH / S));

    frame.width = view.offW;
    frame.height = view.offH;
    frameCtx = frame.getContext('2d');
    frameCtx.imageSmoothingEnabled = false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    vis = canvas.getContext('2d');
    vis.imageSmoothingEnabled = false;

    buildVignette();
    updateCamera(0, true);
    if (typeof updatePromptUI === 'function') updatePromptUI();
  }

  /* ---------- frame assembly ---------------------------------------------- */
  function render() {
    const g = frameCtx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = C.void;
    g.fillRect(0, 0, frame.width, frame.height);

    g.save();
    g.translate(-cam.left, -cam.top);

    if (room.static) g.drawImage(room.static, 0, 0);

    // depth-sorted actors: furniture + the player + roaming students
    drawList.length = 0;
    for (let i = 0; i < room.visuals.length; i++) {
      const v = room.visuals[i];
      if (v.botObj && v.botObj.bot) {
        const b = v.botObj.bot;
        v.depth = (b.roaming && player.seated !== v.botObj)
          ? b.y
          : (v.botObj.chair.y + v.botObj.chair.h) * TILE + 1;
      }
      drawList.push(v);
    }
    playerVisual.depth = player.seated
      ? (player.seated.chair.y + player.seated.chair.h) * TILE + 2
      : player.y;
    playerVisual.draw = drawPlayer;
    drawList.push(playerVisual);
    robotVisual.depth = ROBOT.y + 0.5;      // just behind the player at equal y
    robotVisual.draw = drawRobot;
    drawList.push(robotVisual);
    drawList.sort(function (a, b) { return a.depth - b.depth; });
    for (let i = 0; i < drawList.length; i++) drawList[i].draw(g);

    drawIndicators(g);

    /* v2.0 ambience: doorway light, sparks, dust motes, target brackets */
    drawDoorLight(g);
    drawFx(g);
    drawMotes(g);
    drawTargetHighlight(g);
    g.restore();

    // night grade + vignette (screen space of the frame buffer)
    g.fillStyle = 'rgba(38,30,74,0.10)';
    g.fillRect(0, 0, frame.width, frame.height);
    g.drawImage(vignette, 0, 0);

    // blit to the visible canvas with smoothing disabled — crisp pixels
    vis.setTransform(1, 0, 0, 1, 0, 0);
    vis.imageSmoothingEnabled = false;
    vis.drawImage(frame, 0, 0, frame.width, frame.height, 0, 0, canvas.width, canvas.height);

    // draw speech/thought bubbles at native HiDPI screen resolution so text is crystal-clear
    const dpr = canvas.width / Math.max(1, view.cssW || canvas.width);
    vis.save();
    vis.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawThoughts(vis);
    drawRobotBubble(vis);
    vis.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     12b. COMPANION, PROGRESSION & EFFECTS   (v2.0)
     ---------------------------------------------------------------------
     Everything in this section is additive. It never gates the escape chain:
     awards only fire from a real completion event (a correct answer, a
     collected card, an opened door, a cleared room) and every DOM write is
     null-guarded so a missing node can never break the game loop.

       PROG        XP, level, coins, streak, achievements
       ROBOT       "Robi", the pixel companion that trails the player
       FX          spark particles + drifting ambient dust motes
       Progression the small API the rest of the engine calls
     ══════════════════════════════════════════════════════════════════════════ */

  /* ---------- level curve -------------------------------------------------- */
  /** XP needed to walk from `level` to `level + 1`. Gentle early, slower later. */
  function xpForLevel(level) { return 90 + (level - 1) * 70; }
  const STARTER_XP = 30;

  const PROG = {
    xp: STARTER_XP,
    level: 1,
    coins: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    achievements: {}          // { achievementId: true }
  };

  const ACHIEVEMENTS = [
    { id: 'first_card', icon: '▣', name: 'First Find',       desc: 'Recover your first review card.' },
    { id: 'all_cards',  icon: '▦', name: 'Card Collector',   desc: 'Recover all three review cards.' },
    { id: 'clean_run',  icon: '◆', name: 'Clean Signal',     desc: 'Answer five questions in a row without a miss.' },
    { id: 'bay_clear',  icon: '☎', name: 'Bay Champion',     desc: 'Clear all six Mock Call Bay questions.' },
    { id: 'escape',     icon: '➤', name: 'Floor Cleared',    desc: 'Walk out of the training floor.' },
    { id: 'level5',     icon: '★', name: 'Rising Agent',     desc: 'Reach level 5.' },
    { id: 'scholar',    icon: '▤', name: 'Bookworm',         desc: 'Open the handbook during a run.' },
    { id: 'flawless',   icon: '✎', name: 'Flawless Escape',  desc: 'Escape the floor with 100% accuracy.' },
    /* ── Room 2 ── */
    { id: 'wing_unlock', icon: '☆', name: 'Clearance Granted', desc: 'Unlock the QA & Escalation Wing.' },
    { id: 'wing_clear',  icon: '◇', name: 'Quality Assured',   desc: 'Clear all six QA Wing consoles.' },
    { id: 'wing_relics', icon: '◈', name: 'Relic Hunter',      desc: 'Recover all three QA Wing relics.' }
  ];

  function achievementById(id) {
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      if (ACHIEVEMENTS[i].id === id) return ACHIEVEMENTS[i];
    }
    return null;
  }

  function achievementCount() {
    let n = 0;
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      if (PROG.achievements[ACHIEVEMENTS[i].id]) n++;
    }
    return n;
  }

  /* ---------- reward popups (DOM nodes floating over the canvas) ---------- */
  let popCursor = 0;

  function popReward(text, kind, wx, wy) {
    if (!el.rewardLayer) return;
    const p = worldToCss(wx == null ? player.x : wx, (wy == null ? player.y : wy) - 26);
    const node = document.createElement('div');
    node.className = 'reward-pop' + (kind ? ' reward-pop--' + kind : '');
    node.textContent = text;
    node.style.left = Math.round(p.x) + 'px';
    node.style.top = Math.round(p.y - popCursor * 14) + 'px';
    el.rewardLayer.appendChild(node);
    popCursor = (popCursor + 1) % 3;
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 1200);
  }

  let levelTimer = 0;

  function showLevelBurst(level) {
    if (!el.levelburst || !el.levelburstV) return;
    el.levelburstV.textContent = level;
    el.levelburst.hidden = false;
    el.levelburst.style.animation = 'none';
    void el.levelburst.offsetWidth;              // repaint so the animation restarts
    el.levelburst.style.animation = '';
    clearTimeout(levelTimer);
    levelTimer = setTimeout(function () {
      if (el.levelburst) el.levelburst.hidden = true;
    }, 1500);
    Sound.good();
    fxBurst(player.x, player.y - 14, '247,200,90', 20);
    robotSay('Level ' + level + '! Nice work, agent.', 'cheer', 3);
  }

  /* ---------- HUD: level / XP / wallet / objectives ----------------------- */
  function renderProgHud() {
    const need = xpForLevel(PROG.level);
    const pct = clamp(Math.round((PROG.xp / need) * 100), 0, 100);
    if (el.lvlBadge) el.lvlBadge.textContent = 'LV ' + PROG.level;
    if (el.xpLabel) el.xpLabel.textContent = PROG.xp + ' / ' + need + ' XP';
    if (el.xpBar) el.xpBar.style.width = pct + '%';
    if (el.coinCount) el.coinCount.textContent = '◎ ' + PROG.coins;
    if (el.streakChip) {
      el.streakChip.textContent = '▲ ' + PROG.streak;
      el.streakChip.classList.toggle('is-hot', PROG.streak >= 3);
    }
    if (el.badgeCount) el.badgeCount.textContent = '★ ' + achievementCount() + '/' + ACHIEVEMENTS.length;
  }

  /** Small pop on a wallet chip when its number changes. */
  function popChip(node) {
    if (!node) return;
    node.classList.remove('is-pop');
    void node.offsetWidth;
    node.classList.add('is-pop');
    setTimeout(function () { node.classList.remove('is-pop'); }, 460);
  }

  /** The objective checklist inside the mission panel. */
  function renderObjectives() {
    if (!el.objList || !room) return;
    const rows = [];
    const bayDone = BAY_QUESTIONS.filter(function (id) { return !!state.solved[id]; }).length;

    if (room.id === 'lab2') {
      const wdone = wingSolvedCount(), relics = relicCount();
      rows.push({ txt: 'Answer the wing consoles', n: wdone + '/' + WING_QUESTIONS.length, done: wdone >= WING_QUESTIONS.length });
      rows.push({ txt: 'Log the QA relics', n: relics + '/' + WING_RELICS.length, done: relics >= WING_RELICS.length, optional: true });
      rows.push({ txt: 'Return to the training floor for Exit Door', done: !!state.doorOpen, optional: true });
    } else if (room.id === 'bay') {
      rows.push({ txt: 'Answer the booth & board questions', n: bayDone + '/' + BAY_QUESTIONS.length, done: bayDone >= BAY_QUESTIONS.length });
      rows.push({ txt: 'Earn the bonus review card', done: !!state.bonus, optional: true });
      rows.push({ txt: 'Return to the training floor', done: false, optional: true });
    } else {
      const cardsFound = requiredCardCount();
      const wingDone = wingSolvedCount();
      rows.push({ txt: 'Recover 3 review cards', n: cardsFound + '/' + CLUES_REQUIRED, done: cardsFound >= CLUES_REQUIRED });
      rows.push({ txt: 'Answer the terminal questions', n: mainSolvedCount() + '/6', done: mainSolvedCount() >= 6 });
      rows.push({ txt: 'Clear the Mock Call Bay', n: bayDone + '/' + BAY_QUESTIONS.length, done: bayDone >= BAY_QUESTIONS.length });
      rows.push({ txt: 'Unlock the QA & Escalation Wing', done: wingIsOpen() });
      rows.push({ txt: 'Clear the QA Wing consoles', n: wingDone + '/' + WING_QUESTIONS.length, done: wingDone >= WING_QUESTIONS.length });
      rows.push({ txt: 'Unlock the exit door', done: !!state.doorOpen });
      rows.push({ txt: 'Escape the training floor', done: !!state.completed });
    }

    /* Phones get a condensed tracker: a progress line + the open objectives,
       so the panel never swallows the play area. */
    const compact = window.innerWidth <= 720;
    let shown = rows;
    if (compact) {
      const doneN = rows.filter(function (r) { return r.done; }).length;
      const open = rows.filter(function (r) { return !r.done; }).slice(0, 2);
      shown = [{ txt: doneN + ' / ' + rows.length + ' objectives complete', done: doneN === rows.length, head: true }]
        .concat(open);
    }

    /* the first unfinished row is the "next" objective */
    let nextSet = false;
    el.objList.innerHTML = shown.map(function (r) {
      let cls = 'obj-item';
      if (r.done) cls += ' is-done';
      else if (!nextSet) { cls += ' is-next'; nextSet = true; }
      if (r.optional) cls += ' is-optional';
      if (r.head) cls += ' is-head';
      return '<li class="' + cls + '">' +
             '<span class="obj-item__mark">' + (r.done ? '✔' : '▸') + '</span>' +
             '<span class="obj-item__txt">' + escapeHtml(r.txt) + '</span>' +
             (r.n ? '<span class="obj-item__n">' + r.n + '</span>' : '') +
             '</li>';
    }).join('');
  }

  /** Re-render the tracker on resize (desktop vs phone layout). */
  (function watchObjectives() {
    let t = 0;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        try { renderObjectives(); } catch (e) {}
      }, 180);
    });
  })();

  /** How many of the six card questions (two per station) are solved. */
  function mainSolvedCount() {
    let n = 0;
    for (let i = 0; i < MAIN_QUESTIONS.length; i++) if (state.solved[MAIN_QUESTIONS[i]]) n++;
    return n;
  }

  /** Progression recap inside the pause menu. */
  function renderPauseProgress() {
    if (el.pauseProgRow) {
      const need = xpForLevel(PROG.level);
      el.pauseProgRow.innerHTML =
        '<span class="pause-prog__chip">LV ' + PROG.level + '</span>' +
        '<span class="pause-prog__chip">' + PROG.xp + ' / ' + need + ' XP</span>' +
        '<span class="pause-prog__chip">◎ ' + PROG.coins + '</span>' +
        '<span class="pause-prog__chip">▲ best ' + PROG.bestStreak + '</span>' +
        '<span class="pause-prog__chip">★ ' + achievementCount() + ' / ' + ACHIEVEMENTS.length + '</span>';
    }
    if (el.pauseAchv) {
      el.pauseAchv.innerHTML = ACHIEVEMENTS.map(function (a) {
        const got = !!PROG.achievements[a.id];
        return '<span class="achv-pill' + (got ? '' : ' is-locked') + '" title="' +
               escapeHtml(a.desc) + '">' + a.icon + ' ' + escapeHtml(a.name) + '</span>';
      }).join('');
    }
  }

  /** Achievement strip on the results screen. */
  function renderAchvStrip() {
    if (!el.achvStrip) return;
    el.achvStrip.innerHTML = ACHIEVEMENTS.map(function (a) {
      const got = !!PROG.achievements[a.id];
      return '<span class="achv-pill' + (got ? '' : ' is-locked') + '" title="' +
             escapeHtml(a.desc) + '">' + a.icon + ' ' + escapeHtml(a.name) + '</span>';
    }).join('');
  }

  /* ---------- achievement popup ------------------------------------------ */
  function showAchievement(a) {
    if (!a) return;
    if (el.achvHost) {
      const node = document.createElement('div');
      node.className = 'achv';
      node.innerHTML = '<span class="achv__icon">' + a.icon + '</span>' +
                       '<div><div class="achv__k">Achievement</div>' +
                       '<div class="achv__v">' + escapeHtml(a.name) + '</div></div>';
      el.achvHost.appendChild(node);
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 3000);
    }
    popChip(el.badgeCount);
    Sound.pickup();
    robotSay('Achievement unlocked: ' + a.name + '!', 'cheer', 3);
  }

  /* ---------- the progression API ---------------------------------------- */
  const Progression = {
    /** Total spendable XP across all earned levels. */
    totalXp() {
      let total = PROG.xp;
      for (let lv = 1; lv < PROG.level; lv++) total += xpForLevel(lv);
      return total;
    },

    /** Spend XP (e.g. for a letter hint), stepping down a level if needed. */
    spendXp(cost) {
      cost = Math.max(0, Math.round(cost));
      if (!cost) return true;
      if (this.totalXp() < cost) return false;
      let rem = cost;
      while (rem > 0) {
        if (PROG.xp >= rem) {
          PROG.xp -= rem;
          rem = 0;
        } else if (PROG.level > 1) {
          rem -= PROG.xp;
          PROG.level--;
          PROG.xp = xpForLevel(PROG.level);
        } else {
          PROG.xp = 0;
          rem = 0;
        }
      }
      popReward('-' + cost + ' XP (Hint)', 'xp');
      renderProgHud();
      if (state.started) saveLocal();
      return true;
    },

    /** Add XP (handles multi-level ups) and update the HUD. */
    addXp(amount, silent) {
      if (!amount) return;
      PROG.xp += Math.max(0, Math.round(amount));
      let ups = 0;
      while (PROG.xp >= xpForLevel(PROG.level) && PROG.level < 99) {
        PROG.xp -= xpForLevel(PROG.level);
        PROG.level++;
        ups++;
      }
      if (!silent) popReward('+' + Math.round(amount) + ' XP', 'xp');
      if (ups) {
        showLevelBurst(PROG.level);
        if (PROG.level >= 5) this.unlock('level5');
      }
      renderProgHud();
      return ups;
    },

    addCoins(amount, silent) {
      if (!amount) return;
      PROG.coins += Math.max(0, Math.round(amount));
      if (!silent) popReward('+' + Math.round(amount) + ' ◎', 'coin');
      popChip(el.coinCount);
      renderProgHud();
    },

    /** Unlock an achievement once. Returns true if it was new. */
    unlock(id) {
      const a = achievementById(id);
      if (!a || PROG.achievements[id]) return false;
      PROG.achievements[id] = true;
      showAchievement(a);
      this.addCoins(15, true);
      renderProgHud();
      if (state.started) saveLocal();
      return true;
    },

    /* --- real reward events ---------------------------------------------- */
    onCorrect(qid, firstTry) {
      PROG.correct++;
      PROG.streak++;
      PROG.bestStreak = Math.max(PROG.bestStreak, PROG.streak);
      const xp = firstTry ? 40 : 22;
      const coins = firstTry ? 5 : 2;
      this.addXp(xp);
      this.addCoins(coins);
      if (el.quizXp) {
        el.quizXp.innerHTML = 'Reward <b>+' + xp + ' XP</b> · <b>+' + coins + ' ◎</b>' +
          ' <span class="streak-tag">· streak ▲ ' + PROG.streak + '</span>';
      }
      popChip(el.streakChip);
      renderProgHud();
      fxBurst(player.x, player.y - 14, '134,229,140', 14);
      moveRobotNear(10);
      robotSay(firstTry
        ? 'Perfect first try! +' + xp + ' XP.'
        : 'Correct! +' + xp + ' XP.', 'cheer', 3.2);
      if (PROG.streak >= 5) this.unlock('clean_run');
      checkWingClear();
      renderObjectives();
    },

    onWrong(qid) {
      PROG.wrong++;
      PROG.streak = 0;
      renderProgHud();
      popChip(el.streakChip);
      if (el.quizXp) {
        el.quizXp.innerHTML = 'No XP this time — check the handbook or spend <b>' +
          LETTER_HINT_COST + ' XP</b> for a letter hint.';
      }
      robotSay(hintLineFor(qid), 'sad', 4);
      renderObjectives();
    },

    onClue(id) {
      this.addXp(60);
      this.addCoins(6);
      const item = ITEMS[id];
      robotSay(item ? ('Got it — ' + item.title + '. That one goes in your journal.') : 'Got it!', 'cheer', 3.4);
      this.unlock('first_card');
      if (state.clues.length >= CLUES_REQUIRED) this.unlock('all_cards');
      renderObjectives();
    },

    onDoorOpen() {
      this.addXp(80);
      this.addCoins(10);
      robotSay('The lock let go! The exit is open — walk through it.', 'cheer', 4);
      renderObjectives();
    },

    onBayBonus() {
      this.addXp(150);
      this.addCoins(20);
      this.unlock('bay_clear');
      robotSay('Bay cleared! Bonus card is yours.', 'cheer', 3.6);
      renderObjectives();
    },

    onComplete() {
      const total = PROG.correct + PROG.wrong;
      if (total > 0 && PROG.wrong === 0) this.unlock('flawless');
      this.addXp(ROOM1_BONUS.xp);
      this.addCoins(ROOM1_BONUS.coins);
      this.unlock('escape');
      this.unlock('wing_unlock');
      if (PROG.level >= 5) this.unlock('level5');
      renderObjectives();
      saveLocal();
    },

    onBookOpen() {
      if (state.started) {
        if (claim('study_handbook')) this.addXp(20);
        this.unlock('scholar');
        if (Dialogue.open && Dialogue.current() && Dialogue.current().quiz) {
          renderLetterHintUI(Dialogue.current().quiz);
        }
      }
    },

    onVisit(roomId) {
      if (roomId === 'bay') robotSay('The Mock Call Bay. Practice booths — all optional.', 'idle', 3.6);
      else if (roomId === 'lab2') robotSay('QA & Escalation Wing. This is where the scored calls land.', 'idle', 4);
    },

    reset() {
      PROG.xp = STARTER_XP; PROG.level = 1; PROG.coins = 0;
      PROG.streak = 0; PROG.bestStreak = 0;
      PROG.correct = 0; PROG.wrong = 0;
      PROG.achievements = {};
      renderProgHud();
      renderObjectives();
      renderAchvStrip();
    },

    snapshot() {
      return {
        xp: PROG.xp, level: PROG.level, coins: PROG.coins,
        streak: PROG.streak, bestStreak: PROG.bestStreak,
        correct: PROG.correct, wrong: PROG.wrong,
        achievements: PROG.achievements
      };
    },

    restore(data) {
      if (!data || typeof data !== 'object') { this.reset(); return; }
      PROG.xp = clamp(Number(data.xp) || 0, 0, 999999);
      PROG.level = clamp(Number(data.level) || 1, 1, 99);
      PROG.coins = clamp(Number(data.coins) || 0, 0, 999999);
      PROG.streak = clamp(Number(data.streak) || 0, 0, 9999);
      PROG.bestStreak = clamp(Number(data.bestStreak) || 0, 0, 9999);
      PROG.correct = clamp(Number(data.correct) || 0, 0, 99999);
      PROG.wrong = clamp(Number(data.wrong) || 0, 0, 99999);
      PROG.achievements = (data.achievements && typeof data.achievements === 'object') ? data.achievements : {};
      renderProgHud();
      renderAchvStrip();
    },

    get: function () { return PROG; }
  };

  /** Flash the dialogue window gold (correct) or nudge it (wrong). */
  let pulseTimer = 0;
  function pulseDialogue(cls) {
    if (!el.dlgWindow) return;
    el.dlgWindow.classList.remove('is-correct', 'is-wrong');
    void el.dlgWindow.offsetWidth;
    el.dlgWindow.classList.add(cls);
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(function () {
      if (el.dlgWindow) el.dlgWindow.classList.remove('is-correct', 'is-wrong');
    }, 900);
  }

  /** A short, useful line for a wrong answer (never reveals the answer). */
  function hintLineFor(qid) {
    const q = Questions.get(qid);
    if (q && q.topic) {
      return 'Not yet — no progress lost. Check the handbook: ' + q.topic + '.';
    }
    return 'Not yet — no progress lost. Open the handbook and try again.';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     Robi — the companion robot
     ---------------------------------------------------------------------
     Robi trails the player along a breadcrumb path, hovers in place, blinks,
     waves hello, cheers a correct answer and slumps on a miss. All of it is
     drawn with the same fill() idiom as the rest of the pixel art.
     ══════════════════════════════════════════════════════════════════════════ */

  const ROBOT = {
    x: 0, y: 0, dir: 'down',
    animT: 0, hoverT: 0, moving: false,
    blink: 3.2, mood: 'idle', moodT: 0,
    wave: 0, sayLines: [], sayT: 0, sayDur: 0,
    trail: []
  };

  const robotVisual = { depth: 0, draw: null };

  const ROBOT_LINES = {
    start: [
      'Robi online! Walk with WASD and press E to inspect.',
      'I will tag along. Glowing things are always interesting.',
      'Tip: B opens the handbook any time.'
    ],
    cheer: [
      'Yes! That is the one.',
      'Clean answer. Keep going!',
      'Logged it. You are on fire.',
      'That is real CCS knowledge right there.'
    ],
    clue: [
      'Card secured. Check the journal with ◈.',
      'One more fact for exam day.'
    ],
    wrong: [
      'No progress lost — read the hint and retry.',
      'Close. The handbook has the exact wording.',
      'Misses are data. Try it again.'
    ],
    approach: [
      'Press E to inspect that.',
      'That one glows — it wants to be read.'
    ],
    door: [
      'The exit is open. Walk straight through!'
    ]
  };

  function robotPickLine(group) {
    const list = ROBOT_LINES[group];
    if (!list || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  function robotSetMood(mood, seconds) {
    ROBOT.mood = mood || 'idle';
    ROBOT.moodT = seconds == null ? 0 : seconds;
    if (mood === 'cheer' || mood === 'wave') ROBOT.wave = 1;
  }

  /** Speak a line in a pixel speech bubble above Robi. */
  function robotSay(text, mood, seconds) {
    if (!text) return;
    ROBOT.sayLines = wrapBubble(text);
    ROBOT.sayT = ROBOT.sayDur = seconds || 3.4;
    if (mood) robotSetMood(mood, seconds || 3.4);
  }

  function wrapBubble(text, maxChars) {
    const limit = maxChars || 24;
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const next = line ? line + ' ' + words[i] : words[i];
      if (next.length > limit && line) { lines.push(line); line = words[i]; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  /** True when a 11×16 robot box at (x, feet y) does not clip a solid. */
  function robotSpotFree(x, y) {
    const rw = 5, rh = 15;
    const box = { x: x - rw, y: y - rh, w: rw * 2, h: rh };
    for (let i = 0; i < solidRects.length; i++) {
      const s = solidRects[i];
      if (!s) continue;
      if (s.seeThrough) continue;              // glass partitions let Robi pass
      if (box.x + box.w > s.x && box.x < s.x + s.w &&
          box.y + box.h > s.y && box.y < s.y + s.h) return false;
    }
    return true;
  }

  /** Drop Robi right next to the player (room changes, respawns). */
  function robotSnapToPlayer() {
    ROBOT.trail.length = 0;
    ROBOT.trail.push({ x: player.x, y: player.y });
    const face = DIR[player.dir] || DIR.up;
    ROBOT.x = player.x - face.x * 23;
    ROBOT.y = player.y - face.y * 19;
    if (!robotSpotFree(ROBOT.x, ROBOT.y)) ROBOT.x = player.x + 13;
    if (!robotSpotFree(ROBOT.x, ROBOT.y)) { ROBOT.x = player.x; ROBOT.y = player.y + 4; }
    ROBOT.moving = false;
  }

  /** Nudge Robi toward the player after a celebration so it stays in frame. */
  function moveRobotNear(px) {
    ROBOT.trail.length = 0;
    const d = Math.hypot(ROBOT.x - player.x, ROBOT.y - player.y);
    if (d > 48) robotSnapToPlayer();
  }

  /* Candidate resting spots around the player: behind the shoulder first, then
     the remaining sides, so a desk between the two never traps Robi. */
  function robotCandidates(face) {
    const bx = player.x - face.x * 23, by = player.y - face.y * 19;
    const sx = face.y !== 0 ? 7 : 0;       // small sideways lean when facing up/down
    const out = [
      { x: bx + sx, y: by },
      { x: bx - sx, y: by },
      { x: player.x - 24, y: player.y },
      { x: player.x + 24, y: player.y },
      { x: player.x, y: player.y + 22 },
      { x: player.x, y: player.y - 22 }
    ];
    return out;
  }

  function robotPickTarget(face) {
    const c = robotCandidates(face);
    /* the first reachable candidate wins; if all are blocked, hover in place */
    for (let i = 0; i < c.length; i++) {
      if (robotSpotFree(c[i].x, c[i].y)) return c[i];
    }
    return { x: player.x, y: player.y + 22 };
  }


  function robotUpdate(dt) {
    ROBOT.hoverT += dt;
    ROBOT.animT += dt;

    /* blinking: every 2.4 – 4.6 s, with a short closed-eye window */
    ROBOT.blink -= dt;
    if (ROBOT.blink <= -0.15) ROBOT.blink = 2.4 + Math.random() * 2.2;

    /* mood decay back to idle */
    if (ROBOT.moodT > 0) {
      ROBOT.moodT -= dt;
      if (ROBOT.moodT <= 0) { ROBOT.mood = 'idle'; ROBOT.wave = 0; }
    }

    if (ROBOT.sayT > 0) ROBOT.sayT = Math.max(0, ROBOT.sayT - dt);

    if (!state.started || state.paused || roundOver() || player.seated) {
      ROBOT.moving = false;
      return;
    }

    /* hover just behind the player's shoulder, opposite the facing direction */
    const face = DIR[player.dir] || DIR.up;
    const spot = robotPickTarget(face);
    const tx = spot.x, ty = spot.y;

    const dx = tx - ROBOT.x;
    const dy = ty - ROBOT.y;
    const dist = Math.hypot(dx, dy);

    /* room change / respawn: jump to the player instead of walking the map */
    if (dist > 200) { robotSnapToPlayer(); return; }

    const speed = dist > 70 ? 156 : 104;
    ROBOT.moving = dist > 2.5;
    if (!ROBOT.moving) return;

    const step = Math.min(dist, speed * dt);
    const nx = ROBOT.x + (dx / dist) * step;
    const ny = ROBOT.y + (dy / dist) * step;

    if (Math.abs(dx) > Math.abs(dy)) ROBOT.dir = dx < 0 ? 'left' : 'right';
    else ROBOT.dir = dy < 0 ? 'up' : 'down';

    /* axis-separated so Robi never slides through a desk */
    if (robotSpotFree(nx, ROBOT.y)) ROBOT.x = nx;
    else if (robotSpotFree(ROBOT.x, ny)) ROBOT.y = ny;
    if (robotSpotFree(ROBOT.x, ny)) ROBOT.y = ny;
  }

  /* ---------- drawing Robi ------------------------------------------------ */
  function drawRobot(g) {
    const x = Math.round(ROBOT.x);
    const y = Math.round(ROBOT.y);
    const cheer = ROBOT.mood === 'cheer';
    const sad = ROBOT.mood === 'sad';
    const hover = Math.sin(ROBOT.hoverT * 2.3) * 1.4;
    const bob = ROBOT.moving && (Math.floor(ROBOT.animT * 10) % 2) ? -1 : 0;
    const top = Math.round(y - 20 + hover + bob);
    const left = x - 8;

    const P = function (dx, dy, w, h, color) {
      g.fillStyle = color;
      g.fillRect(left + dx, top + dy, w, h);
    };

    /* 1px dark silhouette first: keeps the bot readable on the tiled floor */
    P(1, 1, 14, 8, '#16323f');
    P(2, 8, 12, 9, '#16323f');
    P(1, 16, 14, 4, '#16323f');

    /* thruster glow + ground shadow */
    glow(g, x, y - 2, 14, '116,230,214', 0.16);
    g.fillStyle = 'rgba(8,5,14,0.30)';
    g.fillRect(x - 6, y - 3, 12, 3);
    g.fillRect(x - 4, y - 4, 8, 1);

    const shell = '#9fe3f0';
    const shellDark = '#4f9db2';
    const shellLite = '#d6f7fd';
    const metal = '#2b3550';
    const metalLite = '#465272';
    const gold = '#f7c85a';

    /* hover treads */
    P(2, 16, 12, 3, metal);
    P(3, 16, 2, 3, metalLite);
    P(9, 16, 2, 3, metalLite);
    P(7, 17, 2, 1, gold);

    /* body */
    P(3, 9, 10, 7, shell);
    P(3, 9, 10, 1, shellLite);
    P(3, 15, 10, 1, shellDark);
    P(4, 11, 8, 3, '#12203a');                       // chest panel
    const pulse = (Math.sin(ROBOT.hoverT * 4) > 0) ? gold : '#b9832a';
    P(6, 12, 4, 1, pulse);
    P(5, 14, 6, 1, shellDark);

    /* head */
    P(2, 2, 12, 7, shell);
    P(2, 2, 12, 1, shellLite);
    P(2, 8, 12, 1, shellDark);
    P(3, 4, 10, 4, '#12203a');                       // visor
    P(3, 4, 10, 1, '#1c3157');

    /* eyes: blink, look sad, or shine */
    const blinking = ROBOT.blink <= 0;
    if (sad) {
      P(5, 7, 2, 1, '#79c7e3');
      P(9, 7, 2, 1, '#79c7e3');
      P(4, 3, 8, 1, '#5c7fa8');
    } else if (blinking) {
      P(5, 6, 2, 1, '#2f4d6b');
      P(9, 6, 2, 1, '#2f4d6b');
    } else if (cheer) {
      P(5, 5, 2, 2, '#c8fbff');
      P(9, 5, 2, 2, '#c8fbff');
      P(5, 7, 2, 1, '#8ef7ff');
      P(9, 7, 2, 1, '#8ef7ff');
    } else {
      P(5, 5, 2, 2, '#8ef7ff');
      P(9, 5, 2, 2, '#8ef7ff');
    }

    /* smiling mouth line */
    if (cheer || ROBOT.mood === 'wave') { P(7, 8, 3, 1, '#0e1a2c'); P(6, 7, 1, 1, '#0e1a2c'); P(11, 7, 1, 1, '#0e1a2c'); }

    /* antenna with a blinking bulb */
    P(7, 0, 2, 2, metalLite);
    const bulb = (Math.sin(ROBOT.hoverT * 5) > -0.2) ? gold : '#8a5f18';
    P(7, -2, 2, 2, bulb);
    glow(g, x, top - 1, 7, '247,200,90', 0.28);

    /* arms — pose depends on mood */
    const swing = ROBOT.moving ? (Math.floor(ROBOT.animT * 10) % 2) : 0;
    if (cheer) {
      P(-1, 4, 3, 2, shell); P(-1, 2, 2, 2, shellLite);      // left arm up
      P(14, 4, 3, 2, shell); P(14, 2, 2, 2, shellLite);      // right arm up
      glow(g, x - 10, top + 3, 8, '255,233,138', 0.35);
      glow(g, x + 10, top + 3, 8, '255,233,138', 0.35);
    } else if (ROBOT.mood === 'wave' || ROBOT.wave > 0) {
      P(-1, 10 + swing, 3, 4, shell);
      P(14, 4, 3, 2, shell);
      P(14, 1, 2, 4, shellLite);                             // waving hand
      P(15, 0, 2, 2, '#e8fbff');
    } else if (sad) {
      P(-1, 11, 3, 5, shell); P(14, 11, 3, 5, shell);
      P(-1, 16, 3, 1, shellDark); P(14, 16, 3, 1, shellDark);
    } else {
      P(-1, 10 + (swing ? 1 : 0), 3, 4, shell);
      P(14, 10 + (swing ? 0 : 1), 3, 4, shell);
      P(0, 14, 2, 2, shellLite);
      P(15, 14, 2, 2, shellLite);
    }
  }

  /* ---------- Robi's speech bubble (drawn in CSS space on `vis`) ---------- */
  function drawRobotBubble(g) {
    if (ROBOT.sayT <= 0 || !ROBOT.sayLines.length) return;
    g.save();
    g.font = '600 12px "Segoe UI", "Trebuchet MS", system-ui, -apple-system, sans-serif';
    g.textBaseline = 'top';
    const lines = ROBOT.sayLines;
    const lh = 16, padX = 10, padY = 6;
    let wide = 0;
    for (let i = 0; i < lines.length; i++) wide = Math.max(wide, g.measureText(lines[i]).width);
    const bw = Math.round(wide) + padX * 2;
    const bh = lines.length * lh + padY * 2;
    const cssW = view.cssW || 800;
    const footWorldY = Math.min(ROBOT.y - 28, player.y - 46);
    const pt = worldToCss(ROBOT.x, footWorldY);
    const bx = Math.round(clamp(pt.x - bw / 2, 8, Math.max(8, cssW - bw - 8)));
    const by = Math.round(Math.max(52, pt.y - bh - 6));
    const fade = ROBOT.sayT < 0.35 ? ROBOT.sayT / 0.35 : 1;

    g.globalAlpha = fade;

    /* bubble body with a crisp dark outline + tail */
    g.fillStyle = 'rgba(5, 3, 12, 0.55)';
    g.fillRect(bx + 2, by + 2, bw, bh);
    g.fillStyle = '#141024';
    g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    g.fillStyle = '#f6efdc';
    g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#e2d5b4';
    g.fillRect(bx, by + bh - 1, bw, 1);

    const tailX = Math.round(clamp(pt.x - bx, 10, bw - 12));
    g.fillStyle = '#141024';
    g.fillRect(bx + tailX - 3, by + bh + 1, 7, 2);
    g.fillRect(bx + tailX - 2, by + bh + 3, 5, 2);
    g.fillStyle = '#f6efdc';
    g.fillRect(bx + tailX - 2, by + bh, 5, 2);

    g.fillStyle = '#1e1433';
    for (let i = 0; i < lines.length; i++) {
      g.fillText(lines[i], bx + padX, by + padY + i * lh);
    }
    g.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     FX — spark particles and ambient dust
     ══════════════════════════════════════════════════════════════════════════ */

  const FX = { parts: [], motes: [], moteSeed: -1, doorT: 0 };

  function fxBurst(wx, wy, rgb, count) {
    const n = count || 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const sp = 18 + Math.random() * 46;
      FX.parts.push({
        x: wx + (Math.random() - 0.5) * 6,
        y: wy + (Math.random() - 0.5) * 6,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 26,
        life: 0.5 + Math.random() * 0.5,
        max: 1,
        rgb: rgb || '247,200,90',
        size: Math.random() < 0.4 ? 2 : 1
      });
    }
    if (FX.parts.length > 220) FX.parts.splice(0, FX.parts.length - 220);
  }

  function updateFx(dt) {
    for (let i = FX.parts.length - 1; i >= 0; i--) {
      const p = FX.parts[i];
      p.life -= dt;
      if (p.life <= 0) { FX.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      p.vx *= (1 - dt * 1.6);
    }
    FX.doorT += dt;
  }

  function drawFx(g) {
    for (let i = 0; i < FX.parts.length; i++) {
      const p = FX.parts[i];
      g.fillStyle = 'rgba(' + p.rgb + ',' + Math.max(0, Math.min(1, p.life * 1.5)).toFixed(2) + ')';
      g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
  }

  /** Dust motes drifting through the room light. */
  function ensureMotes() {
    if (FX.moteSeed === room.id && FX.motes.length) return;
    FX.moteSeed = room.id;
    FX.motes.length = 0;
    const w = room.cols * TILE, h = room.rows * TILE;
    const n = 26;
    for (let i = 0; i < n; i++) {
      FX.motes.push({
        x: hash2(i + 1, 7) * w,
        y: hash2(i + 3, 11) * h,
        sp: 3 + hash2(i + 5, 13) * 7,
        sway: hash2(i + 7, 17) * Math.PI * 2,
        amp: 4 + hash2(i + 9, 19) * 10,
        a: 0.08 + hash2(i + 11, 23) * 0.14,
        gold: hash2(i + 13, 29) > 0.55
      });
    }
  }

  function updateMotes(dt) {
    ensureMotes();
    const h = room.rows * TILE;
    for (let i = 0; i < FX.motes.length; i++) {
      const m = FX.motes[i];
      m.y -= m.sp * dt;
      m.sway += dt * 0.9;
      if (m.y < -6) m.y = h + 6;
    }
  }

  function drawMotes(g) {
    for (let i = 0; i < FX.motes.length; i++) {
      const m = FX.motes[i];
      const x = m.x + Math.sin(m.sway) * m.amp;
      if (x < cam.left - 8 || x > cam.left + view.offW + 8) continue;
      if (m.y < cam.top - 8 || m.y > cam.top + view.offH + 8) continue;
      g.fillStyle = (m.gold ? 'rgba(247,200,90,' : 'rgba(150,220,255,') + m.a.toFixed(2) + ')';
      g.fillRect(Math.round(x), Math.round(m.y), 1, 1);
    }
  }

  /** Pulsing gold brackets around the object you are standing next to. */
  function drawTargetHighlight(g) {
    if (!currentTarget || !currentTarget.rectPx) return;
    if (state.paused || Dialogue.open || roundOver()) return;
    const r = currentTarget.rectPx;
    const t = ROBOT.hoverT;
    const a = 0.32 + 0.28 * (0.5 + 0.5 * Math.sin(t * 4.2));
    const x = Math.round(r.x) - 3;
    const y = Math.round(r.y) - 3;
    const w = Math.round(r.w) + 6;
    const h = Math.round(r.h) + 6;
    const c = Math.min(7, Math.floor(w / 3), Math.floor(h / 3));
    g.save();
    g.globalAlpha = a;
    g.fillStyle = '#f7c85a';
    /* four corner brackets, pixel-stepped */
    g.fillRect(x, y, c, 1);            g.fillRect(x, y, 1, c);
    g.fillRect(x + w - c, y, c, 1);    g.fillRect(x + w - 1, y, 1, c);
    g.fillRect(x, y + h - 1, c, 1);    g.fillRect(x, y + h - c, 1, c);
    g.fillRect(x + w - c, y + h - 1, c, 1); g.fillRect(x + w - 1, y + h - c, 1, c);
    g.restore();
  }

  /** Warm light spilling out of the unlocked doorway. */
  function drawDoorLight(g) {
    if (!state.doorOpen || room.id !== 'lab') return;
    const door = room.objects.find(function (o) { return o.id === 'exitDoor'; });
    if (!door || !door.rectPx) return;
    const r = door.rectPx;
    const pulse = 0.5 + 0.5 * Math.sin(FX.doorT * 2.6);
    glow(g, r.x + r.w * 0.5, r.y + r.h * 0.55, 52 + pulse * 10, '247,200,90', 0.16 + pulse * 0.08);
  }

  /** Called from the loop: ambient + companion + particles + roaming students. */
  function updateWorldFx(dt) {
    updateFx(dt);
    updateMotes(dt);
    robotUpdate(dt);
    updateBots(dt);
  }

  /** Robi reacts when you first step up to a new object. */
  let lastApproachId = null;
  let lastApproachAt = 0;
  function maybeReactToApproach(target) {
    if (!target) { lastApproachId = null; return; }
    if (target.id === lastApproachId) return;
    lastApproachId = target.id;
    if (ROBOT.sayT > 0) return;                    // never talk over itself
    const now = Date.now();
    if (now - lastApproachAt < 7000) return;       // at most one hint every 7 s
    lastApproachAt = now;
    robotSay(robotPickLine('approach'), 'wave', 2.2);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     13. GAME LOOP & BOOT
     ══════════════════════════════════════════════════════════════════════════ */

  function loop(ts) {
    requestAnimationFrame(loop);
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (!isFinite(dt) || dt <= 0) dt = 0.016;
    dt = Math.min(dt, 0.05);

    /* While seated the agent's mind wanders: a new line every 9 seconds. */
    if (player.seated && state.started && !state.paused) {
      player.seatT += dt;
      if (player.seated.bot) {
        const bot = player.seated.bot;
        bot.thoughtT += dt;
        if (bot.thoughtT > 9 && !Dialogue.open) nextThought(bot, false);
      } else {
        player.selfT += dt;
        if (player.selfT > 9 && !Dialogue.open) {
          player.selfT = 0;
          player.selfThought = rollLine(player.selfThought, MY_DESK_LINES.length);
        }
      }
    }

    if (state.started && !state.paused) {
      if (!Dialogue.open && !Book.open) {
        updatePlayer(dt);
        state.elapsed += dt;
        checkExitTrigger();
        stepAccum += dt;
        if (stepAccum > 5) { stepAccum = 0; saveLocal(); }
      } else {
        player.moving = false;
      }
    }

    // door opening animation
    if (state.doorOpen) doorAnim = Math.min(1, doorAnim + dt * 1.8);
    else doorAnim = 0;

    updateWorldFx(dt);
    if (state.started && !state.paused && !roundOver() &&
        !Dialogue.open && !Book.open) {
      maybeReactToApproach(currentTarget);
    }

    updateCamera(dt, false);
    render();
    updatePromptUI();
  }

  /** First-run "Where are you playing?" gate. Returns true if it was shown. */
  function maybeAskDevice() {
    if (state.device) return false;
    el.menu.hidden = true;
    if (el.device) el.device.hidden = false;
    return true;
  }

  function chooseDevice(value) {
    state.device = value === 'phone' ? 'phone' : 'pc';
    saveSettings();
    applySettings();
    if (el.device) el.device.hidden = true;
    Sound.interact();
    showMenu();
    syncSettingUI();
    saveLocal();
  }

  function boot() {
    wireUI();
    Joystick.init();
    Book.init();

    enterRoom('lab');        // normalises the room, builds solids, pre-renders art
    loadSettings();          // preferences first, so the UI paints correctly
    applySettings();
    resize();

    renderClueChips();
    updateHud();
    updateMission();
    renderJournal();
    /* First launch: ask the player what they are holding before anything else.
       The menu waits behind the chooser, so no control hint is ever wrong. */
    if (!maybeAskDevice()) showMenu();
    render();

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 160); });
    window.addEventListener('beforeunload', function () { saveLocal(); saveSettings(); });

    requestAnimationFrame(loop);
  }

  /* A tiny public surface for debugging, automated tests and the future
     backend integration. It only exposes readings plus safe commands. */
  window.CallScape = {
    version: '2.1.0',
    getState: function () {
      return {
        roomId: state.roomId,
        started: state.started,
        paused: state.paused,
        completed: state.completed,
        doorOpen: state.doorOpen,
        bonus: !!state.bonus,
        room2Unlocked: !!state.room2Unlocked,
        afterWin: !!state.afterWin,
        room2Cleared: !!state.room2Cleared,
        relics: state.relics.slice(),
        clues: state.clues.slice(),
        solved: Object.assign({}, state.solved),
        attempts: JSON.parse(JSON.stringify(state.attempts)),
        letterHints: Object.assign({}, state.letterHints),
        roomCollapsed: !!(el.roomPanel && el.roomPanel.classList.contains('is-collapsed')),
        missionCollapsed: !!(el.missionPanel && el.missionPanel.classList.contains('is-collapsed')),
        elapsed: Math.round(state.elapsed),
        player: { x: Math.round(player.x), y: Math.round(player.y), dir: player.dir },
        seated: player.seated ? player.seated.id : null,
        agent: player.seated && player.seated.bot
          ? { name: player.seated.bot.name, thought: BOT_LINES[player.seated.bot.thought] || null }
          : player.seated ? { name: null, own: true, thought: MY_DESK_LINES[player.selfThought] || null }
          : null,
        settings: {
          sound: state.sound, hints: state.hints, promptOn: state.promptOn,
          joystickSide: state.joystickSide, textSize: state.textSize,
          device: state.device
        },
        touchUI: IS_TOUCH,
        save: !!loadLocal(),
        bookOpen: Book.open,
        bookChapter: Book.chapterId,
        prog: {
          xp: PROG.xp, level: PROG.level, coins: PROG.coins,
          streak: PROG.streak, bestStreak: PROG.bestStreak,
          correct: PROG.correct, wrong: PROG.wrong,
          achievements: Object.keys(PROG.achievements).filter(function (k) { return PROG.achievements[k]; })
        },
        robot: { x: Math.round(ROBOT.x), y: Math.round(ROBOT.y), mood: ROBOT.mood, saying: ROBOT.sayT > 0 }
      };
    },
    getTarget: function () { const t = nearestInteractable(); return t ? t.id : null; },
    view: view,
    camera: cam,
    teleport: function (tileX, tileY) {
      player.x = tileX * TILE; player.y = tileY * TILE;
      updateCamera(0, true);
    },
    interact: tryInteract,
    travelTo: travelTo,
    rooms: function () { return Object.keys(ROOMS); },
    bonus: function () { return state.bonus; },
    wing: function () {
      return {
        unlocked: !!state.room2Unlocked,
        afterWin: !!state.afterWin,
        cleared: !!state.room2Cleared,
        solved: wingSolvedCount(),
        questions: WING_QUESTIONS.slice(),
        relics: state.relics.slice(),
        relicIds: WING_RELICS.slice(),
        claimed: Object.keys(state.claimed)
      };
    },
    enterWing: function () { travelTo('lab2', DOOR_SPAWNS.lab2); },
    continueAfterWin: continueAfterWin,
    progression: function () { return Progression.snapshot(); },
    achievements: function () { return ACHIEVEMENTS.slice(); },
    award: function (xp, coins) { Progression.addXp(xp || 0); Progression.addCoins(coins || 0); },
    robot: function () { return { x: ROBOT.x, y: ROBOT.y, mood: ROBOT.mood, lines: ROBOT.sayLines.slice(), talk: ROBOT.sayT > 0 }; },
    robotSay: function (text, mood, secs) { robotSay(text, mood, secs); },
    bayQuestions: function () { return BAY_QUESTIONS.slice(); },
    setDevice: chooseDevice,
    sit: function () { const s = nearestSeat(); if (s) { sitDown(s); return s.id; } return null; },
    stand: function () { return standUp(); },
    askAgent: askBot,
    bots: function () {
      return room.objects.filter(o => o.bot).map(o => ({
        station: o.id, name: o.bot.name, seated: o.bot.seated,
        roaming: !!o.bot.roaming,
        x: Math.round(o.bot.x || 0), y: Math.round(o.bot.y || 0),
        thought: BOT_LINES[o.bot.thought] || null
      }));
    },
    stepBots: updateBots,
    advance: function () { Dialogue.advance(); },
    useLetterHint: function () { Dialogue.useLetterHint(); },
    toggleRoom: toggleRoomPanel,
    toggleMission: toggleMissionPanel,
    reset: resetGame,

    /* screens */
    resume: resumeSave,
    newGame: beginNewGame,
    menu: showMenu,
    pause: openPause,
    settings: function (open) { if (open === false) closeSettings(); else openSettings(true); },
    setSetting: setSetting,
    book: function (chapter) { Book.show(chapter || guessBookChapter()); },
    closeBook: function () { Book.close(); },

    /* save helpers */
    save: saveLocal,
    clearSave: clearLocal,
    readSave: loadLocal,
    describeSave: describeSave,
    backend: Backend
  };

  /* Boot once the DOM is ready. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
