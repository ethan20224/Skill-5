# Building it for real: SwiftUI, React Native / Expo, Flutter, Compose

A 9-level mockup only matters if it survives implementation. The design
pillars do not change in code; what changes is that native fidelity,
navigation and motion become verifiable, and every one of them can cost a
point.

---

## 1. Native fidelity (each violation is a defect)

1. **System chrome is the system's.** Use the real status bar, safe areas and
   home indicator; never hard-code notch sizes (`safeAreaInsets`,
   `react-native-safe-area-context`, `MediaQuery.padding`, `WindowInsets`).
2. **Native controls** for toggles, sliders, segmented controls, pickers,
   menus, sheets. A rebuilt switch that animates differently reads fake.
3. **System symbols** (SF Symbols / Material Symbols) in one weight; custom SVG
   only where the drawing hand demands it.
4. **Continuous corners** (`.continuous` in SwiftUI, `borderCurve:
   'continuous'` in React Native).
5. **Tabular figures** for anything that counts (`.monospacedDigit()`,
   `fontVariant: ['tabular-nums']`, `FontFeature.tabularFigures()`).
6. **Dynamic Type / font scaling**: the layout survives XL text; display
   numbers may cap their scaling, body text may not.
7. **Light and dark from day one**, resolved through semantic tokens named by
   role.
8. **Haptics** on the same frame as the visual, one per action:
   `UIImpactFeedbackGenerator` / `.sensoryFeedback` (SwiftUI),
   `expo-haptics`, `HapticFeedback` (Flutter), `performHapticFeedback` (Android).
9. **Numbers formatted like a product** with the locale's formatter.

## 2. Navigation (the part a screenshot cannot show)

- **Push** goes deeper (detail); **replace** moves on (finished onboarding,
  signed in, purchased) so back can never re-enter a past state.
- **Modal** for a self-contained task with steps (own Cancel/Done); **sheet**
  with detents for a short interruption; **full-screen** for immersive content
  with an explicit close; **overlay** for something floating over a visible
  screen (a stamp toast, a lightbox).
- **Tabs are peers**: no slide between them, each keeps its stack, re-tapping
  pops to root.
- **Back is blocked only** for an irreversible request in flight or unsaved
  work (ask first). Never trap back for a funnel or a rating prompt.
- A paywall opened from a feature dismisses back onto the feature, unlocked.

## 3. Motion translation

| Mockup (CSS) | SwiftUI | React Native (Reanimated) | Flutter | Compose |
|---|---|---|---|---|
| Press scale .97, 140 ms ease-out | `.scaleEffect(pressed ? 0.97 : 1).animation(.easeOut(duration: 0.14))` | `withTiming(0.97, {duration: 140, easing: Easing.bezier(.23,1,.32,1)})` | `AnimatedScale(duration: 140ms, curve: Curves.easeOutCubic)` | `animateFloatAsState(tween(140, easing = FastOutSlowInEasing))` |
| Spring settle | `.spring(duration: 0.4, bounce: 0)` | `withSpring(v, {duration: 400, dampingRatio: 1})` | `SpringDescription.withDampingRatio(ratio: 1)` | `spring(dampingRatio = 1f)` |
| Hold to confirm fill | `Rectangle().trim` or mask animated over 1.1 s, `.onLongPressGesture(minimumDuration: 1.1)` | `withTiming(1, {duration: 1100, easing: Easing.linear})` on press-in, cancel on press-out | `AnimationController(duration: 1100ms)` | `Animatable.animateTo(1f, tween(1100, easing = LinearEasing))` |
| Drag to dismiss with velocity | `DragGesture` + `predictedEndTranslation` | Gesture Handler `Pan` + `velocityX` into `withSpring` | `GestureDetector` + `DragEndDetails.velocity` | `draggable` + `velocity` |
| Tilt + sheen | `CoreMotion` attitude → `rotation3DEffect` | `expo-sensors` DeviceMotion → `rotateX/rotateY` | `sensors_plus` | `SensorManager` rotation vector |
| Parallax loop | `TimelineView(.animation)` offset | `withRepeat(withTiming(-period, {easing: Easing.linear}), -1)` | `AnimationController.repeat()` | `rememberInfiniteTransition()` |

Keep gesture-driven animation off the JS/main thread (worklets in Reanimated),
animate only transform and opacity, and respect Reduce Motion
(`accessibilityReduceMotion`, `useReducedMotion`, `MediaQuery.disableAnimations`).

## 4. Illustrations in code

- Ship hero art as **vector** where possible (SVG via `react-native-svg`,
  SwiftUI `Shape`/`Canvas`, Flutter `CustomPainter`, Compose `Canvas`) so the
  state binding (fill level, wedge angle, lit windows) stays live.
- Raster art (generated material objects) at @1x/@2x/@3x, with the state layer
  drawn in code on top.

## 5. The production verification loop

1. Run on the simulator/emulator and on the slowest real device you support,
   in a release build.
2. Screenshot every state in light and dark, at default and XL text; run the
   same visual inspection as the mockup round (every image at full size).
3. **Screen-record every flow** end to end (`xcrun simctl io booted recordVideo
   flow.mov`): transitions, back paths (chevron, edge swipe, Android back),
   sheets dragged and cancelled mid-drag, the keyboard both ways, the signature
   interaction, rapid taps. Watch once at speed for feel, once frame by frame
   for dropped frames, one-frame flashes and layout jumps.
4. Sustained 60 fps (120 on ProMotion) through the hero flow, measured.
5. Tap targets ≥ 44 pt, contrast in both themes, VoiceOver/TalkBack labels on
   icon-only buttons and on the hero (describe the state: "Budget jar, €137.60
   left of €450").

Done means: every state designed and inspected, every flow recorded and
scrubbed, no defect found at full size.
