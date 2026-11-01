# Case study: one ticket screen, 5.5 → 9

The brief: a mobile screen showing everything on a train ticket. Not generic.
Interactive. Four visual directions. Trip: Nozomi 37, Tokyo 13:33 → Kyoto
15:45, car 7, seat 12E (the Mt Fuji side).

Screenshots of every round are in `examples/`. Open them in order while you
read; the point is to *see* each level.

---

## Round 1 — 5.5 to 6.5: the anti-slop plateau

`examples/r1-splitflap-L6.png`, `r1-poster-L6.5.png`, `r1-cardstock-L5.5.png`,
`r1-routemap-L5.5.png`

**What was good.** A real idea: the ticket's job changes over time (leave →
platform → gate → on board → arrive), so the screen morphs through five moments
with a scrubber. Four directions that genuinely differed in ground and type: a
dark split-flap instrument, a vermilion travel poster, a paper card stock, a
Swiss route map. Satisfying interactions: hold-to-show QR, a platform-change
flip, a live countdown, a tilting foil ticket, a tear-off stub. Specific copy:
"Queue at floor marker 7", "Seat 12E faces it until 14:19".

**Why it scored only 5.5–6.5** (scored against a 9-level reference strip):
1. **Empty middles.** Type at the top, data at the bottom, a dead band of
   ~200 px between. The biggest gap.
2. **No app chrome.** No status bar, no tab bar, no primary pill. Posters in
   phone frames.
3. **Pictures decorated or were missing.** A sun and hills (B), a thin line
   Fuji (A, C), a blue block (D). None encoded state.
4. **A real defect.** The "Hold to show ticket" button rendered as bare text in
   all four directions, because `.sf button { background: none }` (specificity
   0,1,1) beat `.hold { background: … }` (0,1,0). Invisible until rendered.
5. Clipped text in B (the countdown ran off the edge at expanded width) and a
   label collision in D.

**Lesson:** a strong concept, good type and good interactions still land at 6
if the screen has no picture carrying the data, no chrome, and one bug.

---

## The rethink — what the 9s actually do

Studying the reference strip screen by screen produced the six (later nine)
pillars. The decisive one: **the picture holds the data.** The jar is filled
to the money left; the track is the run; the house's lights are the routine.
Applied to the ticket, each moment got a hero object:

| Moment | Hero object (encodes state) | Big type | 3 stats | Action |
|---|---|---|---|---|
| 13:08 Leave | Station clock with a wedge = minutes left, shrinking live | `25:00` | Platform · Car · Seat | Directions to platform |
| 13:24 Platform | Train side view, *your* door lit, you at floor marker 7; platform sign flips 16 → 18 | `Car 7` | Doors · Leaves in · Marker | Show ticket |
| 13:29 Gate | The ticket as a stamp-edged object, QR hidden until held | `Ready` → `Tap in` | Passenger · Leaves in · Seat | Hold to board |
| 14:12 On board | The view through your window: Fuji, poles whipping past | `Mt Fuji` | Next stop · Arrive · Left | Set arrival alert |
| 15:40 Arrive | Same window, golden hour, Tō-ji pagoda | `Kyoto` | Weather · Transfer · Arrive | Directions + "Kyoto stamp saved" toast |

Plus a shared skeleton: status bar with a clock matching the moment, meta line
with a round button, hero (40% of the screen), headline, 3-stat row, primary
pill + text action, tab bar.

---

## Round 2 — 8 to 8.5: distinctive and complete

`examples/r2-poster-L8.5.png`, `r2-splitflap-L8.png`

The poster direction was built first and the others derived from its structure
with their own palettes, typefaces and drawing hands (flat tone-on-tone; lit
hardware in a dark cabin; engraved hatching on paper; Swiss geometry on cobalt).

**Jump: +2 points**, almost entirely from P1 + P2 + P4. Dead bands went from
~25% to 5–8% of the screen height; hero coverage from ~0% to ~39%.

**Bugs caught by rendering** (each would have shipped from code review):
- Tab-bar labels rendered at 15 px instead of 10 px: the same reset-specificity
  bug as round 1, on a different element.
- `285 km/h` wrapped onto two lines in a 3-column stat row.
- Deriving the paper direction by colour-mapping inverted the illustration: the
  "cream" token meant *ink* for text but *paper* for the clock face, so the
  clock rendered solid black. Tokens need roles, not just values.
- Status-bar icons vanished in the same mapping (filled with the paper colour).
- Display type at `line-height: .86` let descenders ("y" in Ready, "j" in Fuji)
  crash into the line below.
- An invented fact slipped into copy ("Gate 3 is quietest"). Removed: never
  invent claims about the real world to fill space.

**Why not 9 yet:** the four directions shared the same five scenes (skins), the
drawings were clean primitives without character, and two features from round
1 (the tilting foil ticket, the flip board) had been lost in the restructure.

---

## Round 3 — 8.5 to 9: signature and detail

`examples/r3-splitflap-L9.png`, `r3-cardstock-L9.png`, `r3-poster-L8.5.png`,
`r3-routemap-L8.5.png`

1. **A unique signature hero per direction** (P8, removes the skins cap):
   - split-flap: a real departure board (your row outlined, other trains below,
     every character flipping in with a 28 ms stagger)
   - card stock: the tilting holographic ticket with guilloche, and a stub you
     drag to tear (velocity or distance commits)
   - route map: the route drawn to scale with time, a pulsing marker, a dashed
     line out to a geometric Fuji
   - poster: kept its scenes, gained a live red second hand
2. **Detail pass** (P3): passengers' heads in the train windows, "東京 TOKYO" on
   the clock face, ridges and a cloud on Fuji, Shizuoka tea rows drifting past,
   Kyoto Tower and three birds at arrival, a red 検 inspection seal on the
   ticket.
3. **Defects** (P9): clock lettering moved off the hands' path, a floating
   pantograph removed, engraved ridges recoloured, scrubber label contrast,
   a missing fare on the stub (a template value that was never defined).

**The audit script, run afterwards on the "finished" 8.5 poster, still found a
2.85:1 contrast failure** on a 60%-opacity meta line. Lesson: opacity-dimmed
text on saturated grounds fails contrast more often than you expect.

---

## What generalises

1. Concept and taste get you to 6. **The picture carrying the data** is the
   single biggest step after that.
2. Real chrome and a shared skeleton turn posters into an app.
3. Every round of rendering found bugs that code review missed. Every one.
4. Derived variants need their own signature hero, or they are skins.
5. Detail is not decoration: one piece of lettering, one living thing, one
   secondary motion per scene is what makes a drawing feel made.
6. Score honestly against an anchor, every round. The honest score was always
   1.5–2 points below the hopeful one, and naming the gap is what closed it.
