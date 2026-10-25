/* ============================================================================
   CallScape — QUESTION BANK (teacher-editable data)
   Grade 11 Contact Center Services · Quarters 1–4
   ----------------------------------------------------------------------------
   SCOPE: the four quarterly topics of the CCS subject only.
     Q1  Operations, Tools & Industry Fundamentals
     Q2  Communication & Cultural Competency
     Q3  Inbound & Outbound Call Simulations
     Q4  Non-Voice & Digital Channel Support

   This file is intentionally SEPARATE from gameplay logic (script.js) so that
   teachers can review / replace the questions without touching the engine.

   THE BOOK AND THE TEST ARE THE SAME THING
   ----------------------------------------
   Every question below is answered in the in-game handbook (codebook.js).
   Each question carries `bookRef`, which points to the exact section the
   student should read, and each clue item in script.js restates the same
   fact. If you edit a question, edit the matching section too — the game
   shows the same `bookRef` label under every question.

   Two questions are asked at each of the four stations, so all four quarters
   are reviewed before the exit opens.

   To add or edit a question:
     1. Add an entry keyed by a unique id (e.g. "q_ups").
     2. Reference that id from a desk dialogue step in script.js:
            { text: '...', quiz: 'q_ups' }
     3. Reload the page. No build step required.

   Field reference
     topic       (string)   'Quarter 1' … 'Quarter 4' — shown as a badge
     bookRef     (string)   Section name in the handbook
     prompt      (string)   The question shown to the student.
     accepted    (string[]) Every string in this list counts as correct.
                             Matching is case-insensitive, ignores leading and
                             trailing spaces, collapses double spaces and drops
                             a trailing period / exclamation / question mark.
     hint        (string)   Nudge shown AFTER the second wrong attempt only.
                             Never shown before the student tries.
     success     (string)   Feedback shown after a correct answer.
     fail        (string)   Feedback after an incorrect answer.
                             Never contains the answer.
     placeholder (string)   Optional input placeholder.
     numeric     (boolean)  Optional: also accept the answer with "hours",
                             "hrs", "h" appended (used by the time-zone item).
   ========================================================================== */

window.CALLSCAPE_QUESTIONS = {

  /* ══════════════════ STATION 1 · Quarter 1 — Operations ══════════════════ */

  q_bpo: {
    topic: 'Quarter 1',
    bookRef: 'Q1 › What BPO is',
    prompt:
      'The orientation slide on the monitor has lost its first line:\n\n' +
      '  ______ is the practice of hiring an outside company to perform\n' +
      '  business processes that a company used to do in-house.\n\n' +
      'What does the abbreviation BPO stand for?',
    placeholder: 'Write the three words',
    accepted: [
      'business process outsourcing', 'business process out sourcing',
      'bpo', 'business processing outsourcing'
    ],
    hint: 'Three words: one about business, one about a process, and one meaning "hiring an outside provider".',
    success: 'Correct — BPO is Business Process Outsourcing: an outside provider performs the process.',
    fail: 'Not quite. It is a three-word phrase; the last word means giving the work to an outside provider.'
  },

  q_aht: {
    topic: 'Quarter 1',
    bookRef: 'Q1 › Jargons & metrics',
    prompt:
      'A team leader points at the floor board:\n\n' +
      '  "This number is our average total time per contact — talk time,\n' +
      '   hold time and after-call work combined."\n\n' +
      'Which metric is being described?',
    placeholder: 'Type the abbreviation or full name',
    accepted: [
      'aht', 'average handle time', 'average handling time',
      'aht (average handle time)', 'handle time', 'avg handle time'
    ],
    hint: 'Three letters on the board. It is the total time you handle one contact, not the time you spend talking.',
    success: 'Correct — AHT (Average Handle Time) = (talk + hold + ACW) ÷ calls handled.',
    fail: 'Not that one. Think of the metric whose formula adds talk time, hold time and after-call work.'
  },

  /* ═══════════════ STATION 2 · Quarter 2 — Communication ═════════════════ */

  q_pitch: {
    topic: 'Quarter 2',
    bookRef: 'Q2 › Paralanguage & voice',
    prompt:
      'The coaching sheet lists five voice controls: pitch, projection, pacing, ' +
      'tone and articulation.\n\n' +
      'Which one describes how HIGH or LOW the voice is?',
    placeholder: 'Type one word',
    accepted: ['pitch', 'the pitch', 'voice pitch', 'pitch of the voice'],
    hint: 'It is a four-letter word, and a musical note can be described with it too.',
    success: 'Correct — pitch is how high or low the voice sits. Projection is volume; pacing is speed.',
    fail: 'Not that one. Projection is volume and pacing is speed, so which control is about high and low?'
  },

  q_timezone: {
    topic: 'Quarter 2',
    bookRef: 'Q2 › Cultural variables & geography',
    prompt:
      'Manila is UTC+8 and New York is UTC−5.\n\n' +
      'How many hours BEHIND Manila is New York?',
    placeholder: 'Type a number',
    numeric: true,
    accepted: ['13', 'thirteen', '13 hours', '13 hrs', 'thirteen hours'],
    hint: 'Count the gap between +8 and −5: eight steps back to zero, then five more.',
    success: 'Correct — New York is 13 hours behind Manila, so 9:00 AM Monday in Manila is 8:00 PM Sunday in New York.',
    fail: 'Not yet. Add the distance from UTC+8 down to UTC+0 and then down to UTC−5.'
  },

  /* ════════════════ STATION 3 · Quarter 3 — Call skills ══════════════════ */

  q_open: {
    topic: 'Quarter 3',
    bookRef: 'Q3 › Probing & questioning',
    prompt:
      'The call-model card reads:\n\n' +
      '  "Ask ______ questions first to widen the conversation, then closed\n' +
      '   questions to confirm the facts."\n\n' +
      'Which type of question invites a full answer instead of a yes or no?',
    placeholder: 'Type one word',
    accepted: ['open', 'open question', 'open-ended', 'open ended', 'open-ended question', 'open ended question'],
    hint: 'They usually begin with who, what, when, where, why or how — the opposite of a yes/no question.',
    success: 'Correct — an open question invites a full answer; a closed question gives yes/no or one fact.',
    fail: 'Not that one. Think of the question type that is the opposite of closed.'
  },

  q_deescalate: {
    topic: 'Quarter 3',
    bookRef: 'Q3 › Complaint handling',
    prompt:
      'A customer is shouting about a double charge. The five-step model is:\n\n' +
      '  1 ?  2 Empathize and apologize  3 Clarify  4 Act  5 Confirm\n\n' +
      'What is step 1?',
    placeholder: 'Type one verb',
    accepted: ['listen', 'listening', 'listen actively', 'active listening', 'listen first'],
    hint: 'It is what you do with your ears before you say anything — let them finish without interrupting.',
    success: 'Correct — step 1 is to listen and let the customer finish before you clarify and act.',
    fail: 'Not quite. It happens before you apologize or ask any question.'
  },

  /* ════════════════ STATION 4 · Quarter 4 — Non-voice ═══════════════════ */

  q_subject: {
    topic: 'Quarter 4',
    bookRef: 'Q4 › Email support etiquette',
    prompt:
      'An email is waiting in the outbox and the header field is blank:\n\n' +
      '  ______: Refund status — Ticket #48213\n\n' +
      'Which field states the purpose of an email in a few words?',
    placeholder: 'Type one word',
    accepted: ['subject', 'subject line', 'the subject', 'the subject line', 'subject field'],
    hint: 'It is the line the customer sees in their inbox before they open the message.',
    success: 'Correct — the subject line states the purpose, and it should include the reference.',
    fail: 'Not that one. It is the line shown in the inbox list next to the sender\'s name.'
  },

  q_omni: {
    topic: 'Quarter 4',
    bookRef: 'Q4 › Omnichannel service delivery',
    prompt:
      'A customer chats, then calls, then emails — and never repeats the story,\n' +
      'because every channel sees the same account history.\n\n' +
      'What is this called?',
    placeholder: 'Type one word',
    accepted: ['omnichannel', 'omni-channel', 'omni channel', 'omnichannel service'],
    hint: 'It starts with "omni", meaning "all", and it is the opposite of multichannel silos.',
    success: 'Correct — omnichannel means phone, email, chat and social media share one customer context.',
    fail: 'Close in spirit, but not the word. Multichannel means separate records; this one means one shared view.'
  },

  /* ── Mock Call Bay practice questions (optional second room) ──────────────
     These six are asked by the booths and the QA board in the Mock Call Bay.
     They are extra practice: they do not gate the exit door, but solving all
     six awards the bay's bonus review card. */

  q_permission: {
    topic: 'Quarter 2',
    bookRef: 'Q2 › Telephone etiquette & call control',
    prompt:
      'You need two minutes to check the billing tool.\n\n' +
      'Before you place the caller on hold, you must ask for ______ .',
    placeholder: 'Type one word',
    accepted: ['permission', 'their permission', 'consent'],
    hint: 'It is the same word you ask for before doing anything the customer did not expect.',
    success: 'Correct — always ask permission, give a time estimate, then thank them for waiting.',
    fail: 'Not quite. You never leave a customer in silence — you ask for something first.'
  },

  q_signpost: {
    topic: 'Quarter 2',
    bookRef: 'Q2 › Telephone etiquette & call control',
    prompt:
      '"I will ask you two quick questions, then I will explain your options."\n\n' +
      'Telling the customer the steps ahead so they tolerate the wait is called\n' +
      '______ .',
    placeholder: 'Type one word',
    accepted: ['signposting', 'signpost', 'sign posting', 'sign-posting'],
    hint: 'It shares its name with the road signs that tell you what is coming.',
    success: 'Correct — signposting keeps the call moving without sounding rushed.',
    fail: 'Not that one. Think of the road signs that tell a driver what is coming up.'
  },

  q_ballpark: {
    topic: 'Quarter 2',
    bookRef: 'Q2 › Floor idioms',
    prompt:
      'A team leader asks for "a ______ figure" before the report is final.\n\n' +
      'Which floor idiom means a rough estimate?',
    placeholder: 'Type one word',
    accepted: ['ballpark', 'ballpark figure', 'ball park'],
    hint: 'It is borrowed from baseball — a stadium, a rough range.',
    success: 'Correct — a ballpark figure is a rough estimate, confirmed later in the CRM.',
    fail: 'Not that one. It comes from baseball and it means "roughly this much".'
  },

  q_escalate: {
    topic: 'Quarter 3',
    bookRef: 'Q3 › Escalation & handoffs',
    prompt:
      'The customer is asking for a refund that is above your approval limit.\n\n' +
      'What do you do with the contact?',
    placeholder: 'Type one word',
    accepted: ['escalate', 'escalation', 'escalate it', 'transfer'],
    hint: 'It means to pass it up the authority chain with a clean handoff note.',
    success: 'Correct — escalate above your limit rather than guess or promise.',
    fail: 'Not the word. You do not refuse it and you do not promise it — you pass it up.'
  },

  q_warm: {
    topic: 'Quarter 3',
    bookRef: 'Q3 › Escalation & handoffs',
    prompt:
      'You brief the next agent, explain the case, and introduce the customer\n' +
      'before the handover.\n\n' +
      'This is a ______ transfer.',
    placeholder: 'Type one word',
    accepted: ['warm', 'warm transfer', 'warm handoff'],
    hint: 'The opposite of pushing the call blindly is a temperature word.',
    success: 'Correct — a warm transfer protects CSAT; a cold one creates repeat calls.',
    fail: 'Not that one. It is the opposite of leaving the next agent cold.'
  },

  q_ftr: {
    topic: 'Quarter 4',
    bookRef: 'Q4 › Back-office quality standards',
    prompt:
      'In the back office there is no customer on the line, so accuracy is the\n' +
      'metric: the share of records completed with no correction needed.\n\n' +
      'What is this standard called?  (three words, hyphenated)',
    placeholder: 'Type the standard',
    accepted: ['first-time-right', 'first time right', 'first-time right', 'firsttimeright', 'ftr'],
    hint: 'You want it done correctly the first time, not fixed afterwards.',
    success: 'Correct — first-time-right beats fast-but-wrong every single batch.',
    fail: 'Close. It is three words joined by hyphens, about getting it correct immediately.'
  },

  /* ══════════════════════════════════════════════════════════════════════════
     ROOM 2 · QA & ESCALATION WING  (six questions)
     Unlocked only after the training floor is cleared. Every answer is stated
     in the handbook chapter "QA Wing" (codebook.js) with the identical wording,
     so the book, the review slips and the test stay in sync.
     ══════════════════════════════════════════════════════════════════════════ */

  q_scorecard: {
    topic: 'QA Wing',
    bookRef: 'QA Wing › The scorecard',
    prompt:
      'The QA analyst listens to a sample of your calls and marks each behaviour\n' +
      'against a written checklist — greeting, verification, hold, closing.\n\n' +
      'What is that scored checklist called?',
    placeholder: 'Type one word',
    accepted: ['scorecard', 'the scorecard', 'qa scorecard', 'score card'],
    hint: 'It is a card, and it carries the score.',
    success:
      'Correct — the QA scorecard is the scored checklist. Your QA score is the % of the\n' +
      'points you earned on it.',
    fail: 'Not quite. It is one word: the card that carries the QA score.'
  },

  q_fatal: {
    topic: 'QA Wing',
    bookRef: 'QA Wing › The scorecard',
    prompt:
      'Some scorecard misses are auto-fails: no verification, no data-privacy\n' +
      'protection, an unlogged promise. Losing the whole call over one behaviour\n' +
      'is called a ______ error.',
    placeholder: 'Type one word',
    accepted: ['fatal', 'a fatal', 'fatal error', 'zero tolerance'],
    hint: 'The word means it can kill the whole score in one hit.',
    success:
      'Correct — a fatal error zeroes the contact no matter how good the rest of the\n' +
      'call sounded.',
    fail: 'One word: the kind of mistake that wipes the whole score, not just a point.'
  },

  q_calibrate: {
    topic: 'QA Wing',
    bookRef: 'QA Wing › Calibration',
    prompt:
      'Two QA analysts score the same recorded call and compare their marks until\n' +
      'they agree on the standard.\n\n' +
      'What is this agreement session called?',
    placeholder: 'Type one word',
    accepted: ['calibration', 'a calibration', 'calibration session', 'calibrate'],
    hint: 'Instruments are tuned to each other the same way before measuring.',
    success:
      'Correct — calibration keeps scoring fair: same standard for every agent, every\n' +
      'shift.',
    fail: 'The word comes from tuning instruments so they read the same value.'
  },

  q_escalate_rule: {
    topic: 'QA Wing',
    bookRef: 'QA Wing › Escalation ladder',
    prompt:
      'The customer demands a refund your process cannot approve. The wing rule is:\n' +
      'do not guess — pass the case up the ladder with the notes attached.\n\n' +
      'What is that action called?',
    placeholder: 'Type one word',
    accepted: ['escalate', 'escalation', 'escalate it', 'escalate the case'],
    hint: 'It shares its root with "escalator" — you move it up a level.',
    success:
      'Correct — escalate with the notes, the customer\'s words and what you already tried.',
    fail: 'It is the ladder word: you move the case up a level instead of inventing an answer.'
  },

  q_dsar: {
    topic: 'QA Wing',
    bookRef: 'QA Wing › Data privacy in the wing',
    prompt:
      'A caller asks for a copy of every record the company holds about them.\n' +
      'Under RA 10173 (the Data Privacy Act) that request has a name: a data\n' +
      'subject ______ request.',
    placeholder: 'Type one word',
    accepted: ['access', 'access request', 'dsar'],
    hint: 'The right is the right to ______ your own data.',
    success:
      'Correct — a data subject access request goes to the privacy officer; you never\n' +
      'read account details aloud while verifying.',
    fail: 'The word is the right itself: the customer can ______ the data you hold on them.'
  },

  q_nesting: {
    topic: 'QA Wing',
    bookRef: 'QA Wing › Nesting bay',
    prompt:
      'The training floor is done. New agents still take their first live contacts\n' +
      'with a coach beside them before going fully solo.\n\n' +
      'What is that supervised stage called?',
    placeholder: 'Type one word',
    accepted: ['nesting', 'nesting bay', 'nesting stage'],
    hint: 'Birds raise their young in it before they fly.',
    success:
      'Correct — nesting is the supervised stage; ask everything then, because the coach\n' +
      'is paid to answer.',
    fail: 'It is the bird word: the supervised stage before you fly solo.'
  }

};
