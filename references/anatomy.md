# Anatomy: the shared skeleton, type, colour and screen types

P4 (system skeleton + real chrome) turns a set of posters into an app. P5 is
typographic nuance. Both live here. Values assume an iPhone 390 × 844 pt
canvas; scale proportionally for others.

---

## 1. The core-screen skeleton

Top to bottom. Every core screen in the app uses the same slots, even when a
slot's content changes completely between moments.

| Slot | Height | Content | Rules |
|---|---|---|---|
| **Status bar** | 54 | Time (17 pt semibold, tabular), signal, Wi-Fi, battery; Dynamic Island 124 × 36 at top 11 | The clock **matches the content's moment** (13:24 on the platform screen). Icons in the ground's ink |
| **Meta row** | 44 | Left: small context line (13 pt; date · what · where, the second half at 60–70% ink). Right: round icon button 36 pt (more, share, close) | One line. "Sat 3 Oct · week 9 of 15". Not a greeting |
| **Hero** | 300–360 | The hero object / scene / artifact / instrument (hero-objects.md) | 30–50% of the screen. Bleed off at least one edge where the hand allows |
| **Headline block** | ~130 | Cap label (11 pt, tracked +0.1em), display line (56–110 pt), one or two sentences (15 pt, 1.4 leading) | One display moment. Small units and decimals |
| **Stat row** | ~56 | Three columns: label (11–12 pt) above value (20–26 pt, tabular) | Exactly three. Values short enough not to wrap at the narrowest phone |
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
7. **Dark mode** is a second design, not an inversion: lower chroma on large
   fields, lift the ink to off-white, keep the accent's role.

---

## 4. Chrome and controls

- **Real status bar and home indicator** in every mockup frame. In code, they
  are the system's; respect safe areas.
- **Round icon buttons** (36–44 pt) for top-right actions, on a 7–35% ink tint
  of the ground.
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

## 6. Screen types

| Screen | Where the level comes from | Notes |
|---|---|---|
| **Core / home** | Hero object per moment, full skeleton | The whole method applies |
| **Detail** | The hero zoomed in (the jar's ruler, the route's stations), deeper data | Same ground and hand; push navigation |
| **Onboarding** | One idea per screen, a hero for the promise, short copy, progress | Vary composition between screens; skip always available; never a rating prompt |
| **Paywall** | Show the product working (a widget preview, the hero in a paid state), the plan, the trial timeline (today → reminder → charge) | Honest pricing; restore purchase; no dark patterns |
| **Empty / first run** | The hero in its empty state (an empty jar with a painted line), one action that fills it | Says exactly how to fill it |
| **List / feed** | Rhythm, typography, a leading glyph or thumbnail with one crop logic | No hero; quality comes from P4–P6 and P9 |
| **Settings / forms** | Native controls, grouped rows, perfect states | No illustrations. Same ground, type, radius and accent |
| **Chat / assistant** | A material presence (the orb) for idle/thinking/speaking, suggestion chips, composer | The presence encodes state |
| **Map / navigation** | Time and distance remaining as the display moment, map as the hero | CarPlay-grade legibility |
| **Player / recorder** | An instrument hero (reel, meter, keys) | Hardware buttons with clear pressed states |
| **Celebration / share** | The artifact (a stamp, a receipt, a postcard) the user would post | Distribution lives here |

Every screen type still answers: what is the one thing to see first, what is
the one action, and does it look like the same app?
