# Render, audit, score, climb

P9 is "zero defects, proven", and the Works gate (SKILL.md §2) is where the
proof starts. Every round of rendering in the case study found bugs that code
review had missed, in code that looked correct. This file is the loop, the
defect catalog, the blind read, the critic and the stop rule.

---

## 1. The loop (every round)

1. **Render every state** as its own screen on one page (a state sheet) with
   `data-screen="moment-name"` on each phone screen, its role in `data-role`
   (home, detail, input, entry, transition, celebration, utility; home is the
   default) and its structure in `data-archetype` (glance, list, feed,
   instrument, canvas, conversation; glance is the default). Include the
   core screen's empty, loading and error states.
2. **Write what you expect a stranger to read**, one line per screen: app ·
   the state right now · the one thing to tap next. Before the audit, so the
   answers cannot bend it.
3. **Run the audit:**
   ```bash
   node ~/.claude/skills/skill-5/scripts/audit.mjs mockup.html --out audit/r1
   ```
   It runs seven passes and puts the gate table at the top of `report.md`:

   | Pass | What it does | Its findings |
   |---|---|---|
   | base | The design as drawn; contrast measured on the rendered pixels | FAIL / WARN |
   | small · large | Every screen forced to 375 × 667 and 440 × 956 | FAIL / WARN, same as base |
   | dark | `prefers-color-scheme: dark` | Contrast and lost fills: FAIL / WARN |
   | stress | Every string 35% longer, or swapped for its `data-stress` | WARN |
   | text-xl | Body text × 1.35 (Dynamic Type XL); display type holds, bars do not scale | WARN |
   | press | Presses controls for a pressed state; drives every `data-interaction` and saves a four-frame strip | WARN for a silent control, FAIL for an interaction that changes nothing |

   Fix every FAIL, in every pass. Answer every WARN (fix it, or one line on
   why it is deliberate, e.g. "segmented control at native height"). The
   usual fixes: a flexible hero slot and one scroll region (small, text-xl);
   a wrapping row instead of a rigid grid (stress); a lighter tone instead of
   opacity, or a scrim under type on a picture (contrast); a second set of
   tokens (dark). Check every declared role and structure against what the
   screen actually does: a status screen marked `entry` to escape the
   dead-band check is a defect, and so is a `data-space` reason that fails
   the fill test. `--quick` runs the base pass alone, for a look mid-build;
   it never passes the gate.
4. **Run the blind read** (§3) with the files the audit wrote.
5. **Open every PNG at full size**, one by one, not only the sheet: the
   screens, the pass sheets (`sheet-small.png`, `sheet-dark.png`, …) and
   every `interaction-*.png` strip. Look for what no script sees: a drawing
   that does not read, a weak line, a hero that does not change between
   moments, a wipe that garbles a label half way, crowding, rhythm breaks,
   anything that looks "AI". Judge each screen at its role (anatomy.md §6),
   and the flow's pacing as a whole.
6. **Score** the nine pillars (levels.md procedure), apply caps.
7. **Compare** with an anchor and write where it loses.
8. **Climb:** make the change with the most points per hour, render into a new
   folder (`r2`, `r3`), compare side by side.

After changing `audit.mjs` or a starter, run `npm test` in the skill folder:
it checks the audit against 22 planted mistakes and both starters.

Screenshots taken mid-animation look blurred or faded; the audit script
freezes animations and timers before shooting. With other tools, wait for
entrances to finish (≥ 1 s) or take the shot twice.

---

## 2. The defect catalog (all of these happened in real work)

| Defect | How it hides | Catch / fix |
|---|---|---|
| **Primary button renders as bare text** | A reset like `.app button { background:none }` (0,1,1) beats `.pill { background:… }` (0,1,0) | Resets in `:where()`; audit `no-affordance` |
| **Font sizes ignored** (tab labels at 15 px instead of 10) | Same reset: `font: inherit` beats `.tab-label { font-size }` | Same fix; look at tab bars in every shot |
| **Descenders crash into the next line** | Display type at line-height < 0.9 with 8 px below | ≥ 12 px clearance; audit `collision` |
| **Display text clipped at the edge** | Expanded/condensed width guessed, not measured | Check the longest string at 375 px; audit `offscreen`/`clipped` |
| **A stat wraps** (`285 km/h` on two lines) | 3 columns at 20 pt in 105 px | Shorter values or a different stat |
| **Labels collide in absolute layouts** | Positions computed for one font | Audit `collision`; leave 4 px between baselines |
| **Contrast fails on dimmed text** | 60% opacity ink on a saturated ground (2.85:1) | Use a lighter tone, not opacity; audit `contrast` |
| **Theme derivation inverts art** | A colour token meant ink in text, paper in art | Name tokens by role (drawing-hands.md §1) |
| **Icons vanish after re-theming** | Status-bar and menu glyphs filled with the ground colour | Check chrome in every variant |
| **Template value undefined** | A field referenced in markup never set in the data | Audit `template-junk`; the fare was silently missing |
| **Toast covers a label** | Transient overlay captured on a still | Mark transient UI `data-audit-ignore` or check timing |
| **Invented facts in copy** | Filler that sounds plausible | copy-and-data.md §2 |
| **Font fell back silently** | The web font never loaded | Audit `font-not-loaded` |
| **Elements in SVG lose properties** | e.g. `rx` reset to 0 on an `<ellipse>` by a broad replace | Scope edits to the element type |
| **Variant regressions** | A fix in one direction never reached the others | Re-render *all* directions every round |
| **Words vanish into the picture** | Type laid over a hero; fine on the ground, gone where it crosses a light shape | Audit `contrast` (measured on the pixels); a scrim, or move the line |
| **Everything falls off a small phone** | Slots with fixed heights; the action row and tab bar end up below the screen | Audit small pass; a flexible hero and one scroll region |
| **A row wider than its list** | `all: unset` on buttons also unsets `box-sizing`, so `width: 100%` plus padding overflows | `box-sizing: border-box` in the reset; audit `offscreen` |
| **A label covered by a toast or a sheet** | Transient UI drawn over a still | Audit `hidden-text`; place the toast clear of what it announces |
| **A hold that garbles its label** | The fill wipes in a second label over the first: half of each shows | Same label in the fill, in the other colour; seen in the interaction strip |
| **A custom input that is slower than the plain one** | A stepper or dial for a value with a wide range (a birth year: sixteen taps) | Count the taps; let a tap on the value open the picker or keyboard |
| **A list dressed as a glance** | The home skeleton reused: a giant count where the rows should be | Structure from the job (anatomy.md §1) |

---

## 3. The blind read, then the critic

**The blind read comes first, and it is Works gate line W1.** You cannot test
whether a stranger understands a screen, because you wrote it. A briefed
reviewer cannot either. So the first reader gets pictures and nothing else.

The audit writes what you need: `blind/notext-NN.png` (each screen with every
word and number removed), `blind/screen-NN.png` (each screen as shipped, under
a name that gives nothing away) and `blind-read.md`, which holds the two
messages word for word.

1. Have your one-line expectation per screen written (the loop, step 2).
2. Give a **fresh reader** the first message and the `notext` files. A fresh
   agent with no brief, no concept and no history; or a person who has not
   seen the work. Never the critic below, and never yourself.
3. When it has answered, give **the same reader** the second message and the
   `screen` files.
4. Read the answers against your lines:
   - It names the app, the state and the next tap on every screen: **Clear**
     passes.
   - It misnames the state or the next tap on a home, detail or entry
     screen: the gate fails (cap 6). Change the screen. Do not explain it to
     the reader and ask again; a second reader must be as fresh as the first.
   - From the pictures alone it reads the state roughly right (about half
     full, nearly time, three of five done): P1 may score 1 on that screen.
     "Cannot tell", or wrong: P1 is 0.5 at most there. (List, feed and
     conversation screens skip this: their picture is their content.)
   - Anything it could not read, could not tell was tappable or did not
     understand is a finding: fix it or answer it in one line.
5. Put the reader's own words in the report. If no fresh reader is available,
   say so: the line is not run, and the score is capped at 8.

**Then the critic.** If you can spawn one more agent, spawn **one** critic for
the whole job. It is briefed, because it judges craft against intent; that is
why it cannot also be the reader. Brief it:
- the concept, the moments and hero objects, the default refused
- each screen's role, volume and job, in flow order (anatomy.md §6)
- the nine pillars and caps from SKILL.md §2, and levels.md (including
  "Reading intent")
- the PNG paths (each screen, the pass sheets, the interaction strips), the
  gate table from `report.md`, the blind reader's answers, and the anchor
  images (`examples/r3-*-L9.png`)
- the instruction: "Name each screen's role first, then score each pillar
  0 / 0.5 / 1 in that role's version, with one line of evidence. Run the
  intent check on every flaw before you list it. Apply caps exactly; a role
  or an intent never lifts one. Name the single
  biggest blocker. Be harder than feels fair on execution and function;
  never mark down a deliberate choice that does its job, and never excuse a
  function failure as intent. Do not suggest new features; judge what is
  there."

Wait for its scores before editing. Without an agent, score yourself, then
subtract 1 from any pillar you scored without opening the PNG.

---

## 4. Stop rule

- **Done:** the Works gate passed on every line (zero FAILs in every pass,
  every WARN answered, the blind read matching), score ≥ 9, every state
  inspected.
- **Plateau:** two consecutive rounds gain < 0.5. Stop and report what would
  move it (an illustrator, generated art, real photography, a device test).
- **Budget:** four rounds maximum unless the user asks for more.
- **Never:** stop because it "looks fine". Stop when you cannot find a flaw at
  full size, and say how you looked.

---

## 5. Report template

```
## <App> · <screen/flow> · round N

Moments → heroes
- <moment>: <hero object> (encodes <what>)
- …
Default refused: <category default>
Screens: <screen>: <structure · role · volume> … · rhythm: <one line on the flow's pacing>

| Works gate | Result | Evidence |
|---|---|---|
| W1 Clear | pass / fail / not run | the reader's words vs. what was expected |
| W2 Readable and tappable | | base pass: FAIL/WARN |
| W3 Fits | | small and large passes |
| W4 Real content | | stress and text-xl passes; states drawn |
| W5 Appearance | | dark pass, or the stated reason for one appearance |
| W6 Answers a finger | | press pass; strips opened; taps counted |

| Pillar | r1 | rN | Evidence |
|---|---|---|---|
| P1 Picture holds the data | | | |
| P2 Coverage | | | dead band %, hero % (audit) |
| P3 One hand, character | | | |
| P4 Skeleton + chrome | | | |
| P5 Type nuance | | | type ratio (audit) |
| P6 Human copy | | | the best line |
| P7 Moment-aware | | | |
| P8 Signature interaction | | | |
| P9 Zero defects, proven | | | FAIL/WARN counts, per pass |
| **Score (after caps)** | | | |

What changed since last round: …
How it was checked: <real device / simulator / local renderer>, every PNG opened
Not verified: <device feel, haptics, fonts elsewhere, …>
Biggest blocker to +1: … (who or what could supply it)
```
