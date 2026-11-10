# Anatomy: structure, type, colour and screen types

P4 (system skeleton + real chrome) turns a set of posters into an app. P5 is
typographic nuance. Both live here. Values are drawn on an iPhone 390 × 844 pt
canvas and must hold from 375 × 667 to 440 × 956: build with flexible slots and
one scroll region, never fixed positions (the audit resizes every screen).

---

## 1. Structure comes from the job

Before any slot is drawn, write what the person **does** on the screen, and
take the structure that verb calls for. One structure for every screen is how
a library ends up with a giant "Fourteen" where its books should be.

| Structure | The person… | What leads | What scrolls · what is pinned | Its hero | Does not have |
|---|---|---|---|---|---|
| **Glance** | reads one fact in a second (status, a countdown, today) | The hero and one display moment | Usually nothing scrolls · action row and tab bar | A hero object, chart or number (hero-objects.md) | More than three stats; a list |
| **List** | browses many things and opens one (library, inbox, settings, search results) | The title at native scale, then the rows | Rows · title bar and tab bar | The content: thumbnails or glyphs with one crop logic | A hero picture; a giant number; a stat row |
| **Feed** | scrolls through what is new (posts, activity, news) | The newest item, whole | Items · a small title bar and tab bar | Each item's own picture | A hero above the feed that pushes it down |
| **Instrument** | sets or measures one value (a timer, an amount, a filter, a recorder) | The control and its value | Little · the primary action, low, in thumb reach | The control itself: dial, ruler, keys | Decoration around the control |
| **Canvas** | explores one subject (a map, a photo, a page, a drawing) | The subject, edge to edge | The subject pans · floating chrome and a sheet | The subject | Chrome laid straight on the subject without its own surface |
| **Conversation** | talks back and forth (chat, assistant, support) | The latest message | Messages, from the bottom · the composer | A presence in the bar, if any | A hero in the thread; a stat row |

Working starters: `assets/template.html` is the glance; `assets/archetypes.html`
holds the other five as blueprints, in placeholder greys and system type on
purpose. Take the structure (what scrolls, what is pinned, what leads, where
the thumb lands) and bring your own ground, type, hand and accent. A screen
shipped in blueprint greys is unfinished.

An app is usually several structures: a glance for today, a list for the
library, an instrument to add one. They stay one app through the system
(ground logic, type, radius scale, accent role, icon family, spacing), not
through sharing a layout. Mark each screen `data-archetype="…"` so the audit
judges it as what it is.

### The glance skeleton

Top to bottom. Every glance screen in the app uses the same slots, even when a
slot's content changes completely between moments.

| Slot | Height | Content | Rules |
|---|---|---|---|
| **Status bar** | 54 | Time (17 pt semibold, tabular), signal, Wi-Fi, battery; Dynamic Island 124 × 36 at top 11 | The clock **matches the content's moment** (13:24 on the platform screen). Icons in the ground's ink |
| **Meta row** | 44 | Left: small context line (13 pt; date · what · where, the second half at 60–70% ink). Right: round icon button, 44 pt hit area (more, share, close) | One line. "Sat 3 Oct · week 9 of 15". Not a greeting |
| **Hero** | 300–360, flexible | The hero object / scene / artifact / instrument (hero-objects.md) | 30–50% of the screen. Bleed off at least one edge where the hand allows. It is the slot that gives when the phone is short or the text is large |
| **Headline block** | ~130 | Cap label (11 pt, tracked +0.1em), display line (56–110 pt), one or two sentences (15 pt, 1.4 leading) | One display moment. Small units and decimals |
| **Stat row** | ~56 | Up to three: label (11–12 pt) above value (20–26 pt, tabular) | Zero to three, each one a fact the person would miss. Never a third to fill the slot. A wrapping row, so a long value moves the next stat down instead of breaking |
| **Action row** | 54 | Primary pill (flex 1, 54 pt tall) + one text action (secondary) | One primary per screen. The pill's label is a verb for *this moment* |
| **Tab bar** | 84 | 4 tabs (icon 24 pt, label 10 pt), tinted to the ground, active state clear | Tabs are peers; the screen's tab is active |
| **Home indicator** | — | 134 × 5 at bottom 8 | In ink, never hidden by content |

Gaps: 14–18 between blocks inside the content area; side margins 20–24.
Things that belong together sit tight (label 3 pt above value); groups sit
loose. More space above a heading than below it.

**Variants keep the slots, change the content.** Platform moment: hero = the
train; display = `Car 7`; stats = Doors · Leaves in · Marker; pill = "Show
ticket". Gate moment: hero = the ticket; display = `Ready`; pill becomes
"Hold to board".

**A state sheet** is how you design and review: render each moment as its own
phone, side by side, with the moment's time under each. One screenshot shows
the whole journey and makes inconsistencies obvious.

---

## 2. Type

**Roles**

| Role | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| Display | 56–110 | heavy (condensed 600–700, expanded 800–900, serif 500) | −0.01 to −0.05 em | One per screen. Line-height 0.9–0.95 with ≥ 12 pt clearance below for descenders |
| Title | 22–30 | 600–700 | −0.01 em | Card or section titles |
| Body | 15–17 | 400–500 | 0 | 1.35–1.5 leading, ≤ 2 lines in the headline block |
| Stat value | 20–26 | 600–800 | −0.02 em | Tabular figures |
| Label / cap | 11–12 | 600–700 | +0.08 to +0.14 em, uppercase | Never below 11 (10 only in tab bars) |

**Nuance that separates 7 from 9**
- **Small units and decimals:** `€137<small>.60</small>`, `6.8<small> KM</small>`,
  `24<small>:51</small>` (the seconds at ~50% size, even in the accent colour).
- **Tabular figures** wherever numbers change: `font-variant-numeric: tabular-nums`.
- **Weights two steps apart** between display and body (900 vs 500), never 600 vs 500.
- **One family, or two with a reason.** Display face from the concept (condensed
  for an instrument, expanded grotesque for a poster, serif for paper, a Swiss
  grotesque for geometry); a quiet text face; mono only for codes and labels
  when the hand calls for it. Emphasis stays inside the family (weight or italic).
- **Measure widths.** Expanded and condensed faces change width drastically;
  check the longest display string at the narrowest supported phone. A clipped
  countdown was a round-one defect.

**Fonts that work (Google Fonts, all free):** Archivo (variable width: use
`font-stretch: 125%` for posters), Barlow Condensed, Bricolage Grotesque, Hanken
Grotesk, Instrument Serif, Newsreader, Fraunces, Geist and Geist Mono, IBM Plex
Mono, Space Grotesk (sparingly). On Apple: SF Pro (all widths), New York, SF
Rounded, SF Mono. Inter, Poppins, Montserrat and Roboto need a stated reason.

---

## 3. Colour

1. **Write the physical scene sentence** (who, where, light, mood). It decides
   light vs dark. "A commuter checking a platform at 13:08 in a bright
   concourse" → light or saturated; "someone in bed at 23:00" → dark.
2. **Pick a strategy:** *drenched* (the ground is the colour: vermilion,
   cobalt, chartreuse, mustard; best for core screens with a hero),
   *committed* (one colour carries 30–60%), or *restrained* (tinted neutrals
   plus one accent ≤ 10%; best for utility screens).
3. **Build the tone ramp** from the ground (drawing-hands.md §1). Pictures use
   the ramp, not new hues.
4. **One accent, one role** (where the state lives: the wedge, the lit door,
   the active tab). One grey family, tinted toward the ground.
5. **Refuse the category's colour cliché** (green money, sage plants,
   navy-and-violet sleep, white-and-blue trains, purple AI).
6. **Contrast:** body ≥ 4.5:1, large ≥ 3:1, including dimmed meta text.
   Opacity-dimmed text on saturated grounds is the most common failure:
   60% cream on vermilion measured 2.85:1. Use a lighter tone instead of opacity.
   The audit measures the pixels behind the words, so type on a picture, a
   gradient or a sheet is held to the same numbers as type on the ground.
7. **Dark mode** is a second design, not an inversion: lower chroma on large
   fields, lift the ink to off-white, keep the accent's role.

---

## 4. Chrome and controls

- **Real status bar and home indicator** in every mockup frame. In code, they
  are the system's; respect safe areas.
- **Round icon buttons** for top-right actions: a 44 pt hit area (the visible
  disc may be 36–40 inside it), on a 7–35% ink tint of the ground.
- **Hit areas:** 44 × 44 pt. A control at least 44 wide may sit at its native
  height (32 or more: segmented controls, chips, steppers). Under 28 either
  way is a FAIL.
- **Primary pill:** 54 pt tall, the ground's ink on light grounds or the light
  tone on dark/saturated grounds, label 15–17 pt semibold. Press: scale 0.97 in
  140 ms.
- **Tab bar:** tinted to the ground (a slightly deeper tone), 4 tabs, custom
  stroke icons in one weight (1.8 px, round caps), active tab in full ink,
  inactive at ~62%.
- **Icons:** one family, one stroke weight. SF Symbols / Material Symbols in
  production; hand-drawn SVG strokes in mockups. Never emoji.
- **Radius scale, stated:** e.g. "pills 27, cards 16, tiles 6, Swiss = 0".
  Never mix radii without the rule.

---

## 5. Motion, in one table (detail in interaction.md)

| How often it happens | Motion |
|---|---|
| 100+ times a day (tab switch, scroll, back, keyboard) | Platform default only |
| Tens a day (press, row select, toggles) | ≤ 150 ms, near-imperceptible: scale 0.97 or a highlight |
| Occasional (state change, sheet, toast, scrubbing moments) | 200–450 ms, strong ease-out or spring |
| Rare (first run, completion, the signature) | Delight allowed: flips, tears, fills, stamps |

Name the purpose in one word (feedback, continuity, state change, delight) or
delete it. Respect reduced motion: spatial motion becomes a cross-fade.

---

## 6. Screen roles

The glance skeleton above ("hero 30–50%, no dead band") is written for the
**home / status** screen, the one people open to see where things stand. Most
screens in an app do a different job. Structure (§1) says how a screen is
built; role says how loud it is and how it is judged. A sign-in screen is a
pause before a decision; a loading screen is a beat of motion; a list is a
tool. Design and judge each screen *at its job*, never against the home
screen's checklist.

Before you design, critique or score a screen, write one line:
**role · volume · its one job** ("Entry · calm · get them signed in").

### Roles

| Role | Volume | Examples | Owes | Does not owe |
|---|---|---|---|---|
| **Home / status** | Loud | The core screen and its moments, a dashboard, an assistant at rest | As a glance: everything in §1 and SKILL.md §2, a hero that carries state, the full skeleton, no dead band. As any other structure: that structure's anatomy, complete | — |
| **Detail** | Loud hero, quiet support | A fund's holdings, a plant's history, the jar's ruler | The zoomed hero or chart leads; supporting lists, legends and footnotes sit quiet and tidy below it | A rich or decorated list |
| **Input / setup** | Medium | Relay setup, a new budget, an alarm, filters, a profile form | The instrument is the hero (a tick ruler, a dial) or the fields are perfectly ordered; one primary action pinned low, in thumb reach | Filling the space above a pinned action |
| **Entry / decision** | Calm | Sign-in, an onboarding promise, a paywall, a confirm, a permission | One promise, one action, composed space around one focal object | A tab bar, a stat row, a hero that tracks live state |
| **Transition** | Loud in feeling, light in information | Loading, importing, processing, sending, matching | Motion that shows what is happening (screenshots sweeping into a stack); one legible line saying what is happening; a way out if it can take long | Legibility of content shown as texture; a tab bar |
| **Celebration / share** | Loud | A completion, a receipt, a stamp, a year in review | The artifact someone would post | UI around it beyond one or two actions |
| **Utility** | Quiet | Lists, feeds, settings, search | Rhythm, typographic hierarchy, native controls, perfect states | A hero; filling the space below short content (a list ends where its content ends) |

Fine print (footnotes, legal, disclosures) is a *part* of a screen, not a
role: the quietest thing on it, small and grey on purpose. It owes
legibility (≥ 11 pt, ≥ 4.5:1) and a place where people expect it, nothing
more.

**Volume is not quality.** A quiet screen is held to the same 9 as a loud
one; it earns it through precision instead of spectacle.

### Every pillar, per role (never skipped, always earned)

A pillar is never "not applicable". Each role has its own version, as hard
to earn as the home-screen one. Score = 1 + sum, caps unchanged.

| Pillar | Home / status | Detail · Input | Entry · Transition · Celebration | Utility |
|---|---|---|---|---|
| **P1** Picture holds the data | The hero encodes the state (SKILL.md §2) | The chart or instrument *is* the data or the value: a radial chart of holdings, a tick ruler at 217 | The picture or motion carries the promise or the process: files sweeping into a stack *is* "importing"; the card that has arrived *is* the news | The content is the picture: type, thumbnails or glyphs with one crop logic, scannable in a second |
| **P2** Coverage → composed space | Hero 30–50%, no *dead* band > 15% (levels.md, "dead vs active") | The hero leads; the rest packs as one unit; the gap above a pinned action is layout, not leftover | Every empty area has a job you can name: it frames the focal object, it is the pause before the decision, it is the mood | Rows on a steady rhythm; groups never stretched or split; space below short content is fine |
| **P4** Skeleton → one system | The full anatomy of its structure (§1) | The same system (ground logic, type, radius scale, accent role, icon family, spacing) plus navigation chrome (back, title) | The same system; chrome that fits the place: no tab bar on sign-in or loading, progress on onboarding | The same system; native chrome and controls |
| **P7** Moment-aware | Changes with time, state, place | Reflects the current data and selection | Knows where the person is in the flow: first run or return, step 2 of 4, how long the wait is | Empty, loading, error and full states each composed |
| **P8** Signature interaction | One per app or flow, living where it means most | The input feels physical (detents and a haptic on the ruler) | The motion *is* the experience (transition); a satisfying commit (entry, celebration) | Press states and native feel |

P3 (one drawing hand), P5 (one first read), P6 (human copy) and P9 (zero
defects) read the same in every role. What the first read *is* depends on the
structure: a display moment on a glance or an instrument; the title or the
leading content, at native scale, everywhere else. A giant word that carries
no fact is decoration, in any role.

A screen never loses P8 because the signature lives elsewhere in the flow;
it loses it when it breaks the app's interaction language. Judging a still
of a motion screen (a transition, an assistant's presence)? Say so, and
judge the motion only as far as the still shows it.

### Flow rhythm

When there are several screens of one app, line them up in flow order with
their role and volume, and read them as a sequence, not a pile:

- **Peaks need valleys.** A loud screen lands because a quiet one came
  before it. Every screen at full volume is a flaw ("no rest"); every
  screen quiet is a flaw ("no peak").
- **One signature per flow,** at the moment it means most. Do not spread
  small gimmicks across every screen.
- **The system never changes:** ground logic, type, radius scale, accent
  role, icon family, spacing, motion language. Only the *volume* changes.
- **Each screen does its part.** Hero objects live where people look for
  status; calm lives where people decide; motion lives where people wait.

### Screen types

| Screen | Role | Structure | Where the level comes from | Notes |
|---|---|---|---|---|
| **Core / home** | Home | Glance, or what its job calls for | Hero object per moment, full skeleton | The whole method applies |
| **Detail** | Detail | Glance or canvas | The hero zoomed in (the jar's ruler, the route's stations), deeper data | Same ground and hand; push navigation |
| **Onboarding / sign-in** | Entry | Glance; instrument where it asks for a value | One idea per screen, a hero for the promise, short copy, progress | Vary composition between screens; skip always available; never a rating prompt |
| **Paywall** | Entry | Glance | Show the product working (a widget preview, the hero in a paid state), the plan, the trial timeline (today → reminder → charge) | Honest pricing; restore purchase; no dark patterns |
| **Loading / processing** | Transition | Glance | Motion that shows what is happening, one status line, an estimate or a way out | A beat, not a destination; keep it short |
| **Empty / first run** | Home (empty state) | The structure it will have when full | The hero in its empty state (an empty jar with a painted line), one action that fills it | Says exactly how to fill it |
| **Library / inbox / search** | Utility | List | Rhythm, typography, a leading glyph or thumbnail with one crop logic | No illustrated hero; P1 is the content itself |
| **Feed** | Utility | Feed | Whole items, the newest first, one picture logic | The title bar stays small |
| **Settings / forms** | Utility · Input | List; instrument for one value | Native controls, grouped rows, perfect states | No illustrations. Same ground, type, radius and accent |
| **Chat / assistant** | Home | Conversation (the idle presence is a glance) | A material presence (the orb) for idle/thinking/speaking, suggestion chips, composer | The presence encodes state; the calm field around it is part of the hero |
| **Map / navigation** | Home | Canvas | Time and distance remaining as the first read, map as the subject | CarPlay-grade legibility |
| **Player / recorder** | Home · Input | Instrument | An instrument hero (reel, meter, keys) | Hardware buttons with clear pressed states |
| **Celebration / share** | Celebration | Glance | The artifact (a stamp, a receipt, a postcard) the user would post | Distribution lives here |

Every screen still answers: what does the person do here, what is its role,
what is the one thing to see first, what is the one action, and does it look
like the same app?
