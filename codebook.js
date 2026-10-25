/* ============================================================================
   CallScape — CCS HANDBOOK (content data)
   Grade 11 Contact Center Services · Quarters 1–4
   ----------------------------------------------------------------------------
   This is the in-game textbook ("the book" on the laboratory shelf). It is
   plain data: no logic lives here, so a teacher can edit the lesson text
   without touching the game engine.

   THE BOOK AND THE TEST ARE THE SAME THING
   ----------------------------------------
   Every question in questions.js has a matching section here, and that section
   carries an `answer` callout stating the exact fact the test asks for. Where
   it does, the section shows  ★ REVIEW ANSWER  and the same wording appears in
   the clue item for that puzzle. A student who reads the book and a student
   who takes the test are looking at the same statements.

   Section shape:
     heading : string   Section title
     body    : string   Lesson text (supports **bold**, *highlight*, `term`)
     sample  : object   Optional monospace block: { kind, src }
                        kind = 'phone' | 'email' | 'chat' | 'formula' | 'text'
     answer  : string   Optional ★ REVIEW ANSWER line (matches the test)
     notes   : string[] Optional bullet list ("remember this" points)

   Chapters are the tabs in the handbook panel. Add one by adding an object to
   the `chapters` array below.
   ========================================================================== */

window.CALLSCAPE_BOOK = {
  title: 'CCS Operations Manual',
  subtitle: 'Grade 11 Contact Center Services · Quarter 1 to Quarter 4',
  edition: 'Training laboratory copy · Emilio Jacinto NHS',

  chapters: [
    /* ══════════════════════════════════════════════════════════════════════
       QUARTER 1
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'q1',
      tab: 'Q1 · Operations',
      title: 'Quarter 1 — Operations, Tools & Industry Fundamentals',
      blurb: 'Before you take a single call you need the industry picture, the entrepreneur mindset, the vocabulary of the floor, and the technology you will be sitting in front of.',
      sections: [
        {
          heading: '1.1 What BPO is',
          body:
            '**Business Process Outsourcing (BPO)** is the practice of hiring an outside company to ' +
            'perform business processes that another company used to do in-house. A bank in the ' +
            'United States can outsource its customer calls, its billing, or its data entry to a ' +
            'provider — often in the Philippines.\n\n' +
            'The work is usually split into **front office** (customer-facing: calls, chat, email) ' +
            'and **back office** (behind the scenes: data entry, payroll, research). It is also ' +
            'split into **voice** accounts (phone support) and **non-voice** accounts (email, chat, ' +
            'back office). A **contact center** is the part of the BPO industry that handles ' +
            'customer contacts — voice and non-voice.',
          notes: [
            'Outsourcing = another company does it. Offshoring = it is done in another country.',
            'Contact center = the customer-contact side of BPO.',
            'Grade 11 CCS trains you for entry-level agent and support roles.'
          ]
        },
        {
          heading: '1.2 How the Philippine BPO industry grew',
          body:
            'The industry began in the **early 1990s**, when a few multinational companies set up ' +
            'shared-service centers in Metro Manila and Laguna. It grew quickly in the **2000s** ' +
            'as American and Australian companies outsourced customer service and back-office work ' +
            'to the Philippines. Government support — especially economic zones administered by ' +
            '**PEZA** (Philippine Economic Zone Authority) — helped build the offices, and the ' +
            'private-sector association **IBPAP** (IT and Business Process Association of the ' +
            'Philippines) promoted the country abroad.\n\n' +
            'Why the Philippines? **English proficiency**, a **neutral accent** that North ' +
            'Americans find easy to understand, a **young and trainable workforce**, lower operating ' +
            'costs than the United States, **time-zone alignment** with North America for night ' +
            'shifts, and strong **government and local-government support**.',
          notes: [
            'Started: early 1990s. Rapid growth: 2000s.',
            'Key agencies: PEZA (economic zones) and IBPAP (industry association).',
            'The Philippines is best known for voice/customer-service work.'
          ]
        },
        {
          heading: '1.3 The economic role',
          body:
            'IT-BPM (Information Technology and Business Process Management) is one of the ' +
            'Philippines\' largest private employers, with **well over a million direct jobs** and ' +
            'millions more indirect jobs in food, transport, real estate and retail. It is one of ' +
            'the country\'s **top export earners**, bringing in foreign currency the way OFW ' +
            'remittances do. It also **spreads employment beyond Metro Manila** — Cebu, Davao, ' +
            'Bacolod, Iloilo, Clark and Baguio all host delivery sites.\n\n' +
            'For a Grade 11 student this means a **legally paid, English-using, skill-based career ' +
            'path** that does not require going abroad.',
          notes: [
            'Direct jobs: over one million. Plus indirect jobs nearby.',
            'Foreign-exchange earner — comparable in importance to OFW remittances.',
            'Jobs exist in provincial cities, not only in Metro Manila.'
          ]
        },
        {
          heading: '1.4 Who works on the floor',
          body:
            'A delivery site is organised in layers. **Agents** (also called customer service ' +
            'associates or CSRs) take contacts. **Team leaders** coach a team of 12–20 agents and ' +
            'handle escalations. **Quality analysts (QA)** score samples of calls against a ' +
            'scorecard. **Workforce management (WFM)** forecasts volume and builds schedules so ' +
            'enough agents are on the floor. **Trainers** run product and communication training. ' +
            '**Operations managers** own the account\'s targets. Support roles include **IT**, ' +
            '**security**, **facilities** and **HR**.\n\n' +
            'Shifts run around the clock — **night shifts** are common because a Philippine night ' +
            'matches a North American business day. A typical shift includes breaks, coaching ' +
            'sessions and a **team huddle** with the day\'s performance numbers.',
          notes: [
            'Agent → Team Leader → QA / WFM / Trainer → Operations Manager.',
            'Night work exists because of the time-zone difference.',
            'Attrition (agents leaving) is a constant industry concern.'
          ]
        },
        {
          heading: '1.5 Personal Entrepreneurial Competencies (PECs)',
          body:
            'PECs are the personal traits that entrepreneurs — and successful employees — practise. ' +
            'The DepEd list has **ten**:\n\n' +
            '**1 Opportunity seeking** — spotting a need that could be served.\n' +
            '**2 Persistence** — continuing after a setback.\n' +
            '**3 Commitment to the work contract** — delivering what you promised, on time.\n' +
            '**4 Demand for quality and efficiency** — doing it well *and* fast.\n' +
            '**5 Risk taking** — accepting sensible, calculated risks.\n' +
            '**6 Goal setting** — deciding a specific target and a date.\n' +
            '**7 Information seeking** — asking, researching, checking.\n' +
            '**8 Systematic planning and monitoring** — planning step by step, then tracking it.\n' +
            '**9 Persuasion and networking** — convincing others and building connections.\n' +
            '**10 Self-confidence** — trusting your own judgement.',
          notes: [
            'Clustered as achievement (1–6), planning (7–8) and people (9–10).',
            'PECs are demonstrated by behaviour, not by a personality label.',
            'Interview answers usually ask you to prove a PEC with a real example.'
          ]
        },
        {
          heading: '1.6 Strengths and market analysis for career readiness',
          body:
            'Before you interview you need to know yourself and the market. A simple **SWOT** ' +
            'analysis lists your **Strengths** (English, patience, speed, technical skill), your ' +
            '**Weaknesses** (typing speed, night-shift stamina, nervousness), the **Opportunities** ' +
            'around you (hiring sites, scholarships, government training) and the **Threats** ' +
            '(automation, competition, shifting demand).\n\n' +
            '**Market analysis** means looking at what employers actually ask for: communication ' +
            'skills, typing speed and accuracy, willingness to work nights, computer literacy, and ' +
            'a clear speaking voice. Build your **career ladder**: agent → subject-matter expert → ' +
            'QA, trainer, WFM, or team leader.',
          notes: [
            'SWOT = Strengths, Weaknesses, Opportunities, Threats.',
            'Employers test your typing speed and speaking before hiring.',
            'Every role you take is evidence for the next one.'
          ]
        },
        {
          heading: '1.7 Jargons and metrics — the language of the floor',
          body:
            'The floor runs on numbers and shorthand. Learn these first:\n\n' +
            '**AHT (Average Handle Time)** — the average total time an agent spends on one ' +
            'contact, including talk time, hold time and after-call work. Formula: ' +
            '`AHT = (talk + hold + ACW) ÷ calls handled`.\n' +
            '**CSAT (Customer Satisfaction Score)** — the percentage of customers who said they ' +
            'were satisfied. ' +
            '`CSAT = (satisfied responses ÷ total responses) × 100`.\n' +
            '**FCR (First Contact Resolution)** — the percentage of contacts resolved on the ' +
            'first try, with no callback needed.\n' +
            '**AUX (Auxiliary work)** — the state an agent selects for work that is not a live ' +
            'contact: meetings, coaching, paperwork, system issues.\n' +
            '**Bio break** — a short personal/restroom break. **Lunch** and **break** are separate ' +
            'scheduled states; picking AUX for a break breaks your **adherence**.\n\n' +
            'Related numbers: **ACW** (after-call work — the wrapping-up time after the caller ' +
            'hangs up), **shrinkage** (paid time not spent handling contacts), **adherence** ' +
            '(time spent exactly in the schedule), **occupancy** (how much of your time is spent ' +
            'on contacts), **QA score** (your quality scorecard), **NPS** (Net Promoter Score), ' +
            '**SLA** (Service Level Agreement — the target, e.g. 80% of calls answered within 20 ' +
            'seconds), **escalation** (passing a contact to a higher level) and **disposition** ' +
            '(the label you attach to a finished contact).',
          sample: {
            kind: 'formula',
            src:
`★ AHT  = (talk + hold + ACW) ÷ calls handled
★ CSAT = (satisfied responses ÷ total responses) × 100
★ FCR  = (contacts solved first time ÷ total contacts) × 100

EXAMPLE
  12 calls handled
  talk 260 min + hold 20 min + ACW 80 min = 360 min
  AHT = 360 ÷ 12 = 30 minutes (1800 seconds)

THE FLOOR SAYS ...
  "You're going to AUX"    → you are off the phone for a non-call task
  "Mind your adherence"    → take breaks exactly on the schedule
  "That call escalated"    → passed to a higher level`
          },
          notes: [
            'AHT = talk + hold + ACW (per call, averaged).',
            'CSAT = satisfied ÷ responses × 100.',
            'FCR = solved first contact ÷ total contacts × 100.',
            'AUX is for work tasks, not for breaks.'
          ]
        },
        {
          heading: '1.8 Technology and tools you will operate',
          body:
            '**CRM (Customer Relationship Management)** — the database of customer records, ' +
            'purchase history and previous contacts. You read it before you answer and you write ' +
            'to it when you finish. It is your memory.\n\n' +
            '**ACD (Automatic Call Distributor)** — routes each incoming call to the next ' +
            'available agent using rules such as skill, language or queue priority. It is the ' +
            'traffic enforcer of the phone system.\n\n' +
            '**IVR (Interactive Voice Response)** — the recorded menu ("Press 1 for billing, press ' +
            '2 for technical support"). It collects information and sends simple requests to the ' +
            'right place before a person answers.\n\n' +
            '**Headset** — the agent\'s microphone and earphone. A noise-cancelling microphone ' +
            'keeps background noise off the line; correct positioning keeps your voice clear.\n\n' +
            '**UPS (Uninterruptible Power Supply)** — a battery between the wall socket and your ' +
            'workstation. When power drops, the UPS keeps the PC and phone alive long enough to ' +
            'finish or save the contact. Losing power mid-call is a service failure.\n\n' +
            'Supporting tools: **softphone/dialer** (the phone inside the computer), **WFM ' +
            'scheduling software**, **knowledge base** (approved answers and procedures), **chat ' +
            'and email platforms**, **ticketing systems**, and **QA recording and screen capture**.',
          sample: {
            kind: 'text',
            src:
`A CALL'S JOURNEY
  Customer dials
      → IVR menu        "Press 1 for billing"
          → ACD queue   picks the next available agent
              → Agent's headset + softphone
                  → CRM opens the customer's record
                      → Agent resolves, logs the note, sets a disposition

IF THE POWER DROPS
  UPS keeps the PC and phone running → finish the call or save the note`
          },
          notes: [
            'CRM = memory. ACD = traffic enforcer. IVR = recorded menu. UPS = power backup.',
            'Headset hygiene and microphone position affect quality scores.',
            'Every contact ends with a disposition code and a CRM note.'
          ]
        },
        {
          heading: '1.9 Career paths and progression on the floor',
          body:
            'A contact center is one of the few places where a high-school graduate can be hired ' +
            'with no experience and still map a career on day one. The usual ladder:\n\n' +
            '**Agent (CSR / TSR)** → **Subject Matter Expert** → **Team Leader / Supervisor** → ' +
            '**Assistant Manager** → **Operations Manager**. Running beside that ladder are ' +
            '**support roles**: QA analyst, trainer, workforce (WFM) analyst, report analyst, ' +
            'recruiter, and IT support.\n\n' +
            'What gets you promoted is not only tenure. Team leaders watch three things: ' +
            '**consistency** (your numbers are steady, not lucky), **attendance and adherence**, ' +
            'and **coachability** — whether you apply the feedback from your QA session. ' +
            'Agents who document well and volunteer for difficult accounts move first.',
          sample: {
            kind: 'text',
            src:
`CAREER MAP
  Agent  ->  SME  ->  TL  ->  AM  ->  OM
     \        \        \       \
      QA analyst  trainer   WFM analyst   reports

WHAT THE TL IS LOOKING FOR
  steady metrics · perfect attendance · notes that other agents can read
  feedback applied in the next call · calm under pressure`
          },
          notes: [
            'Entry level: agent. Next step: SME (the person the floor asks when the answer is unclear).',
            'QA, training and workforce are parallel careers, not demotions.',
            'Documentation quality is the fastest visible way to stand out.'
          ]
        },
        {
          heading: '1.10 Data privacy and security on the floor',
          body:
            'You will handle names, addresses, birthdays, card numbers and account history. In the ' +
            'Philippines the governing law is **RA 10173, the Data Privacy Act of 2012**. It ' +
            'requires that personal data be collected for a stated purpose, kept accurate, ' +
            'protected, and used only for that purpose.\n\n' +
            'Day-to-day rules every agent signs:\n' +
            '**Verify before you share.** Ask the security questions before revealing any account ' +
            'detail — even if the caller sounds like the customer.\n' +
            '**Need to know.** Look at a record only if the contact requires it. Browsing a ' +
            'celebrity\'s or an ex\'s account is a terminable offence.\n' +
            '**Clean desk.** No sticky notes with passwords, no phone cameras over a screen.\n' +
            '**No card data on paper.** In card accounts, **PCI DSS** rules forbid writing the ' +
            'full number anywhere — CRM notes included.\n' +
            '**Report breaches at once.** A misdialled email or a lost laptop is a reportable ' +
            'incident, not an embarrassment to hide.\n' +
            '**Lock your station.** Windows-L or the lock shortcut every time you stand up.',
          sample: {
            kind: 'text',
            src:
`BEFORE YOU READ AN ACCOUNT ALOUD — VERIFY
  name  +  date of birth  +  last 4 digits        (2 out of 3 minimum)
  NEVER read: full card number · full address · password · PIN

IF YOU HEAR A CARD NUMBER
  stop the customer, tell them why, key it in the secure field only
  never repeat it, never type it into the notes`
          },
          notes: [
            'RA 10173 = Data Privacy Act of 2012. PCI DSS = card data rules.',
            'Verification happens before disclosure, every contact.',
            'Breaches are reported immediately; hiding one makes it worse.'
          ]
        },
        {
          heading: '1.11 Workforce basics: shrinkage, occupancy and adherence',
          body:
            'Workforce management (WFM) is the science of having the right number of agents on the ' +
            'phones at the right hour. Three numbers explain almost every staffing decision.\n\n' +
            '**Shrinkage** — the share of paid hours that are not on the phones: breaks, lunches, ' +
            'training, coaching, absence, attrition. A floor with 30% shrinkage needs many more ' +
            'people than its call volume suggests.\n\n' +
            '**Occupancy** — how much of your *available* time is spent handling contacts. Very low ' +
            'occupancy wastes money; very high occupancy (over roughly 85–90%) burns agents out.\n\n' +
            '**Adherence** — did you follow your scheduled break and login times? **Schedule ' +
            'compliance** is the softer measure of whether you worked the hours you were rostered.\n\n' +
            'This is why a bio break has a code and a time limit: the forecast already counted the ' +
            'minutes you were promised.',
          sample: {
            kind: 'formula',
            src:
`SHRINKAGE  = unproductive hours / total paid hours x 100
OCCUPANCY  = handling time / (handling + available) x 100
ADHERENCE  = minutes worked as scheduled / minutes scheduled x 100

EXAMPLE
  8-hour shift, 1-hour lunch, 2 x 15-min breaks  ->  7.5 productive hours
  If 45 min of that is coaching -> shrinkage for the shift = 45 / 480 = 9.4%`
          },
          notes: [
            'Shrinkage is planned absence from the queue; occupancy is how hard the queue presses.',
            'Adherence is measured in minutes, not intentions.',
            'AUX codes keep occupancy honest — use the correct one.'
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       QUARTER 2
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'q2',
      tab: 'Q2 · Communication',
      title: 'Quarter 2 — Communication & Cultural Competency',
      blurb: 'On the phone there is no body language to read, so your voice carries everything: the words you choose, how you say them, and how well you understand the person on the other end of the world.',
      sections: [
        {
          heading: '2.1 The communication process',
          body:
            'Communication is a **transaction**, not a broadcast. A **sender** encodes an idea ' +
            'into a **message** and sends it through a **channel** (voice, chat, email). A ' +
            '**receiver** decodes it and responds with **feedback**. **Noise** is anything that ' +
            'distorts the message — a bad line, background chatter, jargon, a strong accent, ' +
            'prejudice, or simply being tired.\n\n' +
            'On a call, the **channel is narrow**: only voice. That makes **feedback** essential. ' +
            'If you never check that the customer understood, you are guessing. Good agents confirm ' +
            'twice: once when they hear the problem, and once before they close.',
          sample: {
            kind: 'text',
            src:
`SENDER  → encodes → MESSAGE → CHANNEL → decodes →  RECEIVER
   ↑                                                   │
   └──────────────── FEEDBACK ←────────────────────────┘
                    (noise affects every step)

ON A CALL
  Sender:   the customer
  Channel:  voice only  →  no face, no gestures
  Noise:    line quality, background noise, jargon, accent, emotion
  Feedback: "So if I understand you correctly, ..."   ← confirm`
          },
          notes: [
            'Feedback is how you find out your message arrived.',
            'Noise is not only sound — emotion and jargon count as noise.',
            'Confirm understanding twice: open and close.'
          ]
        },
        {
          heading: '2.2 Active listening',
          body:
            '**Active listening** means listening to understand, not to reply. It has five ' +
            'behaviours:\n\n' +
            '**1 Attend** — stop typing, face the screen, remove distractions.\n' +
            '**2 Allow silence** — let the customer finish; do not talk over them.\n' +
            '**3 Reflect and paraphrase** — "So the charge appeared twice on the 14th, ' +
            'correct?"\n' +
            '**4 Clarify** — ask a question instead of assuming.\n' +
            '**5 Confirm** — repeat the agreed action and timeframe before you close.\n\n' +
            '**Barriers** to listening: preparing your answer while the customer is still ' +
            'talking, assuming you already know the case, judging the customer, fatigue on a night ' +
            'shift, and interrupting to control the call.',
          notes: [
            'Paraphrase, then clarify, then confirm — in that order.',
            'Silence is a tool: it lets angry customers run out of steam.',
            'Never assume the case; verify.'
          ]
        },
        {
          heading: '2.3 Verbal and non-verbal cues',
          body:
            '**Verbal cues** are the words themselves. **Non-verbal cues** are everything else. ' +
            'On the phone, non-verbal communication is carried by the **voice** (paralanguage) and ' +
            'by **silence**. Even your **posture and facial expression** matter, because they change ' +
            'your voice: agents are trained to **smile while speaking** — customers hear it.\n\n' +
            'In chat and email, the non-verbal side becomes **formatting and timing**: capital ' +
            'letters read as shouting, long silences read as neglect, and a fast reply reads as ' +
            'attention.',
          notes: [
            'Phone: voice + silence = your non-verbal cues.',
            'Smiling genuinely changes tone — it is audible.',
            'ALL CAPS in chat reads as shouting.'
          ]
        },
        {
          heading: '2.4 Paralanguage and voice control',
          body:
            '**Paralanguage** is *how* you say it. The five controls:\n\n' +
            '**Pitch** — how high or low the voice is. A very high pitch can sound anxious; a flat ' +
            'pitch sounds bored. **Projection (volume)** — enough energy to be heard without ' +
            'shouting. **Pacing** — speed. Too fast sounds rushed and is hard to follow; too slow ' +
            'wastes time. Slow down for numbers, names and instructions. **Tone** — the emotional ' +
            'colour: warm, calm, firm, apologetic. **Articulation** — crisp consonants and finished ' +
            'word endings, so "can\'t" never becomes "can".\n\n' +
            'Add **inflection** (varying pitch so you do not sound robotic), **pausing** (a beat ' +
            'before an important number) and **breathing** (breathe from the diaphragm so you do ' +
            'not run out of air mid-sentence).',
          sample: {
            kind: 'text',
            src:
`PITCH        high ↔ low        flat pitch = bored, very high = nervous
PROJECTION   volume             too soft = "please repeat", too loud = aggressive
PACING       words per minute   slow down for numbers, names, steps
TONE         emotional colour   warm, calm, firm, apologetic
ARTICULATION clarity            "can't" ≠ "can", finish word endings

DRILL: same sentence, four tones
  "I can help you with that."      calm / warm / firm / apologetic
  Record yourself, listen back, and mark which word you stressed.`
          },
          notes: [
            'Pitch = high/low. Projection = volume. Pacing = speed.',
            'Tone = emotional colour. Articulation = clarity.',
            'Slow down for numbers, names and instructions.'
          ]
        },
        {
          heading: '2.5 Accent neutralization and speech clarity',
          body:
            '**Accent neutralization** is not about erasing who you are or copying an American ' +
            'accent. It is about **comprehensibility**: removing sounds that make a word ' +
            'ambiguous for an international listener so the customer understands you on the first ' +
            'try.\n\n' +
            'Common Philippine-English drills: **vowel length** (ship/sheep, live/leave, full/fool); ' +
            '**consonants** that are often softened — **f** and **v** (fan/van, ferry/very), **th** ' +
            '(think, three, the), **p** vs **b**, **s** vs **z**; **consonant clusters** (asks, ' +
            'texts, strengths); **word stress** (PERmit as a noun, perMIT as a verb) and **sentence ' +
            'stress**; final consonants (don\'t drop the **t** in "just"); and correct **syllable ' +
            'count** in words like "comfortable" (COMF-ter-bul, three syllables).',
          sample: {
            kind: 'text',
            src:
`MINIMAL PAIRS — say each pair out loud, slowly, then at speed
  ship / sheep      live / leave      full / fool
  fan  / van        ferry / very      three / tree
  pat  / bat        sip / zip         ask  / asks

WORD STRESS
  PREsent (noun)   / preSENT (verb)
  REcord (noun)    / reCORD (verb)
  COMfortable → COMF-ter-bul  (3 syllables, not "com-for-ta-ble")

RULE OF THUMB
  Clarity first. Neutral is not "foreign"; neutral is "unmistakable".`
          },
          notes: [
            'Goal = understandable on the first try, not accent-free.',
            'Drill f/v, th, p/b, s/z and final consonants.',
            'Practise minimal pairs and word stress daily.'
          ]
        },
        {
          heading: '2.6 Cultural variables and geography',
          body:
            'Customers come from different cultures, and culture decides what feels polite. Learn ' +
            'these four variables: **direct vs indirect** (US customers usually state the problem ' +
            'plainly; some cultures hint at it), **formality** (titles, surnames, "please" and ' +
            '"thank you"), **time** (punctuality, holidays, weekends, daylight saving), and ' +
            '**context** (how much is left unsaid).\n\n' +
            '**Time zones.** Manila is **UTC+8**. New York is **UTC−5** (13 hours behind), Los ' +
            'Angeles **UTC−8**, London **UTC+0**, Sydney **UTC+10** in the northern winter — but ' +
            'daylight saving shifts several of these by an hour twice a year, so always check the ' +
            'live convertor before you quote a callback time. If it is 9:00 AM Monday in Manila, it ' +
            'is 8:00 PM Sunday in New York.\n\n' +
            '**Sensitivities.** Use the customer\'s language for dates and measurements ' +
            '("October 24" — never assume day/month order), avoid idioms that do not translate ' +
            '("cost an arm and a leg", "for the birds"), avoid slang, never joke about religion, ' +
            'politics or accents, and confirm names by **spelling them back**. Also remember ' +
            '**regional vocabulary**: US *gas*, UK *petrol*, Australia *servo*; US *apartment*, UK ' +
            '*flat*; US *cell phone*, UK *mobile*.',
          sample: {
            kind: 'formula',
            src:
`★ Manila = UTC+8.   New York = UTC−5.   →  New York is 13 hours BEHIND Manila.
★ 9:00 AM Monday, Manila  =  8:00 PM Sunday, New York

OTHER OFFSETS (before daylight saving)
  Los Angeles  UTC−8   → 16 hours behind
  London       UTC+0   →  8 hours behind
  Sydney       UTC+10  →  2 hours AHEAD

ALWAYS
  Check the live time convertor  ·  quote the customer's local time
  Spell names back               ·  avoid idioms and slang`
          },
          notes: [
            'Manila UTC+8 · New York UTC−5 · London UTC+0 · Sydney UTC+10.',
            'Daylight saving can move the difference by one hour.',
            'Always confirm a callback time in the customer\'s local clock.'
          ]
        },
        {
          heading: '2.7 Building rapport in the first thirty seconds',
          body:
            '**Rapport** is the customer\'s feeling that you are on their side. On the phone you build ' +
            'it with four small moves, all inside the first half minute.\n\n' +
            '**Greet with energy.** The first three words set the tone; a flat greeting sounds like a ' +
            'recording. **Use the name** once you have verified it, and use it sparingly — twice or ' +
            'three times across a call, not in every sentence. **Acknowledge the feeling** before the ' +
            'problem: "That sounds frustrating, especially after two failed deliveries." ' +
            '**Match the pace** — slow down for an upset or elderly customer, speed up for someone ' +
            'in a hurry.\n\n' +
            'Empathy statements work because they prove you listened; they must be followed ' +
            'immediately by action, or they sound scripted.',
          sample: {
            kind: 'phone',
            src:
`Customer: This is the third time I have called about this!
Agent:    Three calls is far too many, Mr. Santos — I would be frustrated too.
          [acknowledge] Let me open the last two notes and fix it from here.
          [action] May I confirm your account number so I am looking at the right record?`
          },
          notes: [
            'Acknowledge the feeling, then act — empathy without action sounds fake.',
            'Name: twice or three times per call, never every sentence.',
            'Match pace and volume to the customer, then lead them back to calm.'
          ]
        },
        {
          heading: '2.8 Telephone etiquette and call control',
          body:
            '**Telephone etiquette** is the set of habits that keep a call professional: answer ' +
            'within the service level (usually three rings), identify yourself and the company, ask ' +
            'permission before placing a caller on hold, thank them for waiting when you return, and ' +
            'ask "Is there anything else I can help you with?" before closing.\n\n' +
            '**Call control** is the skill of keeping the call moving without sounding rude. ' +
            'Techniques: **signposting** ("I will ask you two quick questions, then I will explain ' +
            'your options"), **redirecting** a talkative customer ("That is helpful — so that I can ' +
            'fix the charge, may I have the date?"), **hold etiquette** (ask, explain why, give a ' +
            'time, come back early), and the **wrap-up** (summarise the resolution, state the next ' +
            'step, give the reference number).\n\n' +
            'Silence is the enemy of the phone channel: if you need more than about ten seconds, ' +
            'tell the customer what you are doing.',
          sample: {
            kind: 'phone',
            src:
`HOLD — the polite way
  Agent: May I place you on a brief hold, about two minutes, while I check
         the billing tool?          [wait for yes]
  Agent: Thank you for waiting — I have the record in front of me.

CALL CONTROL
  signpost   "Two quick questions, then I will explain your options."
  redirect   "That is helpful. So I can fix the charge, what was the date?"
  wrap up    "So, to summarise: ... Your reference is ... Anything else?"`
          },
          notes: [
            'Never put a caller on hold without permission and a time estimate.',
            'Signpost the steps: customers tolerate waiting they understand.',
            'Close with a summary, a reference and an offer of further help.'
          ]
        },
        {
          heading: '2.9 Idioms you will hear on the floor',
          body:
            'The contact center runs on idioms. Learn them so a team leader\'s feedback does not ' +
            'sound like a code.\n\n' +
            '**Ballpark figure** — a rough estimate. **Touch base** — a short follow-up contact. ' +
            '**Keep me in the loop** — keep me updated. **Hit the ground running** — start ' +
            'productively with little training. **Learn the ropes** — learn how the job is done. ' +
            '**Cut to the chase** — get to the point. **On the same page** — in agreement. ' +
            '**The bottom line** — the essential fact. **In the loop / out of the loop** — informed ' +
            'or not. **Ahead of the curve** — more prepared than others. **Back to back** — one ' +
            'contact immediately after another. **Off the record** — not to be logged or quoted.\n\n' +
            'In a script for an international customer, avoid these. Idioms do not translate, and ' +
            'a customer in Ohio does not know what "just a sec, I will go and sort it out" implies.',
          sample: {
            kind: 'text',
            src:
`FLOOR IDIOMS                      SAFE FOR CUSTOMERS?
  ballpark figure                  NO  -> "a rough estimate"
  touch base                       NO  -> "a quick follow-up call"
  keep me in the loop              NO  -> "please keep me updated"
  cut to the chase                 NO  -> "to get to the point"
  back to back                     NO  -> "one call after another"
  on the same page                 NO  -> "we agree on that"

Use plain English on the line. Idioms are for the huddle, not the customer.`
          },
          notes: [
            'Idioms stay in the team huddle — plain English goes to the customer.',
            'If an idiom slips out, restate the plain meaning immediately.',
            'Learning the floor vocabulary is part of onboarding, not a luxury.'
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       QUARTER 3
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'q3',
      tab: 'Q3 · Calls',
      title: 'Quarter 3 — Inbound & Outbound Call Simulations',
      blurb: 'This is the floor itself: opening a call, finding the real problem, selling the benefit, calming an angry customer, and writing it all up properly afterwards.',
      sections: [
        {
          heading: '3.1 Call flow management',
          body:
            '**Inbound** means the customer called you. The standard flow has seven steps: ' +
            '**greet** (identify yourself and the company), **verify** the customer using the ' +
            'account\'s security questions, **probe** to find the real issue, **solve** it, ' +
            '**confirm** the customer agrees with the solution, **close** politely and offer ' +
            'further help, then **wrap up** (the note and the disposition code).\n\n' +
            '**Outbound** means the center called the customer — a sales call, a follow-up or a ' +
            'service reminder. Flow: **prepare** (read the record), **open** (introduce yourself ' +
            'and ask permission to talk), **state the purpose** briefly, **pitch and handle ' +
            'objections**, **close** with a clear next step, then **log** the call.\n\n' +
            '**Blended** means an agent or a site handles both at once; the system switches you ' +
            'between inbound and outbound demand.',
          sample: {
            kind: 'phone',
            src:
`INBOUND — 7 STEPS
  Agent:    Thank you for calling Northline Support, this is Ana. May I have
            your account number, please?
  [VERIFY]  Confirm name, birth date, and the last four digits on file.
  [PROBE]   Customer: My bill doubled this month.
  Agent:    I'm sorry about that. Can you tell me which charge looks wrong?
  [SOLVE]   Explain the fee, or reverse it if it is an error.
  [CONFIRM] "So I've reversed the duplicate charge. Anything else today?"
  [CLOSE]   "Thank you for calling, Ms. Cruz. Have a good evening."
  [WRAP]    Note + disposition: BILLING / DUPLICATE CHARGE / RESOLVED

OUTBOUND — 6 STEPS
  Prepare → Open with permission → Purpose → Pitch → Close → Log`
          },
          notes: [
            'Inbound = seven steps. Outbound = six steps.',
            'Verification happens before you discuss any account detail.',
            'Wrap-up is part of the call, not extra time you can skip.'
          ]
        },
        {
          heading: '3.2 Product knowledge and the USP',
          body:
            'You cannot help a customer with a product you do not understand. Know the ' +
            '**features** (what it is: 50 GB of storage), the **benefits** (what it does for the ' +
            'customer: you never run out of space during a project) and the **USP — Unique ' +
            'Selling Proposition**, the one thing that makes this product better than the ' +
            'alternative.\n\n' +
            'Turn features into benefits with **FAB**: **F**eature → **A**dvantage → ' +
            '**B**enefit. Customers buy the benefit. Keep the knowledge base open; never invent a ' +
            'policy, a price or a promise.',
          sample: {
            kind: 'text',
            src:
`FEATURE   "This plan includes 50 GB of backup."
ADVANTAGE "It backs up automatically every night."
BENEFIT   "So you never lose a thesis draft again — even if the laptop dies."

USP
  Every competitor has storage. Ours restores a file in one click,
  without calling support — that is our USP.

RULE
  If you do not know, check the knowledge base. Never guess a price.`
          },
          notes: [
            'Feature = what it is. Benefit = what it does for the customer.',
            'USP = the one thing that makes you choose it.',
            'FAB = Feature → Advantage → Benefit.'
          ]
        },
        {
          heading: '3.3 Probing and questioning techniques',
          body:
            '**Probing** is the questioning that finds the real problem — what the customer needs ' +
            'versus what they first said. Two tools:\n\n' +
            '**Open questions** begin with *who, what, when, where, why, how* or *tell me*. They ' +
            'invite a full answer: "What happens when you click Save?"\n' +
            '**Closed questions** can be answered with yes/no or one fact. They confirm and ' +
            'narrow: "Is the error on the card or on the phone?"\n\n' +
            'Use a **funnel**: open questions first to widen, closed questions later to confirm. ' +
            'Avoid **leading questions** that push an answer ("You didn\'t read the email, did ' +
            'you?") and avoid stacking questions — ask one at a time and let the customer finish.',
          sample: {
            kind: 'text',
            src:
`OPEN     "Tell me what you see on the screen right now."
OPEN     "What happened just before the app closed?"
CLOSED   "Did this start today or last week?"
CLOSED   "Is the bank card registered in your name?"

FUNNEL
  OPEN  widen  →  OPEN narrow  →  CLOSED confirm  →  SOLVE

AVOID
  "You didn't read the instructions, did you?"   (leading)
  "So where were you and what time was it and did you -"   (stacked)`
          },
          notes: [
            'Open = full answer (who/what/when/how). Closed = yes/no or one fact.',
            'Funnel: open to widen, closed to confirm.',
            'Never ask leading or stacked questions.'
          ]
        },
        {
          heading: '3.4 Complaint handling and de-escalation',
          body:
            'An angry customer is not attacking you — they are attacking a problem. Use the ' +
            'five-step model:\n\n' +
            '**1 Listen** — let them finish completely. Do not interrupt, do not defend yet. ' +
            '**2 Empathize and apologize** — "I understand why that is frustrating, and I\'m sorry ' +
            '"' + 'this happened." Apologize for the *experience*, without admitting legal fault.\n' +
            '**3 Clarify** — use probing questions to confirm the facts.\n' +
            '**4 Act** — state exactly what you can do, and do it.\n' +
            '**5 Confirm and follow up** — check the customer is satisfied, then log a follow-up ' +
            'task if anything is still pending.\n\n' +
            '**What to avoid:** "calm down", "that\'s our policy" as a full answer, blaming a ' +
            'department, arguing, sarcasm, sighs, and going silent for a long time. **Escalate** ' +
            'when the fix needs a higher authority, when the customer requests a supervisor, or ' +
            'when the contact becomes abusive — after one clear warning.',
          sample: {
            kind: 'phone',
            src:
`1 LISTEN     (let the customer finish — no interruptions)
2 EMPATHIZE  Agent: I understand why that is frustrating, and I'm sorry this
             happened. Let me take care of it.
3 CLARIFY    Agent: When did the duplicate charge first appear?
4 ACT        Agent: I've reversed the duplicate charge. It will post in 3–5
             banking days, and I'll message you the reference number.
5 CONFIRM    Agent: Is there anything else I can fix for you today?

NEVER SAY
  "Calm down."          "That's our policy." (alone)
  "That's not my job."  "You should have read the email."`
          },
          notes: [
            'Listen → Empathize/Apologize → Clarify → Act → Confirm.',
            'Apologize for the experience, not for legal fault.',
            '"Calm down" and "that\'s our policy" make it worse.',
            'Escalate on request, on authority, or on abuse after a warning.'
          ]
        },
        {
          heading: '3.5 After-sales support and documentation',
          body:
            'The call is not finished when the customer hangs up. **After-sales support** is the ' +
            'follow-through: confirming a fix worked, processing a replacement, tracking a refund, ' +
            'or calling back at the promised time.\n\n' +
            'Documentation is the proof. A good **CRM ticket note** answers four things: **who** ' +
            '(customer and account), **what** (the issue and what you did), **what is pending** ' +
            '(the next action and its owner) and **when** (dates, timeframes, the callback time in ' +
            'the customer\'s local clock). Then set a **disposition code** and, if needed, a ' +
            '**follow-up task**. Write notes the next agent can act on without calling you — ' +
            'assume the customer will contact again and someone will need the whole story.',
          sample: {
            kind: 'text',
            src:
`GOOD TICKET NOTE
  WHO    Ma. Cruz, acct 88213, verified by DOB + last 4
  WHAT   Duplicate charge 1,250 on Oct 14 (card ending 4417).
         Reversed in billing tool, ref RV-77310.
  PENDING Refund posts in 3–5 banking days.
  WHEN   Callback promised Fri Oct 24, 8:00 PM New York (Sat 9:00 AM MNL)
  DISP   BILLING / DUPLICATE CHARGE / RESOLVED

BAD NOTE
  "customer called about bill. fixed." 
  → No account, no amount, no action, no next step.`
          },
          notes: [
            'Note = who, what, pending, when.',
            'Always set a disposition code.',
            'Write for the next agent, not for yourself.'
          ]
        },
        {
          heading: '3.6 Inbound, outbound and blended campaigns',
          body:
            '**Inbound** campaigns are driven by the customer: service lines, order support, ' +
            'technical help, complaints. The measure is usually **service level** — the percentage ' +
            'of calls answered within a target (for example 80% within 20 seconds).\n\n' +
            '**Outbound** campaigns are driven by the company: telemarketing, renewals, collections, ' +
            'welcome calls, and follow-ups after a repair. Outbound needs a **permission and purpose ' +
            'statement**: who you are, why you are calling, and the right to say no. The measure is ' +
            'usually **conversion, contact rate and compliance** (no false claims, respect the ' +
            'do-not-call list).\n\n' +
            '**Blended** programs do both: an agent takes calls in a queue and works a call-back ' +
            'list between calls. The skill is switching register quickly — the outbound customer is ' +
            'interrupted, so the greeting must earn the next ten seconds immediately.',
          sample: {
            kind: 'phone',
            src:
`INBOUND  (customer calls us)
  "Thank you for calling <company>, this is <name>. How may I help?"

OUTBOUND (we call the customer)
  "Good evening, this is <name> from <company>. Is now a good time to
   talk about your account renewal? It will take about two minutes."
  -> if "no": offer a callback time, thank them, log the attempt`
          },
          notes: [
            'Inbound = service level. Outbound = permission, purpose and conversion.',
            'An outbound greeting must earn the next ten seconds.',
            'Every attempt — answered or not — is documented.'
          ]
        },
        {
          heading: '3.7 Upselling and cross-selling the honest way',
          body:
            '**Upselling** offers a better version of what the customer already wants. ' +
            '**Cross-selling** offers a related product they do not have yet. Both are legitimate ' +
            'only when the offer solves a real need.\n\n' +
            'The sequence that works: **resolve first**, then **bridge** from what you learned ' +
            '("You mentioned you travel twice a month — the plus plan covers roaming"), then ' +
            '**state the benefit** in the customer\'s terms, then **give the cost honestly**, then ' +
            '**accept the no** without pressure.\n\n' +
            'Never say "this is free" when it is free for three months; state the price and the ' +
            'condition. Mis-selling is a compliance breach, not a sales win, and every claim is ' +
            'recorded.',
          sample: {
            kind: 'phone',
            src:
`HONEST OFFER FORMULA
  Resolve  -> "Your refund is processed in 3-5 days."
  Bridge   -> "You mentioned you travel often..."
  Benefit  -> "The Plus plan includes roaming in 12 countries."
  Cost     -> "It is 300 more per month, and you can cancel any time."
  Accept   -> "Would you like me to send the comparison instead?"
NO  -> "No problem, I have noted your preference. Anything else today?"`
          },
          notes: [
            'Resolve before you sell — an unresolved problem is not a sales opportunity.',
            'State the real cost and the conditions; never imply a temporary price is permanent.',
            'A declined offer costs nothing; a mis-sold one ends in a complaint.'
          ]
        },
        {
          heading: '3.8 Handling difficult customers without losing control',
          body:
            'Difficult contacts come in recognisable types. **The irate customer** needs to be ' +
            'heard first — let them finish, acknowledge, then take control with a plan. **The ' +
            'rambler** needs signposting and closed questions. **The expert** wants to be ' +
            'acknowledged as knowledgeable and given technical detail. **The silent customer** needs ' +
            'gentle prompts and reassurance. **The threatening or vulgar caller** gets one calm ' +
            'warning, then escalation and documentation.\n\n' +
            'Under Philippine law and company policy, abuse is not part of the job. You may say: ' +
            '"I want to help you. I can keep going if you can speak with me respectfully." If it ' +
            'continues, escalate to a supervisor and log the language.\n\n' +
            'Watch your own signals: a raised voice, a fast tempo and clenched sentences are signs ' +
            'you have lost control. Pause, drop your volume, and slow down — the customer usually ' +
            'follows.',
          sample: {
            kind: 'text',
            src:
`LAST MODEL (apply in order)
  L  Listen      let the customer finish, no interruption
  A  Acknowledge name the emotion and the problem
  S  Solve it    one clear action, with a time
  T  Thank you   close with a summary and an offer of help

ESCALATION LINE
  "I want to help you. I can keep going if we can speak with me respectfully."`
          },
          notes: [
            'Never interrupt an emotional customer; the first listen does the work.',
            'One calm warning, then escalate — and record what was said.',
            'Lowering your own volume brings the call back faster than arguing.'
          ]
        },
        {
          heading: '3.9 Escalation, call-backs and handoffs',
          body:
            '**Escalation** exists so the customer does not have to start over. Escalate when the ' +
            'request is outside your authority (refunds over a limit, credits, exceptions), when ' +
            'policy is silent, when a safety issue is involved, or when the customer asks for a ' +
            'supervisor after you have genuinely tried.\n\n' +
            'A clean handoff contains: the customer and account identifiers, a one-sentence problem ' +
            'statement, what has already been tried, what is pending, and the promised time. ' +
            '**Warm transfers** explain the situation to the next agent and introduce the customer; ' +
            '**cold transfers** simply push the call. Warm transfers protect CSAT; cold transfers ' +
            'generate repeat calls.\n\n' +
            '**Call-backs.** Never promise a callback you cannot keep. Give a window in the ' +
            'customer\'s local time, log it, and if the target is at risk, call early to say so.',
          sample: {
            kind: 'text',
            src:
`HANDOFF NOTE
  CUSTOMER   A. Reyes, acct 88213, verified DOB + last4
  ISSUE      Duplicate charge 1,250 on Oct 14 (ref RV-77310)
  TRIED      Reversal requested in billing tool, ref given to customer
  PENDING    Refund approval above my limit
  PROMISED   Callback Fri 8:00 PM New York (Sat 9:00 AM Manila)

ESCALATE WHEN
  above your approval limit · policy is silent · safety risk · requested after a real attempt`
          },
          notes: [
            'Escalate on authority, ambiguity, safety, or a fair request — not on effort alone.',
            'A handoff note must let the next agent continue without re-asking the customer.',
            'Promised callbacks are commitments; log the time in the customer\'s clock.'
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       QUARTER 4
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'q4',
      tab: 'Q4 · Non-voice',
      title: 'Quarter 4 — Non-Voice & Digital Channel Support',
      blurb: 'Most modern service happens in writing: email, chat, tickets and social media. The same courtesy applies — but now it is permanent, searchable, and judged by grammar.',
      sections: [
        {
          heading: '4.1 Email support etiquette',
          body:
            'An email is a permanent record, so write it as if the customer, your team leader and ' +
            'the QA analyst will all read it — because they will.\n\n' +
            '**Subject line.** Say the purpose in a few words and include the reference: ' +
            '"Refund status — Ticket #48213". Never leave it blank, never write "HELP".\n' +
            '**Structure.** Greeting → thank or acknowledge → what you found → what you did or ' +
            'will do → what happens next and when → polite close → signature with your name, ' +
            'team and the approved contact details.\n' +
            '**Tone.** Professional, warm, plain. Short sentences. One idea per paragraph.\n' +
            '**Mechanics.** Correct grammar and spelling; **no ALL CAPS** (it reads as shouting); ' +
            'no emojis unless the brand allows them; no slang or idioms; use the customer\'s name ' +
            'once or twice.\n' +
            '**Never** include another customer\'s data, passwords, or internal notes. Follow the ' +
            'Data Privacy Act (RA 10173) and your account\'s confidentiality rules. Reply inside ' +
            'the channel\'s SLA.',
          sample: {
            kind: 'email',
            src:
`Subject: Refund status — Ticket #48213

Hi Ms. Cruz,

Thank you for contacting Northline Support. I'm sorry for the trouble with
the duplicate charge on your October bill.

I checked account 88213 and confirmed that 1,250 was charged twice on
October 14. I have reversed the duplicate charge, reference RV-77310.

The refund will post to your card ending 4417 within 3–5 banking days. You
will receive an email confirmation as soon as it is released.

If the refund has not appeared by October 31, reply to this message and I
will follow it up personally.

Kind regards,
Ana Reyes · Billing Support · Northline`
          },
          notes: [
            'Subject line = purpose + reference. Never blank, never "HELP".',
            'Structure: greeting, acknowledgement, finding, action, next step, signature.',
            'No ALL CAPS, no slang, no emojis unless the brand allows it.',
            'Never include other customers\' data — RA 10173.'
          ]
        },
        {
          heading: '4.2 Live chat and messaging apps',
          body:
            'Chat is **real-time and informal**, but it is still a professional channel. ' +
            '**Speed matters** — a chat that sits silent for a minute feels abandoned, so ' +
            'acknowledge fast ("Let me check that for you now") and keep the customer informed ' +
            'while you research.\n\n' +
            '**Multi-chat handling.** Agents often hold two to four chats at once. Manage it with ' +
            'a queue discipline: answer the oldest waiting chat, use **canned macros** (approved ' +
            'quick responses) for openings, verifications and closings, and never let a chat go ' +
            'silent while you work on another.\n\n' +
            '**Etiquette.** Short paragraphs, plain words, no ALL CAPS, minimal abbreviations, ' +
            'confirm understanding before closing, and offer an email or callback if the issue ' +
            'needs long investigation. Emojis only if the brand allows them. Never paste internal ' +
            'codes the customer cannot use.',
          sample: {
            kind: 'chat',
            src:
`[00:00] Customer: hi my order still hasnt arrived
[00:04] Agent:  Hi! I can check that for you right now — may I have the
                order number?
[00:11] Customer: 77310
[00:18] Agent:  Thank you. I see it left our warehouse on Oct 21 and is with
                the courier. Let me pull the latest scan.
[00:22] Agent:  [MACRO: "checking, please give me one moment"]
[00:41] Agent:  It's out for delivery today before 6 PM. Here's the
                tracking link: northline.ph/t/77310
[00:49] Customer: great, thanks!
[00:53] Agent:  Happy to help. Anything else I can check? — Ana

MACROS IN USE
  /hi        greeting + offer to help
  /verify    ask for order or account number
  /wait      "one moment while I check"
  /close     confirm, offer more help, sign off`
          },
          notes: [
            'Acknowledge in seconds; never leave a chat silent.',
            'Macros for openings, verification and closings.',
            'Two to four chats at once is normal — oldest waiting first.',
            'Escalate to email or phone for long investigations.'
          ]
        },
        {
          heading: '4.3 Back-end and administrative support',
          body:
            'Back-office work keeps the front office running: **data entry**, **online research**, ' +
            '**document processing**, **billing checks** and **ticket resolution workflows**.\n\n' +
            '**Accuracy beats speed** — a wrong account number costs more than a slow one. Follow ' +
            'the standard: key exactly what you see, use **double entry** or a second check for ' +
            'critical fields, flag anything unreadable instead of guessing, and keep a clean ' +
            'audit trail.\n\n' +
            '**Research** means using approved sources only: the knowledge base, the CRM, the ' +
            'official website. Record the source and the date you checked it. **Ticket ' +
            'workflows** are queues with owners, priorities and SLAs — pull the oldest and highest ' +
            'priority first, update the ticket at each stage, and never close a ticket without a ' +
            'resolution note.',
          sample: {
            kind: 'text',
            src:
`DATA ENTRY CHECKLIST
  □ Same name / same spelling / same digits as the source
  □ No blank mandatory fields
  □ Currency and date format follow the account rules
  □ Critical fields double-checked
  □ Anything unreadable FLAGGED, never guessed

TICKET WORKFLOW
  New → Assigned → In progress → Pending customer
      → Resolved (with a note) → Closed

PRIORITY ORDER
  SLA breach risk  >  oldest waiting  >  newest`
          },
          notes: [
            'Accuracy before speed; never guess an unreadable field.',
            'Approved sources only, and note when you checked them.',
            'No ticket closes without a resolution note.'
          ]
        },
        {
          heading: '4.4 Omnichannel service delivery',
          body:
            '**Multichannel** means offering several channels that do not know about each other: ' +
            'you call, then you email, and you have to explain the whole story again. ' +
            '**Omnichannel** means the channels share **one customer context** — the phone agent ' +
            'can see the chat the customer had an hour ago, and the email that follows quotes the ' +
            'same ticket number.\n\n' +
            'The goal is a **seamless journey**: start on chat, move to phone for a complex fix, ' +
            'finish with an email confirmation — without the customer repeating themselves. That ' +
            'only works if every agent **logs the contact properly** (remember Quarter 3), tags ' +
            'the channel, and links related tickets. If you promise a callback, put it in the ' +
            'system; a promise that lives only in your memory breaks the omnichannel experience.',
          sample: {
            kind: 'text',
            src:
`MULTICHANNEL (siloed)
  Chat ticket #1001  ─┐
  Phone call #1002   ─┼─  separate records → customer repeats the story
  Email #1003        ─┘

OMNICHANNEL (shared context)
  Chat #1001 → linked to phone #1002 → email #1003
  One customer view: same account, same issue, same promised callback

THE RULE
  If it is not in the CRM, it did not happen.`
          },
          notes: [
            'Multichannel = many channels, separate records.',
            'Omnichannel = many channels, one shared customer view.',
            'Context carries over only if every contact is logged and linked.'
          ]
        },
        {
          heading: '4.5 Chat concurrency and multitasking',
          body:
            'Chat agents usually handle two to four conversations at once — **concurrency**. It ' +
            'works because chat is asynchronous: the customer types, you reply, they read. The ' +
            'skill is not typing speed; it is **state management**. Know, for every open window, ' +
            'who the customer is, what they asked, and what you promised.\n\n' +
            'Practical rules: **answer the newest message first only if it is a greeting**, ' +
            'otherwise finish the thought you started; **use the customer\'s name** so the wrong ' +
            'window never gets the right answer; **never paste a macro without personalising it**; ' +
            'and **close what is done** — an abandoned tab is a silent complaint.\n\n' +
            'Chat also has a hard etiquette: respond within the stated wait (often 30–60 seconds), ' +
            'tell the customer when you need to check something, and never leave a window idle ' +
            'without a message.',
          sample: {
            kind: 'chat',
            src:
`[09:14] Customer: hi, my order still says processing
[09:14] Agent:    Hi Mara! Checking order #88213 for you now — one moment.
[09:15] Customer: ok
[09:15] Agent:    Thanks for waiting. It left our warehouse today and the courier
                  has it. Estimated delivery is Thursday.
[09:15] Customer: can I change the address?
[09:15] Agent:    Possibly — the courier allows changes before first scan. May I
                  confirm the new address?
[09:16] Customer: 22 Mabini St, Quezon City
[09:16] Agent:    Updated with the courier, ref CD-4471. If the scan is too late,
                  the parcel returns and we reship free. Anything else today?`
          },
          notes: [
            'Concurrency is state management, not typing speed.',
            'Name the customer so replies never land in the wrong window.',
            'Personalise every macro; close every window that is finished.'
          ]
        },
        {
          heading: '4.6 Social media and public replies',
          body:
            'A public post is a conversation with an audience. The customer writes to you, but ' +
            'hundreds of people read the answer. Three rules govern **social care**: **acknowledge ' +
            'in public, resolve in private** (public: "We are sorry — we have sent you a message"; ' +
            'private: account details, verification, resolution), **never argue**, and **never ' +
            'reveal account data** in a public thread.\n\n' +
            'Classify the post before replying: **complaint** (acknowledge, move to DM, log a ' +
            'ticket), **question** (answer publicly if it helps others), **praise** (thank them, ' +
            'quote it in the huddle), **troll** (do not engage; report), **crisis** (escalate to ' +
            'communications immediately — a safety issue or a viral thread is not an agent-level ' +
            'decision).\n\n' +
            'Tone on social is warmer and shorter than email, but the same compliance rules apply: ' +
            'no promises you cannot keep, no personal opinions, no deleting criticism.',
          sample: {
            kind: 'text',
            src:
`PUBLIC REPLY (nothing private in it)
  "Hi Marco, we are sorry about the delay. We have sent you a message so we
   can look at order #88213 and fix it today."

THEN, IN PRIVATE
  verify -> investigate -> resolve -> ask permission to update the public thread

NEVER
  argue · post account details · delete the complaint · promise a refund date you cannot prove`
          },
          notes: [
            'Acknowledge publicly, resolve privately, never publish account data.',
            'Trolls are reported, not argued with. Crises go to communications.',
            'Deleting criticism multiplies it; answer it instead.'
          ]
        },
        {
          heading: '4.7 Back-office quality and data entry standards',
          body:
            'Back-office work — data entry, order processing, claims, reconciliations — is measured ' +
            'differently from voice. There is no customer on the line, so **accuracy replaces ' +
            'rapport** and **turnaround time replaces AHT**.\n\n' +
            'The standard for a data task is **first-time-right**: the percentage of records ' +
            'completed with no correction needed. A batch done quickly but wrongly is more ' +
            'expensive than one done once. Work in a **double-check loop**: enter, then verify ' +
            'against the source using a fixed checklist — date formats, name spelling, currency, ' +
            'IDs, and the correct **disposition or status code**.\n\n' +
            'Confidentiality is stricter here than anywhere else: back-office teams often see whole ' +
            'databases. Take nothing out of the building — no photographs, no emailing files to ' +
            'yourself, no USB drives. Under **RA 10173** that is a reportable breach, not a ' +
            'mistake.',
          sample: {
            kind: 'text',
            src:
`FIRST-TIME-RIGHT CHECK (before you submit a record)
  [ ] name spelt exactly as in the source document
  [ ] date format matches the system (YYYY-MM-DD)
  [ ] amounts and currency match, decimals included
  [ ] ID / account number checked twice
  [ ] status or disposition code selected
  [ ] note says what was done and what is pending`
          },
          notes: [
            'Accuracy beats speed: first-time-right is the back-office metric.',
            'Verify with a fixed checklist, every record, every batch.',
            'Never copy customer data outside the approved systems.'
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       GLOSSARY — the vocabulary of the floor, A to Z
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'glossary',
      tab: 'Glossary',
      title: 'Glossary — the language of the floor',
      blurb: 'Every term a new agent hears in the first week, in the order they meet it. If a huddle sounds like code, look it up here.',
      sections: [
        {
          heading: '6.1 People and roles',
          body:
            '**Agent / CSR / TSR** — the person handling contacts. CSR = Customer Service ' +
            'Representative; TSR = Technical Support Representative.\n' +
            '**SME (Subject Matter Expert)** — the experienced agent the team asks when a process ' +
            'is unclear.\n' +
            '**Team Leader (TL) / Supervisor** — owns a team\'s performance, coaching and ' +
            'escalations.\n' +
            '**QA analyst** — scores sampled contacts against a scorecard and coaches the gaps.\n' +
            '**Trainer** — runs nesting and product training; owns the knowledge base with the SME.\n' +
            '**WFM analyst** — forecasts volume and builds the schedule (rosters, breaks, shrinkage).\n' +
            '**Workforce / real-time analyst (RTA)** — watches queue health live and moves people ' +
            'and breaks minute by minute.\n' +
            '**Account manager / client** — the company that outsourced the work.\n' +
            '**Vendor / BPO partner** — the outsourcing company that employs the agent.',
          notes: [
            'Know who to ask for what: process → SME, performance → TL, schedule → WFM.',
            'QA and training are support roles, not punishment duties.'
          ]
        },
        {
          heading: '6.2 Metrics, A to Z',
          body:
            '**AHT (Average Handle Time)** — (talk + hold + after-call work) ÷ contacts handled.\n' +
            '**ACW (After-Call Work)** — the wrap-up time after the customer hangs up.\n' +
            '**ASA (Average Speed of Answer)** — average seconds a caller waits in queue.\n' +
            '**Adherence / compliance** — working the minutes you were scheduled.\n' +
            '**Attrition** — the rate at which agents leave the company.\n' +
            '**CSAT** — customer satisfaction score from a survey (satisfied ÷ responses × 100).\n' +
            '**FCR (First Contact Resolution)** — solved on the first contact ÷ total contacts.\n' +
            '**NPS (Net Promoter Score)** — % promoters − % detractors, from "would you recommend us".\n' +
            '**Occupancy** — share of available time spent handling contacts.\n' +
            '**QA score** — the quality scorecard result, usually a percentage with fatal errors.\n' +
            '**Service level (SL)** — e.g. 80/20: 80% of contacts answered within 20 seconds.\n' +
            '**Shrinkage** — paid hours not spent handling contacts (breaks, training, absence).\n' +
            '**Transfer rate** — share of contacts handed to another queue or team.\n' +
            '**Utilisation** — how much of paid time is productive at all.',
          notes: [
            'AHT is a sum, not a stopwatch on the agent alone — hold and wrap count.',
            'CSAT measures the customer; QA measures the process; both are tracked.',
            'Service level is a queue target, not a promise to an individual caller.'
          ]
        },
        {
          heading: '6.3 Systems and codes',
          body:
            '**ACD** — Automatic Call Distributor: routes calls to the next available agent.\n' +
            '**IVR** — Interactive Voice Response: the recorded menu before a person answers.\n' +
            '**CRM** — Customer Relationship Management: the record of every customer contact.\n' +
            '**CTI** — Computer Telephony Integration: the screen pop that opens the right record.\n' +
            '**Dialer** — software that places outbound calls (preview, progressive, predictive).\n' +
            '**Disposition** — the code that labels how a contact ended (resolved, escalated, ' +
            'callback, no answer).\n' +
            '**Knowledge base (KB)** — the approved answers and procedures agents rely on.\n' +
            '**Macro / canned response** — a saved chat or email template, always personalised.\n' +
            '**Softphone** — the phone built into the computer.\n' +
            '**Ticket** — a tracked work item with an ID, an owner and a status.\n' +
            '**UPS** — Uninterruptible Power Supply: the battery that keeps the station alive.\n\n' +
            '**AUX codes** — the reason you are unavailable: break, lunch, coaching, meeting, ' +
            'system issue. Codes keep occupancy honest.\n' +
            '**Wrap / ACW** — the state you enter after a contact to finish the note.',
          notes: [
            'Right code, right minute: a wrong AUX code corrupts the forecast.',
            'Every contact ends with a disposition and a note.',
            'The KB is the source of truth — quote it rather than improvise.'
          ]
        },
        {
          heading: '6.4 Floor slang and idioms',
          body:
            '**Nesting** — the supervised period when a new agent takes live contacts for the first ' +
            'time.\n' +
            '**Huddle** — the short team meeting at the start of a shift.\n' +
            '**Roster / shift bid** — the schedule, and the periodic process of choosing one.\n' +
            '**Queue** — the line of contacts waiting for an agent.\n' +
            '**Floor** — the production area; "on the floor" means live and available.\n' +
            '**Tier 1 / Tier 2** — front-line support and the specialist escalation group.\n' +
            '**Callback** — a promised return contact; also the queued option that saves the ' +
            'customer\'s place in line.\n' +
            '**Dead air** — silence on the line (a quality failure).\n' +
            '**Cold / warm transfer** — pushing a call blindly versus briefing the next agent.\n' +
            '**Repeat call** — a contact about a problem that was supposedly solved.\n' +
            '**Escalation** — passing the contact up the authority chain with a clean handoff.\n' +
            '**Coaching / QA session** — the scheduled review of sampled contacts with your TL.\n' +
            '**Attrition vs shrinkage** — people leaving the company versus hours away from the queue.',
          notes: [
            'Nesting is where training becomes habit — ask questions freely.',
            'Dead air and repeat calls are the two signals a TL watches for.',
            'A warm transfer protects CSAT; a cold one creates repeat calls.'
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════════════════════════════════
       QA WING — the reading for Room 2 (unlocked after the floor is cleared)
       Every ★ answer below is the exact wording the six wing questions accept.
       ══════════════════════════════════════════════════════════════════════ */
    {
      id: 'qa',
      tab: 'QA Wing',
      title: 'QA & Escalation Wing — quality, privacy and the next step',
      blurb: 'Room 2 of the building. This is where the sampled calls are scored, the escalations land, and new agents finish nesting. Read this before you touch the wing consoles.',
      sections: [
        {
          heading: '7.1 The scorecard',
          body:
            'Every agent is sampled — usually two to four contacts a week — and each sample is ' +
            'marked against a **scorecard**: the written, weighted checklist of behaviours the ' +
            'account pays for. A typical scorecard looks like this:\n\n' +
            '  GREETING & BRANDING     10 pts  \n' +
            '  VERIFICATION            15 pts  \n' +
            '  PROBING & ACCURACY      25 pts  \n' +
            '  HOLD / MUTE ETIQUETTE   10 pts  \n' +
            '  RESOLUTION & CLOSING    20 pts  \n' +
            '  DOCUMENTATION           20 pts  \n\n' +
            'Your **QA score** is the percentage of those points you earned. Some misses do not ' +
            'cost one point — they cost the whole contact. Those are **fatal errors**: no ' +
            'verification before reading account data, a data-privacy breach, an unlogged ' +
            'promise, abusive language, or releasing information to the wrong person. One fatal ' +
            'error zeroes the sample no matter how polished the rest of the call sounded.',
          sample: {
            kind: 'text',
            src:
`QA SAMPLE — call #4471 (agent: you)\n` +
`  Greeting .............. 10/10   OK\n` +
`  Verification ..........  0/15   FAIL — account read before verify  <-- FATAL\n` +
`  Probing ............... 23/25\n` +
`  Hold etiquette ........ 10/10   permission + 2 min promise\n` +
`  Resolution ............ 20/20\n` +
`  Documentation ......... 20/20\n` +
`  ------------------------------------------------\n` +
`  FATAL ERROR: score recorded as 0%. Coaching booked with TL.`
          },
          notes: [
            'QA samples behaviours, not personality — it is fixable feedback.',
            'Fatal error = one behaviour that wipes the whole score.',
            'Read the scorecard for your account; the weighting differs by client.'
          ]
        },
        {
          heading: '7.2 Calibration',
          body:
            'If two QA analysts score the same recording and disagree by twenty points, the ' +
            'score is not a standard — it is an opinion. So teams run **calibration**: analysts ' +
            '(and often the TL and a senior agent) score the same call independently, then ' +
            'compare marks line by line until they agree on what each behaviour looks like.\n\n' +
            'Calibration is why you can appeal a score and win. Ask for the recording, ask which ' +
            'behaviour was missed, and ask for the calibration example for that behaviour. ' +
            'Disagreeing with a score is allowed; disagreeing without the recording is not.',
          notes: [
            'Calibration = same standard for every agent and every shift.',
            'Ask for the recording before you argue with a score.',
            'A calibrated scorecard turns "you were rude" into "you skipped verification".'
          ]
        },
        {
          heading: '7.3 Escalation ladder',
          body:
            'The wing exists to catch what the floor cannot. The ladder is the rule: you handle ' +
            'what your authority allows, and you **escalate** everything above it — never guess, ' +
            'never promise what the system cannot do.\n\n' +
            '  TIER 1  you ..................... standard fixes, process questions\n' +
            '  TIER 2  SME / specialist ......... technical depth, policy exceptions\n' +
            '  TIER 3  TL / supervisor .......... refunds, goodwill, angry VIPs\n' +
            '  TIER 4  client / account team .... commercial, legal, PR risk\n\n' +
            'A good escalation carries: the verified account, the customer\'s own words, what ' +
            'you already tried, and the outcome you are asking for. A warm transfer briefs the ' +
            'next agent before the handover; a cold transfer drops the customer on them.',
          notes: [
            'Escalate early; a guessed answer becomes a repeat call.',
            'Your notes travel with the case — write them as if the next agent is watching.',
            'Warm transfer = brief the agent, then introduce the customer.'
          ]
        },
        {
          heading: '7.4 Data privacy in the wing',
          body:
            'The wing handles more personal data than the floor, so the rules are stricter. ' +
            '**RA 10173, the Data Privacy Act of 2012**, gives every customer rights over their ' +
            'own records: to be informed, to object, to correct, and to **access** a copy of what ' +
            'the company holds. A customer exercising that right files a **data subject access ' +
            'request**; you log it and hand it to the privacy officer — you never gather the ' +
            'records yourself and you never email them to an unverified address.\n\n' +
            'On every contact: verify before you read anything aloud, never repeat card numbers, ' +
            'never confirm an account exists to someone who fails verification, and never store ' +
            'customer data on a personal device or a sticky note.',
          notes: [
            'Verify before you read; no exceptions, even for a friendly caller.',
            'RA 10173 = Data Privacy Act of 2012. PCI DSS covers card data.',
            'Access requests go to the privacy officer, not to your outbox.'
          ]
        },
        {
          heading: '7.5 Nesting bay',
          body:
            'The last stop before a solo queue is **nesting**: the supervised stage where a new ' +
            'agent takes real contacts with a coach beside them, pausing the call to ask, ' +
            'replaying the recording afterwards, and fixing one behaviour at a time.\n\n' +
            'Nesting is measured by readiness, not speed: verification without prompting, hold ' +
            'etiquette without reminders, notes that a stranger could read. Ask everything while ' +
            'somebody is paid to answer — the questions do not get cheaper later.',
          notes: [
            'Nesting = supervised live practice before the solo queue.',
            'Readiness beats speed: clean verification, holds and notes.',
            'Replay your own recordings; the gaps are kinder on tape than on CSAT.'
          ]
        }
      ]
    }
  ]
};
