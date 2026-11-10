---
name: skill-5
description: >
  Level Nine — design any mobile app screen at 9/10 (the level of the best
  Apple Design Award and top-of-Dribbble work) instead of the 4–6 that AI
  normally ships. Gives the AI a calibrated 1–10 level ladder so it always knows
  what level it is operating at and exactly what blocks the next point; nine
  scored pillars (the picture holds the data, coverage, one drawing hand, a
  system skeleton with real chrome, typographic nuance, human copy,
  moment-awareness, a signature interaction, zero defects) with hard score
  caps; a method that finds an app's "moments" and draws a hero object for
  each; SVG illustration recipes in ten drawing styles; exact specs for
  satisfying interactions; working starters for every kind of screen (glance,
  list, feed, instrument, canvas, conversation); and a render-and-audit script
  that proves a design works (small and large phones, dark, long content, large
  text, real presses) before it is scored, plus a blind read by a fresh reader.
  Use for ANY mobile app design, redesign or critique — core screens, flows,
  onboarding, paywalls, trackers, finance, fitness, travel, health, social,
  commerce, media, utilities — as mockups or production UI (HTML/SVG, SwiftUI,
  React Native, Flutter, Compose). Trigger on "design an app/screen", "make it
  better/premium/world-class", "not generic", "level 9", "rate/critique my
  design", "mobile mockup", "redesign this screen".
---

# Level Nine

AI app design does not fail by being ugly. It fails by stalling. Every model
reaches a clean, correct, interchangeable 5 and stops, because every decision
was left at its most probable value. Anti-slop rules push it to a 6. Copying
the conventions of top apps pushes it to a 7. Almost nothing gets it to 9.

This skill is the climb from 5 to 9, written by working it end to end: a
first pass that scored 5.5–6.5, a rethink to 8–8.5, a detail-and-signature pass
to 9, each step rendered, measured and scored against reference work. The
before/after screenshots are in `examples/` and the full story is in
[references/case-study.md](references/case-study.md). Read it once; it is
the fastest way to see the difference between the levels.

`<skill>` = this folder (normally `~/.claude/skills/skill-5`).

---

## 1. The ladder (know where you are)

| Level | What you see | What caps it there |
|---|---|---|
| 1–2 | Broken: overlapping or clipped text, default HTML, broken images, lorem | Not finished |
| 3 | Template: UI-kit defaults, system blue, emoji icons, purple gradient, cards in cards | Nothing was decided |
| **4** | **Competent generic.** Clean and aligned. Greeting header, hero stat card, 2×2 tiles, "Recent" list, Inter, one safe accent. Could be any app | Every decision is the most likely one |
| **5** | **Polished generic.** Real content, fair hierarchy, maybe a pleasant gradient or stock illustration. All fields weigh the same | No idea; looks like a kit |
| **6** | **The anti-slop plateau.** Clichés gone, a type idea, a real palette, big numbers. But it is type on a ground: empty middles, no app chrome, pictures absent or decorative, small defects. A poster inside a phone | No picture carrying the data, dead space, defects |
| **7** | **The convention plateau.** Studied top apps, adopted the proven skeleton, added a nice illustration and real chrome. Polished category default | The picture decorates; the structure is everyone's |
| **8** | **Distinctive and complete.** Hero picture fills the screen and mostly carries the state, full skeleton, consistent world, human copy | Drawings are clean but thin on character; variants are re-skins; a few rough edges |
| **9** | **Every pillar.** The picture *is* the information; one drawing hand with detail and character; one signature interaction born of the concept; copy you would quote; zero defects at 3×; every state rendered and checked | — |
| 10 | 9 plus illustrator-grade art (texture, imperfection, character), motion tuned on a real device, edge states and dark mode equally crafted, and an idea the category has never shipped | Rare. Do not claim it lightly |

The full ladder with the tells for each level, calibration anchors, and the
common misjudgments is in [references/levels.md](references/levels.md).

**Calibration rule:** your gut score is 1.5–2 points high. Score against named
anchors (the ladder, `examples/*.png`, the user's references), never in a
vacuum.

---

## 2. The Works gate, then the nine pillars

### The Works gate (pass or fail, before any score)

A screen that looks like a 9 and cannot be used is not a 9. Every screen
passes all six lines first; only then are the pillars scored. The audit script
does the measuring for five of them; a reader who has seen nothing does the
first.

| # | Line | Passes when | Proven by |
|---|---|---|---|
| W1 | **Clear** | A stranger names the app, the state and the next tap from a first look | The blind read ([references/audit.md](references/audit.md) §3) |
| W2 | **Readable and tappable** | Text ≥ 11 px (10 in a tab bar); contrast ≥ 3:1 for anything a person reads (body text under 4.5:1 warns), measured on the pixels behind the words; hit areas 44 × 44; nothing clipped, colliding or covered | Audit, base pass |
| W3 | **Fits** | The same checks hold at 375 × 667 and at 440 × 956 | Audit, small and large passes |
| W4 | **Real content** | The layout survives every string 35% longer and body text at Dynamic Type XL; the core screen's empty, loading and error states are on the state sheet | Audit, stress and text-xl passes; the sheet |
| W5 | **Appearance** | A designed dark variant passes the same checks, or the app has one appearance for a stated reason | Audit, dark pass |
| W6 | **Answers a finger** | Every control shows a pressed state; the signature interaction, driven for real, changes the screen; setting a value takes no more steps than the system picker or keyboard would | Audit, press pass; count the taps |

A FAIL on any line is a gate failure: fix it before you score. A WARN is
answered (fixed, or one line on why it is deliberate). A line you did not run
is unproven, and unproven is capped (below). The numbers live in one place,
the `RULES` block at the top of `scripts/audit.mjs`; this file and the
references quote them.

### The nine pillars (the scoring rubric)

Score each pillar **0, 0.5 or 1**. **Score = 1 + sum** (max 10). Then apply caps.

**Structure and role first.** The wording below is for a glance: the home /
status screen that shows one fact. Every screen first gets a **structure**
from what the person does there (glance, list, feed, instrument, canvas,
conversation: [references/anatomy.md](references/anatomy.md) §1) and a
**role · volume · job** (home, detail, input, entry, transition, celebration,
utility: anatomy.md §6). Each has its own version of every pillar: never
skipped, always earned. Before any flaw counts, it must pass the intent check
([references/levels.md](references/levels.md), "Reading intent"): taste
choices can be deliberate, function failures never are.

| # | Pillar | 1 point when… | The test |
|---|---|---|---|
| P1 | **The picture holds the data** | The core screen's hero picture encodes the current state: a jar filled to the money left, a clock wedge of minutes left, a train with *your* door lit | **Delete-the-numbers test:** hide every number. Can the state still be read from the picture? Asked of the blind reader, on the render with its words removed; your own answer does not count |
| P2 | **Coverage** | The hero takes 30–50% of the screen, often bleeds off an edge; no *dead* band over ~15% of the height (space left over, not space that frames the hero) | **Dead-space audit:** find the largest empty horizontal band. On a status screen the picture should *be* the space; anywhere else, run the fill test (levels.md) |
| P3 | **One drawing hand, with character** | All art in one style built from the ground's own tones; bold silhouettes plus a detail pass (people, lettering on objects, secondary motion) | Could one illustrator have drawn every picture in the app? Is there one detail per scene that rewards a second look? |
| P4 | **System skeleton + real chrome** | Every screen is one system (ground logic, type, radius scale, accent role, icon family, spacing) with real chrome, and its structure comes from its job. Screens of one structure share one anatomy; a glance is status bar (clock matching the content), meta line + round button, hero, headline, up to three stats, one primary pill + one text action, tab bar. Other structures and roles get the anatomy and chrome that fit their place | Line the screens up: do they read as one shipped app, not posters? Is any screen wearing another screen's structure? |
| P5 | **Typographic nuance** | One first read. On a glance or instrument screen it is a display moment ≥ 2.5× body; on a list, feed, canvas or conversation it is the title or the leading content at native scale. Small units and decimals (`€137.60`, `6.8 KM`, `25:00`); tabular figures; weights two steps apart; tight display tracking | Is there exactly one thing a person sees first, and nothing competing in between? Does the biggest thing carry a fact? |
| P6 | **Human, specific copy** | Words a person would say, with place, time and sense: "650 ml, slowly, until it runs from the drainage hole. Living room, east window." | Would you quote a line of it? |
| P7 | **Moment-awareness** | The screen changes with the user's moment (time, state, place), showing the one thing needed *now* | What does this screen look like 20 minutes from now? If "the same", P7 is 0 |
| P8 | **Signature interaction** | One memorable, concept-born interaction, fully built: hold-to-confirm with fill and haptic, a split-flap, a ticket that tilts and tears | Would someone show it to a friend? Does it come *from* the concept? |
| P9 | **Zero defects, proven** | Every state rendered and inspected at full size; audit script clean of FAILs in every pass; every WARN answered | Have you actually looked at every PNG? |

**Caps (apply after scoring):**

| Condition | Max score |
|---|---|
| Emoji as icons, purple/indigo AI gradient, lorem/placeholder names | **4** |
| The Works gate fails: an audit FAIL in any pass (clipped, colliding or covered text, a broken or dead control, contrast < 3:1, text under 11 px, a dead band > 28% on a home or detail glance), or the blind reader misnames the state or the next tap on a home, detail or entry screen | **6** |
| No hero picture on a glance screen | **6.5** |
| Not rendered and inspected (claimed from code) | **7** |
| Category-default structure (looks like the top 3 apps rearranged), or one structure worn by every screen whatever its job | **7.5** |
| A gate line not run (audit run with `--quick`, blind read not done, signature not driven) | **8** |
| Multiple directions that differ only in palette/fonts ("skins") | **8** per direction |
| 10 requires illustrator-grade art + device-verified motion + an unprecedented idea | otherwise **9.5** |

---

## 3. Operating protocol

1. **Announce your level** at the start: "Target 9. Honest first-pass
   expectation: 7." After every round, publish the pillar table and the score,
   then the single biggest thing blocking the next point.
2. **Never claim a level you have not rendered.** "Verified" means you opened the
   PNGs this session. Say what you checked and how (real device, simulator,
   local renderer).
3. **Ask, then act.** Ask only what you cannot decide (Step 1). Everything else:
   decide, state the assumption in one line, build.
4. **Gate before score.** Every round: the audit in full, then the blind read.
   Publish the gate table above the pillar table. A screen that has not passed
   is fixed, not scored.
5. **Minimum two full rounds** of build → render → audit → score. Stop at 9 with
   the gate passed, or when two rounds in a row gain < 0.5 (then report honestly
   what a human illustrator or real device would add).

---

## 4. The method

### Step 1 — Brief

Ask in one message, with options to pick from (skip anything already said):
1. **The app and the person**: what it is, who uses it, the one thing they do
   in the first ten seconds, every day.
2. **The moment**: where and when they look at it (on a platform, in bed at
   23:00, mid-run). Write one *physical scene* sentence: who, where, light,
   mood. It decides light vs dark, density and type size.
3. **Feel**: three words plus up to three references *from outside apps* (an
   object, a shop, a film, a printed thing).
4. **Constraints**: name, brand assets, platform, medium (mockup or code),
   deliverable, whether image generation is available.

### Step 2 — Category autopsy

Write what the top three apps in the category share: layout skeleton, palette
cliché (green for money, sage for plants, navy and violet for sleep, white and
blue for trains), icon style, what their hero is. Then two lists:
- **Convention we keep**: navigation grammar, native controls, tab placement,
  where the primary action sits. Users know these; breaking them is a defect.
- **Default we refuse**: the look, the hero choice, the "all fields equal" card.

Studying real apps is how you reach 7. It is not how you reach 9. Take their
grammar, refuse their picture.

If a screen library is connected (the Appllama MCP, a screenshot folder, the
user's references), study 20–30 real screens of this category and screen type
first, and note each one's level and hero mode (levels.md, "the gallery
lesson"). Ignore library watermarks; never reproduce a competitor 1:1.

### Step 3 — Find the moments

A screen's job changes with time and state. List the core screen's moments
and the **one fact** each needs:

| Moment | Need in one second | Hero fact |
|---|---|---|
| 25 min before a train | Which platform, how long | Platform 16, 25:00 left |
| At the gate | Scan me | The ticket |
| On board | Where am I, what's outside | Fuji on the right until 14:19 |

No timeline? Use states (first run / empty, in progress, done, overdue, streak
at risk), time of day, place, or quantity bands (plenty / running low / out).
Every app has at least three. **P7 lives here.**

**Then give every screen its structure, from what the person does on it**
([references/anatomy.md](references/anatomy.md) §1):

| The person… | Structure | What leads |
|---|---|---|
| reads one fact in a second | **Glance** | The hero and one display moment |
| browses many things and opens one | **List** | The title and the rows |
| scrolls through what is new | **Feed** | The newest item |
| sets or measures one value | **Instrument** | The control and its value |
| explores a map, a photo, a document | **Canvas** | The subject, edge to edge |
| talks back and forth | **Conversation** | The latest message |

A library is a list and a chat is a conversation, however much you would like
to draw them a hero. Putting the glance skeleton on every screen is this
skill's own category default, and it caps the same way (7.5).

### Step 4 — A hero object for each moment

For each moment of a glance screen (and for an instrument's control or a
canvas's subject), find a real-world object or scene whose *visible state is
the data*. A drawn picture is one of seven hero modes (hero-objects.md §3):
choose the one you can execute at full quality. Charts, type, instruments and
artifacts reach 9 in code; a drawn scene needs the detail pass to get there;
material needs an image model. Run three tests: **delete-the-numbers** (state readable from the
picture), **glance** (understood in one second), **change** (it visibly changes
when the data changes, and that change can be animated).

The catalog of 60+ worked mappings across categories, and the failure modes
(mascots, metaphors that need explaining, art that never updates), is in
[references/hero-objects.md](references/hero-objects.md). **P1 lives here and
it is worth more than anything else you do.**

### Step 5 — Direction

Pick, and write down with reasons:
- **Ground**: one colour field (light, dark, or saturated), defended by the scene sentence.
- **Drawing hand**: one illustration language for every picture
  ([references/drawing-hands.md](references/drawing-hands.md): flat
  tone-on-tone poster, engraving, Swiss geometry, lit hardware, risograph,
  paper-cut, line + spot, soft clay, isometric, photo-led).
- **Type**: a display face with a reason, a text face, a numeral treatment.
- **Accent**: one hue, one role. Tones of the ground do the rest.
- **Signature interaction**: born of the concept (a ticket tears; a jar fills
  as you add; a card flips to reveal the word).

Exploring several directions? They must differ on ground, type, drawing hand
and accent, **and each needs its own signature hero**. Four palettes on one
structure are four skins, and skins cap at 8.

### Step 6 — Content before layout

Write every label, value, name and time first, in a realistic mid-use state:
specific, uneven, believable (`€137.60`, `Sat 11`, `1,850 lux`, never `$1,000`,
`John Doe`, `Lorem`). Human voice, verbs as actions, one label per intent.
Write the worst case next to the typical one: the longest real name, the
largest real number, the empty state. Mark a slot's longest real string with
`data-stress="…"` so the audit tries it.
[references/copy-and-data.md](references/copy-and-data.md).

### Step 7 — Build

1. **Structure first.** A glance starts from `<skill>/assets/template.html`
   (phone frame, real status bar, meta row, hero slot, headline, stat row,
   action row, tab bar, reset rules that cannot override your buttons,
   interaction helpers). Every other structure starts from
   `<skill>/assets/archetypes.html`: working blueprints of a list, a feed, an
   instrument, a canvas and a conversation. Take what scrolls, what is pinned
   and what leads; their greys and system type are placeholders, and a screen
   shipped in them is unfinished. For a flow, lay the screens out in order with
   structure, role and volume, and check the rhythm before drawing.
   **Build fluid:** size the screen with `var(--device-w)` × `var(--device-h)`,
   give it one scroll region, place nothing by fixed pixels. The audit resizes
   every screen, and a poster breaks.
2. **Scenes**: draw each hero at full hero size in one drawing hand, using the
   ground's tone ramp (ground, two darker, one lighter, ink). Bleed it.
3. **Interactions**: build the signature and the press states for real
   ([references/interaction.md](references/interaction.md)): exact timings,
   springs, haptics, reduced-motion fallback. Put `data-interaction` on the
   element a finger touches so the audit can drive it.
4. **Detail pass** (P3): per scene add people or life, one piece of lettering
   on an object (a station name on the clock), one secondary motion (poles
   whipping past, a second hand), one material cue (a shadow, a seal, a grain).
5. **Render every state** as its own screen side by side (a state sheet), so a
   single screenshot shows the whole journey. The core screen's empty, loading
   and error states belong on it.

### Step 8 — Render and audit

```bash
cd <skill> && npm i            # once
node <skill>/scripts/audit.mjs path/to/mockup.html --out path/to/audit/r1
```

Mark each screen with `data-role="home|detail|input|entry|transition|celebration|utility"`
(home is the default) and `data-archetype="glance|list|feed|instrument|canvas|conversation"`
(glance is the default). On a home or detail glance a dead band over 28% is a
FAIL; elsewhere it is a WARN you defend in one line, or mark the space
`data-space="why it is there"`. A band over 28% is always reported, whatever
the label says.

The script screenshots every phone screen (it finds them by `data-screen`,
`.screen`, or phone shape), freezes motion so shots are crisp, and runs seven
passes: the design **as drawn**; forced to a **small** and a **large** phone;
in **dark**; with every string **35% longer**; with **large text**; and
**pressed**, where it presses the controls and drives every
`data-interaction`, saving a four-frame strip of each. It scans for clipped,
off-screen, colliding and covered text; contrast measured on the rendered
pixels (so words on a picture or a gradient count); tiny text; emoji; template
junk; buttons that render as bare text; tap targets; broken images; fonts that
silently failed to load; dead bands; hero coverage and empty heroes; flat type
scale; hue count; AI gradients; missing status bar. It writes `report.md` with
the gate table on top and exits 1 on any FAIL. (`--quick` runs the first pass
only, for a look mid-build; it does not pass the gate.)

It also writes `blind/` (every screen with and without its words, under
neutral names) and `blind-read.md`, the two messages for a **fresh reader**.
Write one line per screen of what you expect a stranger to say (app · state ·
next tap) before anyone answers, then send the messages as written ([references/audit.md](references/audit.md) §3). This is
gate line W1 and the delete-the-numbers test, run instead of imagined.

Then **open every PNG at full size**, the pass sheets and the interaction
strips included. The script cannot see taste, and most
level-capping problems (a thin drawing, a weak line of copy, a metaphor that
does not read) are only visible to a person looking. Production code: run the
same discipline in the simulator, including a screen recording of every flow
([references/native.md](references/native.md)).

### Step 9 — Score, compare, climb

1. Gate first: every FAIL fixed in every pass, every WARN answered, the blind
   read compared with what you wrote beforehand. Then name each screen's
   structure and role, score the nine pillars in that version, run the intent
   check on every flaw, apply caps.
2. Put your sheet next to an anchor (`examples/r3-*-L9.png`, the user's
   references) and say where it loses, plainly.
3. Write the one change that would add the most points, make it, re-render.
4. The usual climb: 6 → 8 is **P1 + P2 + P4** (a hero that carries state, fills
   the middle, inside real chrome). 8 → 9 is **P3 + P8 + P9** (detail and
   character, the signature built for real, every defect gone).

[references/audit.md](references/audit.md) has the defect catalog (every bug
that capped real work), the critique protocol, and the stop rule.

### Step 10 — Report

Short and honest:
- the moments and hero objects (one line each), the default refused
- the gate table (six lines: passed, failed, or not run) and what the blind
  reader said in their own words
- the pillar table and score per round, and what changed between rounds
- the audit result (FAIL/WARN counts per pass) and how you inspected the screens
- what you could not verify (real device feel, haptics, fonts on other machines)
- the single biggest thing between this and the next level, and who could
  provide it (an illustrator, a device test, real photography)

### Redesign mode (improving an existing app)

An existing app changes the job: real users already know it, so you raise
the level without breaking what they rely on. Run these before Step 2, then
continue the method from Step 3.

1. **Get the real thing.** Ask for screenshots of the key screens (or read the
   codebase and run it). Never redesign from a description alone.
2. **Score the current app first.** Rebuild each key screen as a quick HTML
   replica (or render the running web app / simulator) and run the audit on it;
   for screenshots only, score by eye. Write the "before" pillar table and name
   the level and its dominant cap (levels.md). This is the baseline every round
   is compared to.
3. **Inventory: keep / lose / unknown.** Every feature, data point, screen and
   good idea (a clever line of copy, a useful number). The keep list is a
   contract: the redesign must contain every item on it.
4. **Harvest assets**: logo, brand colours, photos, real data, existing copy.
   Use them before inventing anything.
5. **Decisions for the user, never made silently**: renaming, changing tab
   structure, changing the hero metric, removing a feature, changing brand
   colours. List them with your recommendation and wait for an answer.
6. **Keep the grammar users learned** (where tabs are, what the primary action
   is, gestures they use daily). Change the picture, not the muscle memory.
7. **Rank the climb by points per effort.** The usual order: pass the Works
   gate (every defect fixed: P9, often +1 alone) → the right structure for
   each screen's job (P4) → one hero that carries state on the core screen (P1,
   P2) → real skeleton and chrome (P4) → copy (P6) → moments (P7) → signature
   (P8) → detail (P3). Each step is shippable on its own, so the app can improve
   in increments instead of one risky rewrite.
8. **Deliver a before/after**: the old core screen beside the new one, same
   state, same size, plus the before and after pillar tables and the keep list
   with every item ticked.

---

## 5. Hard rules

| Never | Instead |
|---|---|
| A core screen without a picture that carries the state | A hero object per moment (Step 4) |
| A dead band on a status screen (an empty middle between things that belong together) | Let the hero fill 30–50%; type sits on the scene. Space with a job is not dead: run the fill test |
| Judging every screen against the home screen's checklist | Role first: design and judge each screen at its job (anatomy.md §6) |
| The glance skeleton on a screen whose job is to browse, enter, scroll, explore or talk | Structure from the job (anatomy.md §1); start from `assets/archetypes.html` |
| A giant word or count that carries no fact ("Fourteen" over a library) | The first read is the title or the content, at native scale |
| A stat row filled to three because there are three slots | Zero to three stats, each one earning its place |
| Scoring a screen that has not passed the Works gate | Gate first (§2): a broken or unproven screen is capped |
| A screen that only works at 390 × 844 with the words it was drawn with | Fluid: device variables, one scroll region, wrapping rows; `data-stress` for the worst case |
| A custom input slower than the plain one (sixteen taps to set a year) | Count the taps; a tap on the value opens the system picker or keyboard |
| Every screen in a flow at full volume | Rhythm: quiet screens make loud ones land; one signature per flow |
| Calling a deliberate choice a flaw (quiet support, calm space, organic layout) | The intent check (levels.md): taste can be deliberate; function never is |
| A poster in a phone frame | Real chrome: status bar with matching time, meta row, tab bar, primary pill |
| Pictures as decoration (a sun, a mascot, a stock person) | A picture that changes when the data does |
| Several drawing styles in one app | One hand, the ground's tones |
| Four directions that are recolours of one layout | Each direction gets its own signature hero |
| The category's look (green fintech, sage plants, purple AI, white-and-blue trains) | Name it in the autopsy, refuse it |
| Greeting headers, 2×2 stat tiles, "Recent" lists by default | The moment's one fact owns the screen |
| Emoji icons, indigo gradients, glow, glass on content | Custom stroke icons in one weight; flat colour from the concept |
| More than one accent hue; mixed grey families; random radii | One accent, one role; one grey family; a stated radius scale |
| A global `button { background: none }` reset | `:where(button)` resets (zero specificity) so component fills always win; `all: unset` drops `box-sizing` too, so set it again |
| Display type with line-height < 0.9 and no clearance below | Measure descenders; give the next line ≥ 12px |
| Expanded/condensed display text sized by guess | Check widths at the narrowest phone; let long words wrap or shrink |
| Claiming "verified" from code | Render, open every PNG, run the audit |
| Briefing the reviewer, then calling its read fresh | The blind read: pictures only, no brief, your expectation written first |
| Static happy path only | Empty, loading, error and edge states composed, not defaulted |
| Motion on everything | Motion where state changes, on things touched; the frequency gate (anatomy.md) |

---

## 6. Beyond the core screen: every screen has a role

Each screen does a different part of the job, takes the structure that job
calls for (anatomy.md §1), and a flow is paced like a sequence: loud where people look for status, calm where they decide, alive
where they wait, quiet where they work. Roles, the pillars per role and flow
rhythm are in [references/anatomy.md](references/anatomy.md) §6.

Hero objects belong where a person *looks* for status: the core screen and
its moments, empty and first-run states, onboarding, paywalls, completions and
shareable moments. They do not belong on settings, forms, long lists or
legal screens. There, every pillar takes that role's version: the content is
the picture, the space is composed, the chrome is native, the states are
perfect. A settings screen does not need a drawing to be a 9; it needs to be
flawless and unmistakably part of the same app (same ground, type, radius
scale, accent).

Navigation, native fidelity, safe areas, dark mode, Dynamic Type and the
production verification loop are in [references/native.md](references/native.md).

---

## 7. Files

| File | Read when |
|---|---|
| [references/levels.md](references/levels.md) | Before scoring anything. The ladder in depth, anchors, reading intent (dead vs active space, the intent check), misjudgments |
| [references/case-study.md](references/case-study.md) | Once, before your first design. The 5.5 → 9 climb with screenshots |
| [references/hero-objects.md](references/hero-objects.md) | Step 3–4. Moments, the three tests, 60+ mappings by category |
| [references/drawing-hands.md](references/drawing-hands.md) | Step 5 and 7. Ten illustration languages, SVG recipes, the detail pass |
| [references/anatomy.md](references/anatomy.md) | Step 3 and 7, and before judging any screen that is not home. The six structures, the glance skeleton, spacing, type, colour, chrome, screen roles, pillars per role, flow rhythm |
| [references/interaction.md](references/interaction.md) | Step 5 and 7. Signature interactions with exact code and timings |
| [references/copy-and-data.md](references/copy-and-data.md) | Step 6. Voice, specificity, numbers, banned phrases |
| [references/audit.md](references/audit.md) | Step 8–9. The passes, the defect catalog, the blind read and the critic, stop rule, report template |
| [references/native.md](references/native.md) | Building for real: SwiftUI, React Native/Expo, Flutter, Compose |
| `assets/template.html` | Starting a glance screen. A working three-moment water tracker (~8 as shipped; passes the gate in every pass). Replace the content and hero, keep the slots |
| `assets/archetypes.html` | Starting any screen that is not a glance. Working blueprints of a list, a feed, an instrument, a canvas and a conversation, in placeholder greys. Take the structure, bring your own direction |
| `scripts/audit.mjs` | Every round. `--quick` for a look mid-build |
| `scripts/selftest.mjs` | After changing the audit or a starter (`npm test`): proves the audit still catches 22 planted mistakes and that the starters are clean |
| `examples/*.png` | Calibration: r1 = 5.5–6.5, r2 = 8–8.5, r3 = 8.5–9; `template-sip-sheet.png` = the template rendered |
| `examples/nozomi-poster.source.html` | A complete 8.5-level screen set to read for structure |
