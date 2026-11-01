# Skill-5 · Level Nine

A Claude Code skill that teaches an AI to design mobile app screens at
**9/10**: the level of Apple Design Award and top-of-Dribbble work, instead
of the clean, interchangeable 4–6 that AI usually produces.

It does this in three ways:

1. **It gives the AI a calibrated 1–10 ladder**, so it always knows what level
   it is working at and what exactly blocks the next point.
2. **It gives it a method** that works for any app: find the app's *moments*,
   draw one hero picture per moment that *shows the data*, put it inside a real
   app skeleton, add one signature interaction, then render, audit and score
   until it reaches 9.
3. **It gives it tools**: an audit script that screenshots every screen and
   catches the defects that cap designs at 6, a working starter template, and
   calibration screenshots of one project at 5.5, 8.5 and 9.

The skill was written from a real climb: a train-ticket app designed in four
directions that scored 5.5–6.5 on the first pass, 8–8.5 after a rethink, and
8.5–9 after a detail and signature pass. Every lesson, bug and number in it
comes from that work. See `references/case-study.md` and `examples/`.

---

## Install

```bash
git clone https://github.com/ethan20224/Skill-5.git ~/.claude/skills/skill-5
cd ~/.claude/skills/skill-5 && npm install     # only needed for the audit script
```

The audit script uses your installed Google Chrome (or Chromium) through
`playwright-core`. Node 18+.

## Use

In Claude Code, type `/skill-5` followed by what you want, for example:

- `/skill-5 design the home screen for a budgeting app`
- `/skill-5 redesign this screen` (attach screenshots of your existing app)
- `/skill-5 rate my design` (attach screenshots)

It also triggers on its own for requests like "design an app screen",
"make it premium", "not generic", "level 9", or "critique my design".

Run the audit on any HTML mockup directly:

```bash
node ~/.claude/skills/skill-5/scripts/audit.mjs path/to/mockup.html --out audit/r1
```

---

## What is inside

| Path | What it is |
|---|---|
| `SKILL.md` | The skill: ladder, nine pillars with score caps, operating protocol, the 10-step method, redesign mode, hard rules |
| `references/levels.md` | Every level in depth, how to score, anchor references, common misjudgments, how to judge a reference gallery |
| `references/case-study.md` | The 5.5 → 9 climb, round by round, with the bugs each round found |
| `references/hero-objects.md` | Finding moments, the three tests, seven hero modes, 60+ worked examples by category, binding a picture to data |
| `references/drawing-hands.md` | Tone ramps, ten illustration styles with SVG/CSS recipes, the detail pass, when to use image generation |
| `references/anatomy.md` | The shared screen skeleton, type, colour, chrome, motion frequency, screen types |
| `references/interaction.md` | Signature interactions with exact code and timings: hold-to-confirm, split-flap, tilt + sheen, drag to tear, fill, stamp, breathing presence |
| `references/copy-and-data.md` | Voice, believable numbers, labels, banned phrases |
| `references/audit.md` | The render/audit/score loop, the defect catalog, the critic brief, stop rule, report template |
| `references/native.md` | Building it for real in SwiftUI, React Native/Expo, Flutter and Compose; navigation; production verification |
| `scripts/audit.mjs` | Screenshots every phone screen and scans for clipped/colliding text, contrast, tiny text, emoji, broken buttons, dead space, hero coverage, type scale, fonts that failed to load, and more |
| `assets/template.html` | A working, audit-clean starter: a three-moment water tracker built with the method |
| `examples/` | Calibration screenshots: `r1-*` (5.5–6.5), `r2-*` (8–8.5), `r3-*` (8.5–9), the template render, and the full source of an 8.5-level screen set |

---

## The nine pillars (how a design is scored)

Each pillar scores 0, 0.5 or 1. Score = 1 + the sum, then caps apply.

Role first: every screen is judged at its job (home, detail, input, entry,
transition, celebration, utility). The pillars below are worded for the home
screen; each role has its own version of every pillar, never skipped, and
every flaw must pass an intent check (taste can be deliberate, function
never is).

1. **The picture holds the data** (hide the numbers: can you still read the state?)
2. **Coverage**: the hero fills 30–50% of the screen, no dead bands (space with a job is not dead)
3. **One drawing style, with character**
4. **One system with real chrome**: on home screens, status bar, meta row, hero, headline, three stats, one primary action, tab bar
5. **Typographic nuance**: one display moment, small units and decimals, tabular figures
6. **Human, specific copy**
7. **Moment-awareness**: the screen changes with the user's moment
8. **One signature interaction**, fully built
9. **Zero defects, proven** by rendering and inspecting every state

Caps: emoji icons or AI gradients cap at 4; any audit failure caps at 6; no
hero picture caps at 6.5; unrendered work caps at 7; a category-default
structure caps at 7.5; directions that are only recolours cap at 8.

---

## Honest limits

- The method raises any capable model a long way, but output still depends on
  the model's taste. Strong models should reach 8–9; weaker ones improve but
  may stop around 7–8.
- Flat, engraved, geometric and "lit hardware" illustration styles reach 9 in
  code. Soft 3D, glass and painterly styles top out around 8 without an image
  model or an illustrator.
- A 10 needs illustrator-grade art, motion tuned on a real device, and an idea
  the category has never shipped. The skill says so rather than claiming it.
- The mockup template is iPhone-shaped. Android, iPad, Watch and widgets are
  covered in principle and in `native.md`, but not with dedicated templates.
