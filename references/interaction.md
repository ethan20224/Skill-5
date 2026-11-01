# Interaction: signature moments, built for real

P8 needs one signature interaction that comes *from the concept* and is fully
built: press states, the gesture, the commit, the haptic, the reduced-motion
fallback. A description of an interaction scores 0.

Rules that apply to all of them:
- **Specify exact transitions.** Never `transition: all`. Animate only
  `transform`, `opacity`, `clip-path`, `filter`.
- **Strong curves:** ease-out `cubic-bezier(.23,1,.32,1)` for entrances and
  feedback; ease-in-out `cubic-bezier(.77,0,.175,1)` for on-screen travel;
  the iOS drawer curve `cubic-bezier(.32,.72,0,1)` for sliding indicators and
  sheets. Never ease-in on UI.
- **Asymmetric timing:** slow where the user decides (a 1.1 s hold), fast where
  the system responds (200 ms release).
- **Interruptible:** use transitions (which retarget) for anything that can be
  triggered rapidly, not keyframes (which restart).
- **Haptics are punctuation:** one per user action, on the same frame as the
  visual, never on scroll or in loops. Web: `navigator.vibrate` (Android only;
  iOS Safari ignores it, so the visual must carry the moment alone).
- **Reduced motion:** keep opacity and colour changes, drop movement.
- **Reset rules must not beat components.** Write resets as
  `:where(button){ all: unset }` (zero specificity). A `.app button
  { background: none }` reset silently erased the primary button's fill in a
  real project, twice.

---

## The library (pick one as the signature; use the small ones everywhere)

### Press (everywhere)
```css
.press { transition: transform 140ms cubic-bezier(.23,1,.32,1); }
.press:active { transform: scale(.97); }
```

### Hold to confirm (boarding, deleting, sending money)
Slow, deliberate fill; instant release; commit with haptic.
```css
.hold { position: relative; overflow: hidden; }
.hold .fill { position:absolute; inset:0; clip-path: inset(0 100% 0 0 round 27px);
  transition: clip-path 200ms cubic-bezier(.23,1,.32,1); }
.hold.holding .fill { clip-path: inset(0 0 0 0 round 27px); transition: clip-path 1100ms linear; }
```
```js
let t;
btn.addEventListener('pointerdown', () => { btn.classList.add('holding');
  t = setTimeout(() => { btn.classList.remove('holding'); commit(); navigator.vibrate?.([8, 40, 14]); }, 1100); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(e => btn.addEventListener(e, () => {
  clearTimeout(t); btn.classList.remove('holding'); }));
```
Add `-webkit-touch-callout:none; user-select:none` so a long press does not
select text. Show a small ring icon in the label so it reads as "hold".

### Reveal on hold (privacy-sensitive codes)
QR or balance blurred until held: `filter: blur(8px); opacity: .3; transform:
scale(.94)` → clear in 420 ms ease-out.

### Split-flap (platform changes, scores, departures)
```css
.ft b { display:block; animation: flap 720ms cubic-bezier(.23,1,.32,1) both; }
@keyframes flap { 0%{transform:rotateX(0)} 16%{transform:rotateX(85deg);opacity:.3}
  34%{transform:rotateX(-60deg);opacity:.6} 54%{transform:rotateX(30deg)}
  76%{transform:rotateX(-8deg)} 100%{transform:rotateX(0);opacity:1} }
```
Stagger characters by ~28 ms (`style="animation-delay: Nms"`), give tiles a
split gradient and a 1 px seam, `perspective: 200px` on the tile. Re-trigger
on change by toggling a class for ~1 s.

### Live tick (countdowns, clocks)
A real `setInterval(1000)` updating digits (tabular figures so nothing
jitters) and bound hero geometry (a shrinking wedge, a sweeping second hand).
Clear the interval on unmount.

### Tilt + sheen (cards, tickets, collectibles)
```js
card.addEventListener('pointermove', e => { const b = card.getBoundingClientRect();
  const nx = (e.clientX - b.left) / b.width - .5, ny = (e.clientY - b.top) / b.height - .5;
  card.style.transition = 'transform 120ms cubic-bezier(.23,1,.32,1)';
  card.style.transform = `perspective(900px) rotateX(${-ny * 10}deg) rotateY(${nx * 14}deg)`;
  foil.style.backgroundPosition = `0 ${50 + nx * 60 + ny * 40}%`; });
card.addEventListener('pointerleave', () => { card.style.transition = 'transform 600ms cubic-bezier(.23,1,.32,1)';
  card.style.transform = ''; });
```
On devices, drive it from `DeviceOrientationEvent` / the gyroscope as well.

### Drag to tear / dismiss (stubs, cards, notifications)
Capture the pointer, follow the finger, commit on distance **or** velocity, rubber-band backwards.
```js
el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); x0 = e.clientX; t0 = performance.now(); dragging = true; });
el.addEventListener('pointermove', e => { if (!dragging) return; const raw = e.clientX - x0;
  dx = raw > 0 ? raw : raw * .2; el.style.transform = `translateX(${dx}px) rotate(${dx * .03}deg)`; });
el.addEventListener('pointerup', () => { dragging = false; const v = dx / Math.max(1, performance.now() - t0);
  if (dx > 100 || v > .5) { el.style.transition = 'transform 460ms cubic-bezier(.23,1,.32,1), opacity 460ms';
    el.style.transform = 'translateX(125%) rotate(9deg)'; el.style.opacity = 0; navigator.vibrate?.(10); onTorn(); }
  else { el.style.transition = 'transform 320ms cubic-bezier(.32,.72,0,1)'; el.style.transform = ''; } });
```
`touch-action: none` on the element. Hint it with a nudging arrow ("Drag to keep →").

### Scrub through moments (demos, timelines, plans)
A segmented control whose highlight slides (`transform: translateX(index * 100%)`,
440 ms, drawer curve). Each segment shows the moment's time and name. Changing
moment cross-fades the hero (`opacity` + `scale(.97)` + `blur(4px)` → clear,
620 ms) and moves bound geometry (a train marker, a sun) with an ease-in-out.

### Parallax travel (windows, journeys, ambient life)
Seamless loops at different speeds per layer (drawing-hands.md §3). Slow them
down for arrival states. Pause when off-screen.

### Fill as you add (jars, glasses, goals)
On add, animate the level with a spring (≈ 0.45 s, slight overshoot), drop a
coin or droplet into it, and tick the number with tabular digits.

### Stamp / collect (completion, retention)
A toast or card enters from the top, a dashed circular stamp lands with a short
scale-down (1.6 → 0.96 → 1 over 520 ms) and rotation, then the toast leaves
after ~3.5 s. Text: what was saved and a running total ("Journey 14 · 513 km
this year"). This is where retention and sharing live.

### Breathing presence (assistants, live status)
Idle: scale 1 → 1.03, 4–6 s ease-in-out infinite. Thinking: faster, with a
shimmer. Speaking: ripple rings (scale 1 → 2.6, opacity .7 → 0, 2 s).
Status dots: opacity 1 → .35, 2.4 s.

---

## Choosing the signature

| Product truth | Signature |
|---|---|
| Something is private until needed | Hold to reveal |
| Something irreversible | Hold to confirm |
| Something physical is kept | Drag to tear, stamp to collect |
| Something changes on a board | Split-flap |
| Something is precious or collectible | Tilt + sheen |
| Time is running | Live tick bound to the hero |
| A journey | Scrub through moments, parallax travel |
| A quantity grows | Fill as you add |
| A presence listens | Breathing orb |

One signature per direction. If two directions share a signature, one of them
is a skin.
