# Render, audit, score, climb

P9 is "zero defects, proven". Every round of rendering in the case study found
bugs that code review had missed, in code that looked correct. This file is
the loop, the defect catalog, the critique protocol and the stop rule.

---

## 1. The loop (every round)

1. **Render every state** as its own screen on one page (a state sheet) with
   `data-screen="moment-name"` on each phone screen.
2. **Run the audit:**
   ```bash
   node ~/.claude/skills/skill-5/scripts/audit.mjs mockup.html --out audit/r1
   ```
   Fix every FAIL. Answer every WARN (fix it, or one line on why it is
   deliberate, e.g. "10 px tab labels: iOS standard").
3. **Open every PNG at full size**, one by one, not only the sheet. Look for
   what no script sees: a drawing that does not read, a weak line, a hero that
   does not change between moments, crowding, rhythm breaks, anything that
   looks "AI".
4. **Score** the nine pillars (levels.md procedure), apply caps.
5. **Compare** with an anchor and write where it loses.
6. **Climb:** make the change with the most points per hour, render into a new
   folder (`r2`, `r3`), compare side by side.

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

---

## 3. The critic (fresh eyes)

If you can spawn one agent, spawn **one** critic for the whole job. Brief it:
- the concept, the moments and hero objects, the default refused
- the nine pillars and caps from SKILL.md §2, and levels.md
- the PNG paths (each screen, plus the sheet) and the anchor images (`examples/r3-*-L9.png`)
- the instruction: "Score each pillar 0 / 0.5 / 1 with one line of evidence.
  Apply caps. Name the single biggest blocker. Be harder than feels fair. Do
  not suggest new features; judge what is there."

Wait for its scores before editing. Without an agent, score yourself, then
subtract 1 from any pillar you scored without opening the PNG.

---

## 4. Stop rule

- **Done:** score ≥ 9, zero FAILs, every WARN answered, every state inspected.
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
| P9 Zero defects, proven | | | FAIL/WARN counts |
| **Score (after caps)** | | | |

What changed since last round: …
How it was checked: <real device / simulator / local renderer>, every PNG opened
Not verified: <device feel, haptics, fonts elsewhere, …>
Biggest blocker to +1: … (who or what could supply it)
```
