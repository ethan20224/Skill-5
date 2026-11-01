# Drawing hands: one illustration language per app

P3 asks for one drawing hand with character. A "hand" is a complete rule set
(shapes, tones, line, texture, light) that every picture in the app obeys.
Mixed hands read as assembled from stock. One hand, applied with care, reads
as authored.

---

## 1. The tone ramp (do this before drawing anything)

Every hand except photo-led builds its pictures from the **ground's own
tones**, plus ink and at most one accent. Derive the ramp in OKLCH so steps
feel even:

| Role | From the ground (L = lightness) | Use |
|---|---|---|
| `ground` | L | Screen background, sky behind scenes |
| `tone-1` (shadow) | L − 0.08, chroma slightly up | Offset shadows, far hills, card backs |
| `tone-2` (deep) | L − 0.18 | Mid shapes, frames, silhouettes |
| `tone-3` (darkest) | L − 0.30, chroma down | Foreground, ground planes, text-on-light |
| `light` | L + 0.12, chroma down | Highlights, sun, snow, paper |
| `ink` | near-black or near-white tinted to the ground hue | Type, hands, key lines |
| `accent` | one hue, used where state lives (the wedge, the lit door) | |

Example (vermilion poster): ground `#B8321C`, tone-1 `#8E2414`, tone-2
`#7A1F10`, tone-3 `#4A130B`, light `#F2A27A`, ink `#FFF1DE`, accent `#E0573A`.

**Name tokens by role, not by colour.** "cream" meant *ink* for text but
*paper* for a clock face in one project; deriving a light variant by
swapping values turned the clock face solid black. Roles (`ink`, `paper`,
`shadow`) survive re-theming; colour names do not.

---

## 2. Ten hands

### 1. Flat tone-on-tone poster
*Railway posters, Ref "Big Monstera".* Big flat silhouettes in 3–5 tones of
the ground, hard offset shadows, no outlines, one light shape (sun, snow).
- **Build:** layered `<path>`s back to front (far → near, light → dark), a
  duplicate shape offset 10–12 px in `tone-1` for the poster shadow.
- **Character:** one detail per scene (lettering on an object, a figure, smoke).
- **Pitfall:** too few layers looks like clip art; aim for 4–6 depth planes.

### 2. Engraving / banknote
*Banknotes, stamps, field guides.* Paper ground, tone made by hatch density, a
single ink plus one spot colour.
- **Build:** three SVG patterns (dense, medium, light hatch) at 45° and −30°,
  horizontal lines for sky, solid ink only for the darkest masses.
  ```html
  <pattern id="eD" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="3.4" height="3.4" fill="var(--paper)"/><rect width="1.9" height="3.4" fill="var(--ink)"/></pattern>
  <pattern id="eL" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
    <rect width="5" height="5" fill="var(--paper)"/><rect width=".8" height="5" fill="var(--accent)"/></pattern>
  <pattern id="eS" width="6" height="5" patternUnits="userSpaceOnUse">
    <rect width="6" height="5" fill="var(--paper)"/><rect y="4.2" width="6" height=".6" fill="var(--accent)" fill-opacity=".55"/></pattern>
  ```
- **Character:** guilloche waves (procedural sine paths), a seal, a serial number.
- **Pitfall:** hatch too fine disappears at 1×; keep line pitch ≥ 3 px.

### 3. Swiss geometry
*Railway signage, Vignelli.* Primitives only (circle, triangle, rectangle),
square corners everywhere, strict grid, one signal colour.
- **Build:** set every `rx` to 0 except true circles; Fuji is a triangle with a
  notched white cap; a train is a bar with window rectangles.
- **Character:** data drawn to scale (a route whose spacing is proportional
  to time). Label it: "To scale with time".
- **Pitfall:** sterile without one scale move (a giant numeral) or one warm detail.

### 4. Lit hardware / instrument
*Departure boards, Flighty, Teenage Engineering.* Dark ground, objects lit from
inside, one signal colour (sodium yellow, amber), grain.
- **Build:** split-flap tiles (`linear-gradient(180deg, #2C2D26 50%, #212219 50%)`
  with a 1 px seam), a soft radial lamp glow at 10% alpha, a 3 px dot grain at
  6% opacity, the object bright against the dark (a daylight window in a dark
  cabin).
- **Character:** characters flip in with a 28 ms stagger; status dots breathe.
- **Pitfall:** sci-fi HUD (cyan glows, scan lines). Real instruments are calm.

### 5. Risograph two-ink
Two spot inks that overprint (multiply), slight misregistration (1–2 px
offset), grain.
- **Build:** shapes in ink A and ink B with `mix-blend-mode: multiply`, a
  duplicate offset by 1.5 px, an SVG `feTurbulence` grain at low opacity.
- **Pitfall:** more than two inks breaks the illusion.

### 6. Paper-cut layers
Stacked flat shapes with soft drop shadows that imply depth.
- **Build:** each plane gets `filter: drop-shadow(0 4px 6px rgba(ground-dark, .35))`;
  lighter planes in front.
- **Pitfall:** shadows on everything flatten the depth; shadow only between planes.

### 7. Line + spot
A single-weight line drawing (1.5–2 px, round caps) with one flat spot colour
offset from the line.
- **Build:** strokes in `ink`, a spot shape in `accent` shifted 4–6 px so it
  does not register perfectly.
- **Pitfall:** thin lines alone read as wireframes (this capped one design at
  6). The spot fill is not optional.

### 8. Soft clay / toy (material)
Chunky rounded objects with inner highlights and soft contact shadows; the
3D-stars and glass-ring pattern.
- **Build (CSS orb):**
  ```css
  .orb { width: 140px; aspect-ratio: 1; border-radius: 50%;
    background:
      radial-gradient(circle at 32% 28%, rgba(255,255,255,.9) 0 6%, rgba(255,255,255,0) 22%),
      radial-gradient(circle at 70% 75%, rgba(0,0,0,.35), rgba(0,0,0,0) 55%),
      radial-gradient(circle at 50% 50%, var(--tone-2), var(--tone-3) 70%);
    box-shadow: 0 30px 40px -18px rgba(0,0,0,.45), inset 0 -10px 24px rgba(0,0,0,.35); }
  ```
  Animate a 4–6 s "breathing" scale (1 → 1.03) for an idle assistant; ripple
  on speak.
- **Pitfall:** CSS clay tops out around 8. For 9–10, generate the object with
  an image model (§5).

### 9. Isometric diorama
A small world at 30° (rooms, streets), for home, city, logistics.
- **Build:** draw on a skewed grid (`transform: rotate(30deg) skewX(-30deg) scaleY(.864)`)
  or plot iso coordinates by hand; three faces per block in three tones.
- **Pitfall:** detail explosion. Keep it to one block of the world.

### 10. Photo-led
Real photography as the hero: editorial crops, polaroids, collage.
- **Build:** fixed aspect ratios, one crop logic, a scrim or fade wherever text
  sits on a photo (bottom-up gradient to the ground, ≥ 4.5:1 for text).
- **Pitfall:** only with photos you actually have. Never grey boxes or unverified URLs.

---

## 3. SVG cookbook

**Hero canvas.** Size the SVG to the hero slot (e.g. `viewBox="0 0 390 330"`,
full bleed). Draw past the edges; let the screen clip.

**Windows and frames.** Clip a scene to a shape:
```html
<defs><clipPath id="win"><rect x="38" y="22" width="314" height="278" rx="40"/></clipPath></defs>
<rect x="22" y="6" width="346" height="310" rx="54" fill="var(--tone-2)"/>   <!-- frame -->
<g clip-path="url(#win)"> …sky, mountain, hills, poles, glass reflection… </g>
```
Add a glass reflection (a pale diagonal band at 9% opacity) and a pulled-up
blind (3 thin lines) for realism.

**Procedural detail** (generate in JS, not by hand):
```js
// 60 clock ticks, every 5th heavy
for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, big = i % 5 === 0;
  const r1 = big ? 96 : 106, r2 = 113;
  ticks.push(`<line x1="${cx + r1 * Math.sin(a)}" y1="${cy - r1 * Math.cos(a)}" x2="${cx + r2 * Math.sin(a)}" y2="${cy - r2 * Math.cos(a)}" stroke-width="${big ? 5 : 2}"/>`); }
// guilloche: overlapping sine waves
for (let w = 0; w < 12; w++) { let d = '';
  for (let x = 0; x <= 300; x += 6) d += (x ? 'L' : 'M') + x + ' ' + (46 + 30 * Math.sin(x / 26 + w * .45) * Math.cos(x / 96 - w * .2)).toFixed(1);
  waves.push(d); }
// pagoda: five tiers narrowing upward, upturned roof tips
for (let t = 0; t < 5; t++) { const w = 96 - t * 14, y = 236 - t * 26, l = cx - w / 2, r = cx + w / 2;
  roofs.push(`M${l} ${y} L${l + 12} ${y - 8} L${r - 12} ${y - 8} L${r} ${y} L${r - 9} ${y + 3} L${l + 9} ${y + 3}Z`); }
```

**Seamless parallax loops.** Duplicate the layer content at exactly one period
and translate by that period, linear, infinite:
```css
.poles { animation: whip 760ms linear infinite; }      /* near layer: fast */
.hills { animation: drift 16s linear infinite; }        /* far layer: slow */
@keyframes whip  { to { transform: translateX(-160px); } }  /* pole spacing = 160 */
@keyframes drift { to { transform: translateX(-390px); } }  /* content repeated every 390 */
```
Slow every loop down for an "arriving" state (the train decelerates).

**Live-bound transforms.** Rotate hands from data, not CSS keyframes:
`<g transform="rotate(${deg} ${cx} ${cy})">`. For CSS animation on SVG
children, set `transform-box: fill-box; transform-origin: center;`.

**Glow and grain.**
```css
.amb   { position:absolute; inset:0; pointer-events:none;
         background: radial-gradient(120% 55% at 50% 22%, rgb(255 200 61 / .11), transparent 62%); }
.grain { position:absolute; inset:0; pointer-events:none; opacity:.06;
         background-image: radial-gradient(rgb(255 255 255 / .9) .5px, transparent .6px); background-size: 3px 3px; }
```

**Material cues in CSS.**
- Holographic foil: `linear-gradient(115deg, #BFE6D8, #F2CFE4 18%, #CFD8F8 34%, #E6F4BE 50%, #F8D8C0 66%, #C6E0F4 82%)`,
  `background-size: 100% 400%`, shift `background-position` with pointer tilt, plus a
  `repeating-linear-gradient` of 1 px white lines at 40% for the diffraction ribs.
- Perforated stamp edge: a radial-gradient mask (`circle 5px` holes every 14 px).
- Ticket perforation: a dotted border plus two half-circle notches in the ground colour.
- Paper: a 4 px dot grain at 15–18% on the desk, never on the paper itself.

---

## 4. The detail pass (what moves P3 from 0.5 to 1)

Do this after the scenes work. For **each** scene, add:
1. **Life**: people, animals, smoke, birds, passengers in windows, a figure at the marker.
2. **Lettering on an object**: a station name on a clock face, a car number by a
   door, a serial on a ticket. Keep it off moving parts and at ≥ 8 px.
3. **One secondary motion**: a ticking second hand, poles whipping past, a
   breathing status dot, tea rows drifting.
4. **One material or place cue**: a seal, a rubber stamp, Kyoto Tower on the
   skyline, Shizuoka tea fields below Fuji, a ridge line on the mountain.
5. **A shadow or depth cue** consistent with the hand (offset in poster, hatch in
   engraving, glow in hardware).

Then delete anything that does not survive the glance test. Detail should
reward a second look, never compete with the first read.

---

## 5. When code cannot reach 9–10: image generation

Flat, engraved, geometric and hardware hands reach 9 in code. Material
(clay, glass, liquid) and painterly hands top out around 8 in CSS/SVG. When an
image model is available (and the user has agreed to any cost):
- Generate **every** asset in one style, one palette, one light direction;
  include the hex values of the tone ramp in the prompt.
- Ask for a transparent or flat background matching the ground; reject halos
  and wrong mattes.
- Generate at the highest quality and downscale for @1x/@2x/@3x; never upscale.
- Keep the state binding: generate the object in each state you need (jar ¼,
  ½, ¾ full) or generate the object and draw the state layer (liquid, wedge)
  in code on top.
