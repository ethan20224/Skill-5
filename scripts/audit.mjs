#!/usr/bin/env node
/**
 * Level Nine audit — render a mobile mockup, screenshot every phone screen,
 * and check the things a design must get right before it is scored at all:
 * the Works gate (SKILL.md §2). It then reports the "level ceilings" that keep
 * AI-made app designs stuck at 5–7.
 *
 *   node audit.mjs mockup.html                     -> ./audit next to the file
 *   node audit.mjs mockup.html --out audit/r2      choose the output folder
 *   node audit.mjs mockup.html --scale 3           PNG pixel density (default 2)
 *   node audit.mjs mockup.html --wait 1800         ms to let fonts/animations settle (default 1400)
 *   node audit.mjs mockup.html --screen ".phone"   CSS selector for screens
 *   node audit.mjs mockup.html --dark              audit the dark appearance as the base pass
 *   node audit.mjs mockup.html --sizes 375x667,440x956   the small and large phone to test
 *   node audit.mjs mockup.html --quick             base pass only (no size, dark, content or press passes)
 *   node audit.mjs mockup.html --no-interact       skip pressing controls
 *   node audit.mjs http://localhost:5173/          URLs work too
 *
 * Passes (all on by default; --quick runs only the first):
 *   base      the design as drawn. Contrast is measured from the rendered pixels, so text
 *             on a picture, a gradient or inside an illustration is checked too
 *   small     every screen forced to the small phone (375 × 667)        same checks, same levels
 *   large     every screen forced to the large phone (440 × 956)        same checks, same levels
 *   dark      prefers-color-scheme: dark                                 contrast and affordance
 *   stress    every string grown ~35% (or swapped for data-stress="…")   findings are WARNs
 *   text-xl   body text at Dynamic Type XL (× 1.35)                      findings are WARNs
 *   press     presses controls for a pressed state; drives every marked interaction
 *             and saves a four-frame strip of it
 *
 * Screens are found by: --screen selector, else [data-screen] / .screen,
 * else any phone-shaped clipping box (320–480px wide, ~2:1, rounded, overflow hidden).
 * The size passes set --device-w / --device-h on <html> and the same width and height on
 * each screen, so a fluid screen needs nothing more; a screen built from fixed pixels fails
 * them, which is the point.
 *
 * Mark things in markup:
 *   data-role="…"          on a screen: home (default) | detail | input | entry | transition |
 *                          celebration | utility
 *   data-archetype="…"     on a screen: glance (default) | list | feed | instrument | canvas |
 *                          conversation (anatomy.md §1). The hero and dead-band rules apply in
 *                          full only to hero-led structures (glance, instrument, canvas) on
 *                          home and detail screens
 *   data-space="why"       an empty region that is there on purpose (never on a home or detail
 *                          glance); the report lists it. A band over 28% is always reported
 *   data-interaction="…"   on the element a person touches: hold | hold:1100 | tap | drag:120,0.
 *                          The press pass drives it and saves interaction-NN-name.png
 *   data-stress="…"        the longest real string this element must survive (stress pass)
 *   data-appearance="why"  on <html> or a screen: the app has one appearance on purpose
 *   data-audit-ignore      skip this element and its subtree (e.g. a transient toast)
 *   data-bleed             text/art is allowed to run off-screen here
 *
 * Writes: <out>/NN-name.png per screen, sheet.png and sheet-<pass>.png, blind/ (every screen
 * with and without its words, under neutral names) and blind-read.md (the message for a fresh
 * reader), interaction-*.png, report.md, report.json.
 * Exit code 1 if any FAIL in any pass. WARNs never fail the run, but every WARN must be
 * answered (fixed, or one line on why it is deliberate).
 *
 * playwright-core is resolved from the cwd first, then this skill folder.
 * Missing?  cd ~/.claude/skills/skill-5 && npm i
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// ---------- the numbers. One source: the references quote these, never their own ----------
const RULES = {
  textMin: 11,          // px. Text a person reads (anatomy.md §2)
  tabLabelMin: 10,      // px. Tab-bar labels only
  letteringMin: 9,      // px as rendered. Lettering inside an illustration (drawing-hands.md §4)
  tapMin: 44,           // pt. Hit area, both ways
  tapNativeHeight: 32,  // pt. A control ≥ 44 wide may sit at native height (segmented, chip, stepper)
  tapFail: 28,          // pt. Under this either way nobody hits it
  contrastFail: 3,      // :1. Anything a person reads
  contrastBody: 4.5,    // :1. Text that is not large
  largeText: 24,        // px, or 18.66 bold
  deadWarn: 0.15,       // share of the screen height
  deadFail: 0.28,
  displayRatio: 2.5,    // largest ÷ body on a glance or instrument screen
  quietRatio: 2.0,      // the same on input, utility and transition roles
  flatHero: 0.97,       // share of the hero that is one flat colour
  sizes: { small: [375, 667], large: [440, 956] },
  grow: 0.35,           // stress pass: how much longer every string gets
  xlBody: 1.35,         // text-xl pass: text up to 24px
  xlTitle: 1.15,        // text-xl pass: text up to 40px; display type keeps its size
};

const here = path.dirname(fileURLToPath(import.meta.url));
let chromium;
for (const base of [process.cwd(), path.join(here, "..")]) {
  try { ({ chromium } = createRequire(path.join(base, "package.json"))("playwright-core")); break; } catch {}
}
if (!chromium) {
  console.error("playwright-core not found. Run once:\n  cd " + path.join(here, "..") + " && npm i");
  process.exit(2);
}

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
const target = argv.find((a) => /\.html?$/i.test(a) || /^https?:\/\//.test(a));
if (!target) {
  console.error("usage: node audit.mjs <mockup.html|url> [--out dir] [--scale 2] [--wait 1400] [--screen sel] [--dark] [--sizes 375x667,440x956] [--quick] [--no-interact]");
  process.exit(2);
}
const isUrl = /^https?:\/\//.test(target);
const URL_ = isUrl ? target : pathToFileURL(path.resolve(target)).href;
const OUT = path.resolve(arg("--out", isUrl ? "audit" : path.join(path.dirname(path.resolve(target)), "audit")));
const SCALE = parseFloat(arg("--scale", "2"));
const WAIT = parseInt(arg("--wait", "1400"), 10);
const SEL = arg("--screen", "");
const DARK = has("--dark");
const QUICK = has("--quick") || has("--no-matrix");
const INTERACT = !QUICK && !has("--no-interact");
const sizeArg = arg("--sizes", "");
if (sizeArg) {
  const [s, l] = sizeArg.split(",").map((x) => x.split(/x/i).map(Number));
  if (s && s.length === 2 && s.every(Number.isFinite)) RULES.sizes.small = s;
  if (l && l.length === 2 && l.every(Number.isFinite)) RULES.sizes.large = l;
}
fs.mkdirSync(path.join(OUT, "blind"), { recursive: true });
// a strip left over from an earlier run would be read as this run's proof
for (const f of fs.readdirSync(OUT)) if (/^interaction-.*\.png$/.test(f) || /^sheet-.*\.png$/.test(f)) fs.rmSync(path.join(OUT, f));

const CHROME = [
  process.env.LEVEL9_CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find((p) => p && fs.existsSync(p));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: SCALE });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });

// A blank page that does the pixel work (two screenshots in, numbers out).
const helper = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
await helper.goto("about:blank");
await helper.evaluate(() => {
  const img = async (b64) => {
    const bmp = await createImageBitmap(await (await fetch("data:image/png;base64," + b64)).blob());
    const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(bmp, 0, 0);
    return { w: bmp.width, h: bmp.height, d: x.getImageData(0, 0, bmp.width, bmp.height).data };
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  // a = the screen as drawn, b = the same screen with every glyph made transparent.
  // Where they differ is where the ink is; b at those pixels is what sits behind the ink.
  const analyze = async ({ a, b, scale, items, hero }) => {
    const A = await img(a), B = await img(b);
    const W = Math.min(A.w, B.w), H = Math.min(A.h, B.h);
    const text = items.map((it) => {
      if (it.skip) return null;
      const glyph = [], field = [];
      let area = 0;
      for (const r of it.rects) {
        const x0 = Math.max(0, Math.floor(r.x * scale)), x1 = Math.min(W, Math.ceil((r.x + r.w) * scale));
        const y0 = Math.max(0, Math.floor((r.y + r.h * 0.1) * scale)), y1 = Math.min(H, Math.ceil((r.y + r.h * 0.92) * scale));
        const step = (x1 - x0) * (y1 - y0) > 90000 ? 2 : 1;
        for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
          const i = (y * A.w + x) * 4, j = (y * B.w + x) * 4;
          const d = Math.abs(A.d[i] - B.d[j]) + Math.abs(A.d[i + 1] - B.d[j + 1]) + Math.abs(A.d[i + 2] - B.d[j + 2]);
          area++;
          if (d > 18) glyph.push([B.d[j], B.d[j + 1], B.d[j + 2], A.d[i], A.d[i + 1], A.d[i + 2], d]);
          field.push([B.d[j], B.d[j + 1], B.d[j + 2]]);
        }
      }
      if (!area) return null;
      const maskEmpty = glyph.length < Math.max(6, 0.002 * area);
      let ratios;
      if (it.fg) {
        // The declared colour against everything behind the line, ink or not: a word that
        // vanishes into a light shape leaves no ink to find, so the ink alone would miss it.
        const f = it.fg;
        ratios = field.map((p) => {
          const r = f.r * f.a + p[0] * (1 - f.a), g = f.g * f.a + p[1] * (1 - f.a), bl = f.b * f.a + p[2] * (1 - f.a);
          return ratio(lum(r, g, bl), lum(p[0], p[1], p[2]));
        });
      } else {                           // gradient or pattern fill: measure the ink itself
        if (maskEmpty) return { none: true, area };
        glyph.sort((p, q) => q[6] - p[6]);
        ratios = glyph.slice(0, Math.max(1, Math.floor(glyph.length * 0.3))).map((p) => ratio(lum(p[3], p[4], p[5]), lum(p[0], p[1], p[2])));
      }
      if (!ratios.length) return null;
      ratios.sort((x, y) => x - y);
      return { p20: ratios[Math.floor(ratios.length * 0.2)], med: ratios[Math.floor(ratios.length * 0.5)], maskEmpty, area };
    });
    let flat = null;
    if (hero) {                          // is the largest picture a picture, or one flat field?
      const x0 = Math.max(0, Math.floor(hero.x * scale)), x1 = Math.min(W, Math.ceil((hero.x + hero.w) * scale));
      const y0 = Math.max(0, Math.floor(hero.y * scale)), y1 = Math.min(H, Math.ceil((hero.y + hero.h) * scale));
      const bins = new Map(); let n = 0;
      for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) {
        const j = (y * B.w + x) * 4, k = ((B.d[j] >> 4) << 8) | ((B.d[j + 1] >> 4) << 4) | (B.d[j + 2] >> 4);
        bins.set(k, (bins.get(k) || 0) + 1); n++;
      }
      if (n) flat = Math.max(...bins.values()) / n;
    }
    return { text, flat };
  };

  // share of pixels that differ between two shots of the same box
  const diff = async ({ a, b }) => {
    const A = await img(a), B = await img(b);
    const W = Math.min(A.w, B.w), H = Math.min(A.h, B.h);
    let n = 0, hit = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * A.w + x) * 4, j = (y * B.w + x) * 4;
      n++;
      if (Math.abs(A.d[i] - B.d[j]) + Math.abs(A.d[i + 1] - B.d[j + 1]) + Math.abs(A.d[i + 2] - B.d[j + 2]) > 24) hit++;
    }
    return n ? hit / n : 0;
  };
  window.L9 = { analyze, diff };
});
const b64 = (buf) => buf.toString("base64");
const pxDiff = (a, b) => helper.evaluate((x) => window.L9.diff(x), { a: b64(a), b: b64(b) });

// ---------- loading, freezing, finding screens ----------
async function open(dark) {
  await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(WAIT);
}

// Freeze motion so shots never catch a mid-transition blur: finish finite
// animations, pause infinite ones where they are.
async function freeze() {
  await page.evaluate(() => {
    // stop timers too, so live clocks/re-renders cannot change the DOM between shot and scan
    const top = setTimeout(() => {}, 0);
    for (let id = 1; id <= top + 50; id++) { clearTimeout(id); clearInterval(id); }
    for (const a of document.getAnimations()) {
      try {
        const t = a.effect && a.effect.getComputedTiming();
        if (t && Number.isFinite(t.endTime)) a.finish(); else a.pause();
      } catch {}
    }
  });
  await page.waitForTimeout(120);
}

async function mark() {
  return page.evaluate((sel) => {
    let els = sel ? [...document.querySelectorAll(sel)] : [...document.querySelectorAll("[data-screen], .screen")];
    if (!els.length) {
      els = [...document.querySelectorAll("body *")].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const ratio = r.height / Math.max(1, r.width);
        return r.width >= 320 && r.width <= 480 && ratio > 1.6 && ratio < 2.45 &&
          cs.overflow !== "visible" && parseFloat(cs.borderTopLeftRadius) >= 20;
      });
      els = els.filter((e) => !els.some((o) => o !== e && e.contains(o))); // innermost
    }
    els.forEach((e, i) => e.setAttribute("data-l9-idx", String(i)));
    return els.map((e, i) => ({
      i,
      name: (e.getAttribute("data-screen") || e.getAttribute("data-name") || "screen-" + String(i + 1).padStart(2, "0"))
        .replace(/[^a-z0-9_-]+/gi, "-").toLowerCase(),
    }));
  }, SEL);
}
const at = (s) => page.locator(`[data-l9-idx="${s.i}"]`);
const nn = (s) => String(s.i + 1).padStart(2, "0");

// ---------- page-side: the content and size mutations ----------
function resizeScreens([w, h]) {
  document.documentElement.style.setProperty("--device-w", w + "px");
  document.documentElement.style.setProperty("--device-h", h + "px");
  let ok = true;
  for (const el of document.querySelectorAll("[data-l9-idx]")) {
    el.style.width = w + "px"; el.style.height = h + "px";
    const r = el.getBoundingClientRect();
    if (Math.abs(r.width - w) > 2 || Math.abs(r.height - h) > 2) ok = false;
  }
  return ok;
}

// Longer everything: what a German build, a long name or a bigger number does to the layout.
function growText(R) {
  const grow = (s) => {
    let out = s;
    if (/[A-Za-zÀ-ÿ]/.test(s)) {
      let need = Math.ceil(s.replace(/\s/g, "").length * R.grow);
      out = "";
      for (const ch of s) { out += ch; if (need > 0 && /[aeiouAEIOU]/.test(ch)) { out += ch.toLowerCase(); need--; } }
    }
    if (/^\s*\d{1,2}:\d{2}(:\d{2})?\s*$/.test(s)) return s;          // a clock cannot grow
    return out.replace(/(^|[^\d:.,])(\d{2,})(?![\d]*:)/, "$19$2");       // one more digit on the first number
  };
  for (const scr of document.querySelectorAll("[data-l9-idx]")) {
    const given = new Set();
    for (const el of scr.querySelectorAll("[data-stress]")) { el.textContent = el.getAttribute("data-stress"); given.add(el); }
    const tw = document.createTreeWalker(scr, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let t = tw.nextNode(); t; t = tw.nextNode()) nodes.push(t);
    for (const t of nodes) {
      const el = t.parentElement;
      if (!el || !t.nodeValue.trim() || el.closest("svg, script, style, [data-audit-ignore], [data-stress]")) continue;
      t.nodeValue = grow(t.nodeValue);
    }
  }
}

// Dynamic Type XL: body text grows, display type may hold, system chrome does not scale.
function growType(R) {
  for (const scr of document.querySelectorAll("[data-l9-idx]")) {
    const S = scr.getBoundingClientRect();
    const todo = new Map();
    const tw = document.createTreeWalker(scr, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const el = t.parentElement;
      if (!el || !t.nodeValue.trim() || todo.has(el) || el.closest("svg, [data-audit-ignore]")) continue;
      const r = el.getBoundingClientRect();
      if (r.top - S.top < S.height * 0.07) continue;                                                 // status bar
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (el.closest('nav, [role="tablist"], [data-tabbar]') || (fs <= 11 && r.top > S.bottom - S.height * 0.13)) continue; // tab bar; a pinned action still grows
      const k = fs <= 24 ? R.xlBody : fs <= 40 ? R.xlTitle : 1;
      if (k > 1) todo.set(el, fs * k);
    }
    for (const [el, fs] of todo) el.style.fontSize = fs.toFixed(2) + "px";
  }
}

function hideText() {
  const st = document.createElement("style"); st.id = "l9-notext";
  st.textContent = `[data-l9-idx], [data-l9-idx] *, [data-l9-idx] *::before, [data-l9-idx] *::after {
      -webkit-text-fill-color: transparent !important; -webkit-text-stroke-color: transparent !important;
      text-shadow: none !important; transition: none !important; }
    [data-l9-idx] svg text, [data-l9-idx] svg tspan, [data-l9-idx] svg textPath { fill: transparent !important; stroke: transparent !important; }`;
  document.head.appendChild(st);
  for (const el of document.querySelectorAll("[data-l9-idx] *")) {   // gradient-filled text paints through its background
    const cs = getComputedStyle(el);
    if (cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text") { el.setAttribute("data-l9-hid", el.style.visibility || ""); el.style.visibility = "hidden"; }
  }
}
function showText() {
  const st = document.getElementById("l9-notext"); if (st) st.remove();
  for (const el of document.querySelectorAll("[data-l9-hid]")) { el.style.visibility = el.getAttribute("data-l9-hid"); el.removeAttribute("data-l9-hid"); }
}

// ---------- page-side: the scan ----------
function scanPage({ R }) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const rgba = (str) => {
    if (!str || str === "none" || str.startsWith("url(")) return null;
    if (cache.has(str)) return cache.get(str);
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "rgba(0,0,0,0)"; cx.fillStyle = str; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    cache.set(str, out); return out;
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const hsl = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return { h: 0, s: 0, l };
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l };
  };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  // an element hidden by clip-path: inset(... 100% ...) (e.g. a hold-to-confirm fill at rest) is not visible
  const clippedAway = (el, stop) => {
    for (let n = el; n && n !== stop; n = n.parentElement) {
      const cp = getComputedStyle(n).clipPath;
      if (cp && cp !== "none" && /inset\(([^)]*\b100%)/.test(cp)) return true;
    }
    return false;
  };
  const ignored = (el) => !!(el && el.closest && el.closest("[data-audit-ignore]"));
  const bleed = (el) => !!(el && el.closest && el.closest("[data-bleed]"));
  const opacityOf = (el, stop) => { let o = 1; for (let n = el; n && n !== stop.parentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || "1"); return o; };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const contains = (o, i, t = 1.5) => i.left >= o.left - t && i.right <= o.right + t && i.top >= o.top - t && i.bottom <= o.bottom + t;
  const snip = (s) => (s.length > 42 ? s.slice(0, 40) + "…" : s);
  const CTL = "button, a[href], [role=button], input[type=button], input[type=submit], summary";
  const DEFAULT_FONTS = ["inter", "roboto", "poppins", "montserrat", "open sans", "arial", "helvetica", "lato", "helvetica neue"];
  const ROLES = ["home", "detail", "input", "entry", "transition", "celebration", "utility"];
  const ARCHS = ["glance", "list", "feed", "instrument", "canvas", "conversation"];

  const out = [];
  for (const scr of document.querySelectorAll("[data-l9-idx]")) {
    scr.scrollIntoView({ block: "start", inline: "start" });   // hit-testing only works inside the viewport
    const S = scr.getBoundingClientRect();
    const sArea = S.width * S.height;
    const findings = [];
    const add = (level, code, msg) => findings.push({ level, code, msg });
    const sBg = rgba(getComputedStyle(scr).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    let role = (scr.getAttribute("data-role") || "home").trim().toLowerCase();
    if (!ROLES.includes(role)) { add("WARN", "unknown-role", `data-role="${role}" is not one of ${ROLES.join(", ")} — judged as home`); role = "home"; }
    let arch = (scr.getAttribute("data-archetype") || "glance").trim().toLowerCase();
    if (!ARCHS.includes(arch)) { add("WARN", "unknown-archetype", `data-archetype="${arch}" is not one of ${ARCHS.join(", ")} — judged as glance`); arch = "glance"; }
    // the hero and dead-band rules apply in full only where the screen's job is status and its
    // structure is led by one picture or instrument
    const heroLed = ["glance", "instrument", "canvas"].includes(arch);
    const strict = (role === "home" || role === "detail") && heroLed;
    // a canvas (map, photo, document) is its own picture; only glance and instrument screens owe a hero
    const owesHero = strict && arch !== "canvas";
    // Text inside a scroll container may run past its edge along the way it scrolls: that is
    // what scrolling is. Past the other edge (a row too wide for a vertical list) it is a defect.
    // (overflow-y: auto computes overflow-x to auto as well, so the way a scroller moves is read
    // from how it lays its children out: a single row of them scrolls sideways, anything else down.)
    const sideways = (n) => { const c = getComputedStyle(n); return (/flex/.test(c.display) && c.flexDirection.startsWith("row") && c.flexWrap === "nowrap") || (/grid/.test(c.display) && c.gridAutoFlow.startsWith("column")); };
    const past = (n, box, along) => { const r = n.getBoundingClientRect(); return along === sideways(n) ? box.left < r.left - 1.5 || box.right > r.right + 1.5 : box.top < r.top - 1.5 || box.bottom > r.bottom + 1.5; };
    const scrolled = (el, box) => {
      for (let n = el.parentElement; n && n !== scr.parentElement; n = n.parentElement) {
        const c = getComputedStyle(n);
        if (/auto|scroll/.test(c.overflowX + " " + c.overflowY)) return past(n, box, true);
      }
      return false;
    };

    // text that sits under an opaque surface (a map label under a sheet) is covered, not colliding
    const covered = (it) => {
      const r = it.rects[0], top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!top || top === it.el || it.el.contains(top) || top.contains(it.el)) return false;
      for (let n = top; n && !n.contains(it.el); n = n.parentElement) {
        const c = getComputedStyle(n), bg = rgba(c.backgroundColor);
        if ((bg && bg.a > 0.5) || c.backgroundImage !== "none") return true;
      }
      return false;
    };

    // ---- collect text items (one per element that owns text) ----
    const items = new Map();
    const tw = document.createTreeWalker(scr, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const txt = t.nodeValue.replace(/\s+/g, " ").trim();
      if (!txt) continue;
      const el = t.parentElement;
      if (!el || ignored(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      if (opacityOf(el, scr) < 0.05 || clippedAway(el, scr)) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      const rs = [...rg.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      if (!rs.length) continue;
      const box = rs.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }), { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 });
      const prev = items.get(el);
      if (prev) { prev.text += " " + txt; prev.rects.push(...rs); prev.box = { left: Math.min(prev.box.left, box.left), top: Math.min(prev.box.top, box.top), right: Math.max(prev.box.right, box.right), bottom: Math.max(prev.box.bottom, box.bottom) }; }
      else items.set(el, { el, text: txt, rects: rs, box, cs });
    }
    const texts = [...items.values()];

    // ---- per-text checks ----
    const sizes = [];
    const fams = new Map(); const famW = {};
    const pix = [];
    for (const it of texts) {
      const { el, cs, box, text } = it;
      const inSvg = !!el.closest("svg");
      // lettering inside a scaled illustration is as big as it renders, not as big as it is declared
      const m = inSvg && el.getScreenCTM ? el.getScreenCTM() : null;
      const fs = parseFloat(cs.fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
      const hidden = scrolled(el, box);
      it.gone = hidden || covered(it);
      const inTab = !!el.closest('nav, [role="tablist"], [role="navigation"], [data-tabbar]') || box.top > S.bottom - S.height * 0.13;
      sizes.push({ fs, n: text.length });
      const fam = (cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim();
      if (fam) { fams.set(fam, (fams.get(fam) || 0) + text.length); (famW[fam] = famW[fam] || new Set()).add(cs.fontStyle + " " + cs.fontWeight); }

      let cut = hidden;
      if (!hidden) {
        if (!bleed(el) && !contains(S, box, 2)) { add("FAIL", "offscreen", `text runs off the screen: "${snip(text)}"`); cut = true; }
        else {
          for (let n = el.parentElement; n && n !== scr; n = n.parentElement) {
            const ncs = getComputedStyle(n);
            const ov = ncs.overflow + " " + ncs.overflowX + " " + ncs.overflowY;
            if (/auto|scroll/.test(ov)) {      // a scroller hides things along its way on purpose, never across it
              if (!bleed(el) && past(n, box, false)) { add("FAIL", "clipped", `text runs out of the side of a scrolling area: "${snip(text)}"`); cut = true; }
              break;
            }
            if (/hidden|clip/.test(ov) && !contains(n.getBoundingClientRect(), box, 1.5) && !bleed(el)) { add("FAIL", "clipped", `text is cut off by a clipping parent: "${snip(text)}"`); cut = true; break; }
          }
        }
      }
      if (!inSvg && cs.overflow !== "visible" && el.scrollWidth > el.clientWidth + 1) add("WARN", "truncated", `text is truncated in its box: "${snip(text)}"`);
      if (inSvg) { if (fs < R.letteringMin) add("WARN", "small-text", `${+fs.toFixed(1)}px lettering inside an illustration (${R.letteringMin}px floor; fine as texture, not if a person must read it): "${snip(text)}"`); }
      else if (inTab ? fs < R.tabLabelMin : fs < R.textMin) add("FAIL", "tiny-text", `${+fs.toFixed(1)}px text (${R.textMin}px floor; ${R.tabLabelMin}px for tab-bar labels only): "${snip(text)}"`);

      // a short label on two lines is a label that did not fit (the 285 km/h stat)
      if (!inSvg && text.length <= 16 && !el.querySelector("br")) {
        const tops = it.rects.map((r) => r.top).sort((a, b) => a - b);
        let lines = 1; for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > fs * 0.5) lines++;
        if (lines > 1) add("WARN", "wrapped", `a short label wraps onto ${lines} lines: "${snip(text)}"`);
      }

      if (/\{\{|\}\}|\bundefined\b|\bNaN\b|\[object Object\]|lorem ipsum/i.test(text)) add("FAIL", "template-junk", `unrendered or placeholder text: "${snip(text)}"`);
      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if ((cp >= 0x1f000 && /\p{Extended_Pictographic}/u.test(ch)) || (cp >= 0x2600 && cp <= 0x27bf && /\p{Extended_Pictographic}/u.test(ch))) { add("FAIL", "emoji", `emoji used as UI: "${snip(text)}"`); break; }
      }
      if (/\b(John|Jane) Doe\b|\bAcme\b|\bLorem\b/i.test(text)) add("WARN", "generic-content", `generic placeholder content: "${snip(text)}"`);
      if (/^(good (morning|afternoon|evening)|welcome back|hello|hi),?\s+[A-Z]/i.test(text)) add("WARN", "greeting-header", `greeting header (an L4 tell): "${snip(text)}"`);

      // contrast is settled from the pixels (see analyze): here, only what the ink is declared to be
      let fg = null;
      if (inSvg) {
        const c = rgba(cs.fill);
        if (c && c.a > 0.02) fg = { r: c.r, g: c.g, b: c.b, a: c.a * parseFloat(cs.fillOpacity || "1") * opacityOf(el, scr) };
      } else {
        const c = rgba(cs.webkitTextFillColor) || rgba(cs.color);
        if (c && c.a > 0.05) fg = { r: c.r, g: c.g, b: c.b, a: c.a * opacityOf(el, scr) };
      }
      pix.push({
        text: snip(text), len: text.length, svg: inSvg, fg, skip: cut,
        large: fs >= R.largeText || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700),
        rects: it.rects.map((r) => ({ x: r.left - S.left, y: r.top - S.top, w: r.width, h: r.height })),
      });
    }

    // ---- collisions (text over text) ----
    for (let a = 0; a < texts.length; a++) {
      for (let b = a + 1; b < texts.length; b++) {
        const A = texts[a], B = texts[b];
        if (A.el.contains(B.el) || B.el.contains(A.el) || A.gone || B.gone) continue;
        // inline boxes include the font's full ascent/descent; trim to roughly the ink so tight
        // display leading does not read as a collision
        const ink = (r) => ({ left: r.left, right: r.right, top: r.top + r.height * 0.2, bottom: r.bottom - r.height * 0.16 });
        let hit = 0;
        for (const r1 of A.rects) for (const r2 of B.rects) hit += inter(ink(r1), ink(r2));
        const aA = A.rects.reduce((s, r) => s + r.width * r.height, 0), aB = B.rects.reduce((s, r) => s + r.width * r.height, 0);
        if (hit > 0.12 * Math.min(aA, aB)) add("FAIL", "collision", `text collides: "${snip(A.text)}" × "${snip(B.text)}"`);
      }
    }

    // ---- controls ----
    for (const c of scr.querySelectorAll(CTL)) {
      if (ignored(c)) continue;
      const r = c.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(c);
      if (c.closest("p")) continue;
      const name = snip((c.innerText || c.getAttribute("aria-label") || c.tagName).trim());
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w < R.tapFail || h < R.tapFail) add("FAIL", "tiny-tap", `tap target ${w}×${h} (${R.tapMin}×${R.tapMin} hit area; under ${R.tapFail} either way cannot be hit): "${name}"`);
      else if (!(w >= R.tapMin && h >= R.tapNativeHeight)) add("WARN", "small-tap", `tap target ${w}×${h} (${R.tapMin}×${R.tapMin} hit area; a control ${R.tapMin} wide may sit at native height, ${R.tapNativeHeight}+): "${name}"`);
      const bgc = rgba(cs.backgroundColor);
      const bare = (!bgc || bgc.a < 0.05) && cs.backgroundImage === "none" && cs.boxShadow === "none" &&
        (parseFloat(cs.borderTopWidth) === 0 || (rgba(cs.borderTopColor) || { a: 0 }).a < 0.05);
      // a row (edge to edge, or more than one line of words) is not a button that lost its fill
      const tops = texts.filter((t) => c.contains(t.el)).flatMap((t) => t.rects.map((q) => q.top)).sort((x, y) => x - y);
      const rowLike = r.width >= 0.97 * S.width || tops.some((t, i) => i > 0 && t - tops[i - 1] > 8);
      if (bare && !rowLike && r.width >= 160 && r.height >= 36) add("FAIL", "no-affordance", `a ${Math.round(r.width)}px-wide control renders as bare text (a reset rule probably beat its fill): "${snip((c.innerText || "").trim())}"`);
    }
    for (const img of scr.querySelectorAll("img")) if (img.complete && img.naturalWidth === 0 && !ignored(img)) add("FAIL", "broken-image", `image failed to load: ${snip(img.getAttribute("src") || "")}`);

    // ---- dead space & hero coverage ----
    const boxes = texts.map((t) => t.box);
    let hero = 0, heroDesc = "", heroRect = null;
    for (const el of scr.querySelectorAll("*")) {
      if (ignored(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cl = { left: Math.max(r.left, S.left), top: Math.max(r.top, S.top), right: Math.min(r.right, S.right), bottom: Math.min(r.bottom, S.bottom) };
      const area = Math.max(0, cl.right - cl.left) * Math.max(0, cl.bottom - cl.top);
      const tag = el.tagName.toLowerCase();
      const picture = ["svg", "img", "canvas", "video", "picture"].includes(tag);
      // a canvas screen's picture is the whole screen; everywhere else a full-screen layer is a wrapper
      if (area <= 0 || (area > 0.85 * sArea && !(picture && arch === "canvas"))) continue;
      const cs = getComputedStyle(el);
      if (el.closest("svg") && tag !== "svg") continue;
      const visual = picture || (cs.backgroundImage !== "none" && !/^(linear|radial)-gradient\(rgba\(0, 0, 0, 0\)/.test(cs.backgroundImage));
      const bgc = rgba(cs.backgroundColor);
      const filled = bgc && bgc.a > 0.08 && ratio(over(bgc, sBg), sBg) > 1.12;
      const bordered = parseFloat(cs.borderTopWidth) > 0 && (rgba(cs.borderTopColor) || { a: 0 }).a > 0.1;
      if (visual || filled || bordered || cs.boxShadow !== "none") boxes.push(cl);
      if ((visual || (filled && r.width < 0.95 * S.width && r.height > 0.12 * S.height)) && area > hero) {
        hero = area; heroDesc = tag + (el.getAttribute("class") ? "." + String(el.getAttribute("class")).split(" ")[0] : "");
        heroRect = { x: cl.left - S.left, y: cl.top - S.top, w: cl.right - cl.left, h: cl.bottom - cl.top };
      }
    }
    const top = S.top + S.height * 0.07, bottom = S.bottom - S.height * 0.05;
    const iv = boxes.map((b) => [Math.max(top, b.top), Math.min(bottom, b.bottom)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
    let cur = top, gap = 0, gA = top, gB = top;
    for (const [a, b] of iv) { if (a - cur > gap) { gap = a - cur; gA = cur; gB = a; } cur = Math.max(cur, b); }
    if (bottom - cur > gap) { gap = bottom - cur; gA = cur; gB = bottom; }
    const dead = gap / S.height;
    // a data-space region covering at least half of the largest band defends it (never on a home or detail glance)
    let space = null;
    for (const el of scr.querySelectorAll("[data-space]")) {
      if (ignored(el)) continue;
      const r = el.getBoundingClientRect(), why = (el.getAttribute("data-space") || "").trim();
      if (why && gap > 0 && Math.min(r.bottom, gB) - Math.max(r.top, gA) >= 0.5 * gap) { space = why; break; }
    }
    const pct = Math.round(dead * 100);
    const kind = `${/^[aeiou]/.test(role) ? "an" : "a"} ${role} screen${arch !== "glance" ? ` (${arch})` : ""}`;
    if (strict) {
      const note = space ? " (data-space does not excuse a dead band on a home or detail screen)" : "";
      if (dead > R.deadFail) add("FAIL", "dead-band", `${pct}% of the screen height is an empty band (pillar 2: the picture should be the space)${note}`);
      else if (dead > R.deadWarn) add("WARN", "dead-band", `${pct}% of the screen height is an empty band — fill it with the hero, or defend the rest${note}`);
    } else if (dead > R.deadFail) {
      // a declared role or reason never makes a band this large pass in silence
      add("WARN", "large-band", `${pct}% of the screen height is one empty band on ${kind}${space ? `, defended as "${space}"` : ""} — the reader and the critic must run the fill test; if the screen's job is status, the role or archetype is wrong`);
    } else if (dead > R.deadWarn && !space) {
      add("WARN", "dead-band", `${pct}% of the screen height is an empty band on ${kind} — fine if it has a job (frames the focal object, a pause before the action, space above a pinned button, the end of a short list): run the fill test, then defend it in one line or mark it data-space="why"`);
    }
    const heroCov = hero / sArea;
    if (owesHero && heroCov < 0.12) add("WARN", "no-hero", `largest picture covers ${Math.round(heroCov * 100)}% of the screen (${role === "detail" ? "detail screens want the zoomed hero or chart to lead" : "a glance screen wants 30–50%"}: pillar 1)`);

    // ---- type scale & families ----
    const tot = sizes.reduce((s, x) => s + x.n, 0);
    const sorted = sizes.slice().sort((a, b) => a.fs - b.fs);
    let acc = 0, body = sorted.length ? sorted[0].fs : 16;
    for (const x of sorted) { acc += x.n; if (acc >= tot / 2) { body = x.fs; break; } }
    const display = sizes.reduce((m, x) => Math.max(m, x.fs), 0);
    const typeRatio = display / Math.max(1, body);
    // a display moment belongs to glance and instrument screens; a list, feed, canvas or chat leads with its content
    const want = ["glance", "instrument"].includes(arch) ? (["input", "utility", "transition"].includes(role) ? R.quietRatio : R.displayRatio) : 0;
    if (want && texts.length > 4 && typeRatio < want) add("WARN", "flat-scale", `largest text is only ${typeRatio.toFixed(1)}× the body size (${want}× wanted here) — no first read (pillar 5)`);
    const famList = [...fams.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
    if (famList.length > 3) add("WARN", "too-many-families", `${famList.length} font families: ${famList.join(", ")}`);
    for (const f of famList) {
      const lf = f.toLowerCase();
      if (DEFAULT_FONTS.includes(lf)) add("WARN", "default-font", `"${f}" is an unexamined default — keep it only with a stated reason`);
      const generic = ["sans-serif", "serif", "monospace", "system-ui", "-apple-system", "ui-sans-serif", "ui-serif", "ui-monospace", "ui-rounded", "blinkmacsystemfont", "cursive"].includes(lf);
      if (!generic && document.fonts && ![...(famW[f] || ["normal 400"])].some((w) => document.fonts.check(`${w} 16px "${f}"`))) add("WARN", "font-not-loaded", `"${f}" did not load — the screen is rendering a fallback`);
    }

    // ---- palette ----
    const hueBins = new Map(); const pal = new Map();
    const note = (c, w) => {
      if (!c || c.a < 0.3) return;
      const h = hsl(c); const k = hex(c); pal.set(k, (pal.get(k) || 0) + w);
      if (h.s > 0.35 && h.l > 0.18 && h.l < 0.86) { const bin = Math.round(h.h / 30) % 12; hueBins.set(bin, (hueBins.get(bin) || 0) + w); }
    };
    for (const el of scr.querySelectorAll("*")) {
      if (ignored(el)) continue;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const a = Math.min(r.width * r.height, sArea) / sArea;
      note(rgba(cs.backgroundColor), a);
      if (el instanceof SVGElement && el.tagName !== "svg") { note(rgba(cs.fill), a); }
      if (/gradient/.test(cs.backgroundImage)) {
        const stops = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(rgba).filter(Boolean).map(hsl);
        if (stops.filter((h) => h.s > 0.3 && h.h >= 220 && h.h <= 300).length >= 2) add("WARN", "ai-gradient", "purple/blue gradient — the most recognisable AI tell");
      }
    }
    for (const it of texts) note(rgba(it.cs.color), 0.002 * it.text.length);
    const sigBins = [...hueBins.entries()].filter(([, w]) => w > 0.004);
    if (sigBins.length > 3) add("WARN", "too-many-hues", `${sigBins.length} distinct accent hue families — one ground, one accent, tones of those`);

    // ---- realism ----
    const statusTime = texts.some((t) => t.box.top - S.top < 64 && /^\d{1,2}:\d{2}$/.test(t.text));
    if (!statusTime) add("WARN", "no-status-bar", "no status-bar time in the top 64px — real chrome sells the screen (pillar 4)");

    const fixed = scr.closest("[data-appearance]");
    out.push({
      findings, pix, heroRect: owesHero ? heroRect : null,
      metrics: {
        role, arch, space: space && dead > R.deadWarn && !strict ? space : null,
        appearance: fixed ? (fixed.getAttribute("data-appearance") || "").trim() : "",
        deadBand: Math.round(dead * 100), heroCoverage: Math.round(heroCov * 100), hero: heroDesc,
        typeRatio: +typeRatio.toFixed(1), body: +body.toFixed(1), display: +display.toFixed(1), families: famList,
        hueFamilies: sigBins.length, palette: [...pal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
        texts: texts.length, width: Math.round(S.width), height: Math.round(S.height),
      },
    });
  }
  return out;
}

// contrast, hidden text and flat heroes: the page says what the ink is, the pixels say what is behind it
function settlePixels(scr, res) {
  const add = (level, code, msg) => scr.findings.push({ level, code, msg });
  const tol = 0.05; // two decimals of rounding never decide a finding
  scr.pix.forEach((it, k) => {
    const r = res.text[k];
    if (!r) return;
    const readable = !it.svg && it.len >= 3 && r.area >= 400;
    if (r.none) { if (readable) add("WARN", "hidden-text", `text paints no pixels — covered by something, or drawn in the colour behind it: "${it.text}"`); return; }
    const v = r.maskEmpty ? r.med : r.p20;
    const where = r.med - r.p20 > 1 ? " where it crosses the picture behind it" : "";
    if (it.svg) {
      if (v < RULES.contrastFail - tol) add("WARN", "lettering-contrast", `${v.toFixed(2)}:1 lettering inside an illustration${where} (fine as texture, not if a person must read it): "${it.text}"`);
    } else if (!it.fg) {
      if (v < RULES.contrastFail - tol) add("WARN", "contrast", `${v.toFixed(2)}:1 measured from the pixels (gradient-filled text): "${it.text}"`);
    } else if (v < RULES.contrastFail - tol) add("FAIL", "contrast", `${v.toFixed(2)}:1 contrast${where}: "${it.text}"`);
    else if (!it.large && v < RULES.contrastBody - tol) add("WARN", "contrast", `${v.toFixed(2)}:1${where} (body text wants ${RULES.contrastBody}:1): "${it.text}"`);
    if (r.maskEmpty && v >= RULES.contrastFail && readable) add("WARN", "hidden-text", `text paints no pixels — something is covering it: "${it.text}"`);
  });
  if (res.flat !== null && res.flat >= RULES.flatHero) add("WARN", "empty-hero", `${Math.round(res.flat * 100)}% of the largest picture (${scr.metrics.hero}) is one flat colour — is there a picture carrying the state, or a tinted box? (pillar 1)`);
}

// ---------- one pass ----------
async function runPass({ key, dark = false, size = null, mutate = null, pixels = false, save = false }) {
  await open(dark);
  const screens = await mark();
  if (!screens.length) return null;
  let sized = true;
  if (size) { sized = await page.evaluate(resizeScreens, size); await page.waitForTimeout(350); }
  if (mutate) { await page.evaluate(mutate, RULES); await page.waitForTimeout(250); }
  await freeze();
  if (screens.length !== await page.locator("[data-l9-idx]").count()) {
    console.error("Screens re-rendered during the audit (live timers or a framework re-render). Freeze the page or pass --screen.");
  }
  const shots = [];
  if (pixels) for (const s of screens) shots.push(await at(s).screenshot(save ? { path: path.join(OUT, `${nn(s)}-${s.name}.png`) } : {}));
  await page.screenshot({ path: path.join(OUT, key === "base" ? "sheet.png" : `sheet-${key}.png`), fullPage: true });
  const bare = [];
  if (pixels) {
    await page.evaluate(hideText);
    for (const s of screens) bare.push(await at(s).screenshot(save ? { path: path.join(OUT, "blind", `notext-${nn(s)}.png`) } : {}));
    await page.evaluate(showText);
    if (save) for (const s of screens) fs.copyFileSync(path.join(OUT, `${nn(s)}-${s.name}.png`), path.join(OUT, "blind", `screen-${nn(s)}.png`));
  }
  const scan = await page.evaluate(scanPage, { R: RULES });
  if (pixels) {
    for (let k = 0; k < screens.length; k++) {
      const res = await helper.evaluate((x) => window.L9.analyze(x), { a: b64(shots[k]), b: b64(bare[k]), scale: SCALE, items: scan[k].pix, hero: scan[k].heroRect });
      settlePixels(scan[k], res);
    }
  }
  return { screens, scan, shots, sized };
}

// ---------- the press pass: does anything answer a finger? ----------
async function pressPass(screens) {
  const out = { tested: 0, silent: [], driven: [], notes: [] };
  await open(DARK);
  await mark();
  await page.waitForTimeout(600);
  // loops would read as a response; the things a finger starts must still run
  await page.evaluate(() => { for (const a of document.getAnimations()) { try { const t = a.effect && a.effect.getComputedTiming(); if (t && !Number.isFinite(t.endTime)) a.pause(); } catch {} } });
  const plan = await page.evaluate(() => {
    const CTL = "button, a[href], [role=button], input[type=button], input[type=submit], summary";
    const res = [];
    document.querySelectorAll("[data-l9-idx]").forEach((scr) => {
      const k = +scr.getAttribute("data-l9-idx");
      const els = [...new Set([...scr.querySelectorAll(CTL), ...scr.querySelectorAll("[data-interaction], [data-hold]")])]
        .filter((el) => !el.closest("[data-audit-ignore]"))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter((x) => x.r.width >= 20 && x.r.height >= 20)
        .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height);
      els.forEach((x, j) => {
        const id = `${k}-${j}`; x.el.setAttribute("data-l9-ctl", id);
        const label = (x.el.getAttribute("aria-label") || x.el.innerText || x.el.tagName).replace(/\s+/g, " ").trim().slice(0, 40);
        let spec = x.el.getAttribute("data-interaction");
        if (!spec && x.el.hasAttribute("data-hold")) spec = "hold:" + (parseInt(x.el.getAttribute("data-hold"), 10) || 1100);
        res.push({ id, k, j, label, spec: spec || "", ctl: x.el.matches(CTL) });
      });
    });
    return res;
  });
  const boxOf = async (id) => { const l = page.locator(`[data-l9-ctl="${id}"]`).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); return l.boundingBox().catch(() => null); };
  const away = async () => { await page.mouse.move(2, 2); await page.mouse.up(); };

  // 1. a pressed state: every screen's largest control first, then its next two, 30 at most
  const picks = plan.filter((c) => c.ctl && c.j < 4).sort((a, b) => a.j - b.j || a.k - b.k).slice(0, 30);   // a ruler or a card is driven, not pressed
  for (const c of picks) {
    const box = await boxOf(c.id);
    if (!box) continue;
    const clip = { x: Math.max(0, box.x - 4), y: Math.max(0, box.y - 4), width: box.width + 8, height: box.height + 8 };
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(160);
    const before = await page.screenshot({ clip });
    await page.mouse.down();
    await page.waitForTimeout(230);
    const during = await page.screenshot({ clip });
    await away();                                   // released off the control: no click, no navigation
    await page.waitForTimeout(280);
    out.tested++;
    if (await pxDiff(before, during) < 0.002) out.silent.push({ k: c.k, label: c.label });
  }

  // 2. marked interactions, driven for real and kept as a strip
  const marked = plan.filter((c) => c.spec).slice(0, 10);
  for (const c of marked) {
    const s = screens[c.k]; if (!s) continue;
    const box = await boxOf(c.id);
    if (!box) continue;
    const [kind, param] = c.spec.split(":");
    const shot = () => at(s).screenshot();
    const cx0 = box.x + box.width / 2, cy0 = box.y + box.height / 2;
    const idle = await shot();
    await page.waitForTimeout(300);
    const f0 = await shot();
    let f1, f2, labels;
    await page.mouse.move(cx0, cy0);
    if (kind === "tap") {
      await page.mouse.down(); await page.mouse.up();
      await page.waitForTimeout(150); f1 = await shot();
      await page.waitForTimeout(400); f2 = await shot();
      labels = ["before", "150 ms", "550 ms", "settled"];
    } else if (kind === "drag") {
      const [dx, dy] = (param || "120,0").split(",").map(Number);
      await page.mouse.down();
      for (let i = 1; i <= 3; i++) { await page.mouse.move(cx0 + (dx * i) / 6, cy0 + ((dy || 0) * i) / 6); await page.waitForTimeout(50); }
      f1 = await shot();
      for (let i = 4; i <= 6; i++) { await page.mouse.move(cx0 + (dx * i) / 6, cy0 + ((dy || 0) * i) / 6); await page.waitForTimeout(50); }
      f2 = await shot();
      await page.mouse.up();
      labels = ["before", "half way", "at the end", "released"];
    } else {
      const ms = Math.min(6000, parseInt(param, 10) || 1100);
      await page.mouse.down();
      await page.waitForTimeout(ms / 2); f1 = await shot();
      await page.waitForTimeout(ms / 2 + 300); f2 = await shot();
      await page.mouse.up();
      labels = ["before", "held half", "held full", "released"];
    }
    await page.waitForTimeout(750);
    const f3 = await shot();
    await away();
    const noise = await pxDiff(idle, f0);
    const change = Math.max(await pxDiff(f0, f1), await pxDiff(f0, f2), await pxDiff(f0, f3));
    const file = `interaction-${nn(s)}-${s.name}${marked.filter((m) => m.k === c.k).length > 1 ? "-" + c.j : ""}.png`;
    const strip = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 1 });
    await strip.setContent(`<body style="margin:0;padding:20px;width:max-content;background:#1b1b1b;display:flex;gap:20px;font:600 13px system-ui;color:#fff">` +
      [f0, f1, f2, f3].map((f, i) => `<figure style="margin:0"><img src="data:image/png;base64,${b64(f)}" style="width:300px;display:block"><figcaption style="padding:8px 2px">${labels[i]}</figcaption></figure>`).join("") + `</body>`);
    await strip.waitForTimeout(250);
    await strip.locator("body").screenshot({ path: path.join(OUT, file) });
    await strip.close();
    out.driven.push({ k: c.k, label: c.label, spec: c.spec, file, dead: change <= Math.max(0.002, noise * 2) });
  }
  if (!marked.length) out.notes.push(`no interaction is marked (data-interaction="hold|tap|drag:dx,dy" on the element a finger touches), so pillar 8 cannot be checked from stills`);
  return out;
}

// ---------- run ----------
const base = await runPass({ key: "base", dark: DARK, pixels: true, save: true });
if (!base) {
  console.error("No screens found. Add data-screen=\"name\" to each phone screen, or pass --screen <selector>.");
  await browser.close();
  process.exit(2);
}
const screens = base.screens;
const all = base.scan.map((s) => s.findings.map((f) => ({ pass: "base", ...f })));
const STRUCT = new Set(["offscreen", "clipped", "collision", "truncated", "wrapped", "tiny-tap"]);   // what a size or content change can break
const SEEN = new Set(["contrast", "lettering-contrast", "hidden-text", "no-affordance"]);
const gate = [];
const globals = [];
const tally = (k) => { const g = all.flatMap((list) => group(list)).filter((f) => f.pass === k); return { fail: g.filter((f) => f.level === "FAIL").length, warn: g.filter((f) => f.level === "WARN").length }; };
const word = (t) => (t.fail ? `**${t.fail} FAIL**` : t.warn ? `${t.warn} WARN to answer` : "pass");

// keep only what a pass adds: a finding the base pass already made is not a new one
function merge(key, scan, keep, soft) {
  scan.forEach((s, k) => {
    if (!all[k]) return;
    const known = new Set(all[k].filter((f) => f.pass === "base").map((f) => f.code + f.msg));
    for (const f of s.findings) {
      if (!keep.has(f.code) || known.has(f.code + f.msg)) continue;
      all[k].push({ pass: key, level: soft && f.level === "FAIL" ? "WARN" : f.level, code: f.code, msg: f.msg });
    }
  });
}
gate.push(["Readable and tappable, as drawn", word(tally("base"))]);

let press = null;
if (!QUICK) {
  for (const key of ["small", "large"]) {
    const size = RULES.sizes[key];
    const p = await runPass({ key, dark: DARK, size });
    const label = `Fits a ${key} phone (${size[0]} × ${size[1]})`;
    if (!p || p.screens.length !== screens.length) { gate.push([label, "not run: the screens could not be found again"]); continue; }
    if (!p.sized) globals.push({ level: "WARN", code: "fixed-size", msg: `the screens would not take ${size[0]} × ${size[1]} (a fixed or !important size): the ${key}-phone check is unproven` });
    merge(key, p.scan, STRUCT, false);
    gate.push([label, p.sized ? word(tally(key)) : "unproven: the screens would not resize"]);
  }
  if (!DARK) {
    const p = await runPass({ key: "dark", dark: true, pixels: true });
    if (!p || p.screens.length !== screens.length) gate.push(["Dark appearance", "not run: the screens could not be found again"]);
    else {
      let moved = 0;
      for (let k = 0; k < screens.length; k++) moved = Math.max(moved, await pxDiff(base.shots[k], p.shots[k]));
      const why = base.scan.map((s) => s.metrics.appearance).find(Boolean);
      if (moved < 0.02) {
        if (why) gate.push(["Dark appearance", `one appearance on purpose: "${why}"`]);
        else { globals.push({ level: "WARN", code: "no-dark", msg: `nothing changes under prefers-color-scheme: dark — design the dark variant, or state why the app has one appearance (data-appearance="why" on <html>)` }); gate.push(["Dark appearance", "no dark variant: answer it"]); }
      } else { merge("dark", p.scan, SEEN, false); gate.push(["Dark appearance", word(tally("dark"))]); }
    }
  }
  for (const [key, label, mutate] of [["stress", `Long content (every string +${Math.round(RULES.grow * 100)}%)`, growText], ["text-xl", `Large text (Dynamic Type XL, × ${RULES.xlBody})`, growType]]) {
    const p = await runPass({ key, dark: DARK, mutate });
    if (!p || p.screens.length !== screens.length) { gate.push([label, "not run: the screens could not be found again"]); continue; }
    merge(key, p.scan, key === "text-xl" ? new Set([...STRUCT].filter((c) => c !== "wrapped")) : STRUCT, true);   // large text may wrap; it may not clip, collide or leave
    gate.push([label, word(tally(key))]);
  }
  if (INTERACT) {
    press = await pressPass(screens);
    const quiet = new Map();
    for (const s of press.silent) quiet.set(s.k, [...(quiet.get(s.k) || []), s.label]);
    for (const [k, names] of quiet) all[k].push({ pass: "press", level: "WARN", code: "no-press-state", msg: `no pressed state on: ${names.map((n) => `"${n}"`).join(", ")}` });
    for (const d of press.driven) if (d.dead) all[d.k].push({ pass: "press", level: "FAIL", code: "dead-interaction", msg: `"${d.label}" (${d.spec}) changes nothing on screen when driven — a described interaction scores 0 (pillar 8)` });
    for (const n of press.notes) globals.push({ level: "WARN", code: "no-interaction", msg: n });
    gate.push(["Answers a finger", `${press.tested} controls pressed, ${press.driven.length} interaction(s) driven: ${word(tally("press"))}`]);
  }
} else {
  gate.push(["Small phone, large phone, dark, long content, large text, presses", "**not run** (--quick): the Works gate is unproven"]);
}
gate.push(["Clear to a stranger (the blind read)", "**not run by this script** — send blind-read.md to a fresh reader"]);
await browser.close();

// ---------- the message for the fresh reader ----------
const list = (pre) => screens.map((s) => `- ${path.join(OUT, "blind", `${pre}-${nn(s)}.png`)}`).join("\n");
fs.writeFileSync(path.join(OUT, "blind-read.md"), `# Blind read

A reader who has seen nothing: not the brief, not the concept, not this conversation, not the
file names of the mockup. A fresh agent or a person. One reader, two messages, in this order.

## 0. Before you send anything, write what you expect

One line per screen, in a file or in your notes: **app · the state right now · the one thing
to tap next**. Written first, so the answers cannot bend it.

## 1. First message: the pictures alone

> These are phone screens with every word and number removed. For each image, in one or two
> lines: what kind of app is this, and what is the screen telling its user right now (how
> much, how far, how soon, what status)? Say "cannot tell" when you cannot. Do not guess from
> file names.

${list("notext")}

## 2. Second message, to the same reader, after it has answered the first

> Now the same screens as shipped, in the same order. For each one:
> 1. What app is this, and what is this screen for?
> 2. What is the situation right now?
> 3. What one thing would you tap next, and what do you expect to happen?
> 4. Is there anything you cannot read, cannot tell is tappable, or do not understand?
> Answer from a first look. Do not study the fine print.

${list("screen")}

## 3. Reading the answers

- Answers 1–3 match your line on every screen: **Clear** passes.
- The reader misnames the state or the next tap on a home, detail or entry screen: the Works
  gate fails (cap 6). Change the screen. Never re-brief the reader, and never ask again with
  hints: a second reader must be as fresh as the first.
- First message: the reader reads the state roughly right from the picture alone (about half
  full, nearly time, three of five done): pillar 1 may score 1 on that screen. "Cannot tell",
  or wrong: pillar 1 is 0.5 at most there, whatever was intended. Skip this for list, feed and
  conversation screens, whose picture is their content.
- Everything in answer 4 is a finding: fix it or answer it in one line.
`);

// ---------- report ----------
const L = [];
let fails = 0, warns = 0;
L.push(`# Level Nine audit`, ``, `- source: ${target}`, `- screens: ${screens.length}`, `- shots: ${OUT}`, ``);
if (pageErrors.length) { L.push(`## Page errors (fix first)`, ...[...new Set(pageErrors)].slice(0, 20).map((e) => `- ${e}`), ``); }
L.push(`## The Works gate (pass every line before any score: SKILL.md §2)`, ``, `| Check | Result |`, `|---|---|`, ...gate.map(([a, b]) => `| ${a} | ${b} |`), ``);
L.push(`| # | screen | role | structure | dead band | hero | type ratio | hue families | fonts |`, `|---|---|---|---|---|---|---|---|---|`);
screens.forEach((s, k) => {
  const m = base.scan[k].metrics;
  L.push(`| ${k + 1} | ${s.name} | ${m.role} | ${m.arch} | ${m.deadBand}% | ${m.heroCoverage}% ${m.hero ? "(" + m.hero + ")" : ""} | ${m.typeRatio}× (${m.body}→${m.display}px) | ${m.hueFamilies} | ${m.families.join(", ")} |`);
});
L.push(``);
const spaces = screens.map((s, k) => [s, base.scan[k].metrics]).filter(([, m]) => m.space);
if (spaces.length) {
  L.push(`## Defended space (check each reason with the fill test)`);
  for (const [s, m] of spaces) L.push(`- ${s.name} (${m.role}): ${m.deadBand}% band — "${m.space}"`);
  L.push(``);
}
if (globals.length) {
  L.push(`## The whole set`);
  for (const g of globals) { L.push(`- **${g.level}** \`${g.code}\` ${g.msg}`); if (g.level === "FAIL") fails++; else warns++; }
  L.push(``);
}
const PASS_NAME = { base: "", small: `at ${RULES.sizes.small.join(" × ")}`, large: `at ${RULES.sizes.large.join(" × ")}`, dark: "in dark", stress: "with long content", "text-xl": "at large text", press: "when pressed" };
// one line per kind of finding: 26 tick labels at 10.5px is one mistake made 26 times
function group(list) {
  const by = new Map();
  for (const x of new Map(list.map((x) => [x.pass + x.level + x.code + x.msg, x])).values()) {
    const m = /^(.*): ("[^"]*"(?: × "[^"]*")?)$/s.exec(x.msg);
    const key = x.pass + x.level + x.code + (m ? m[1].replace(/\d+(\.\d+)?/g, "#") : x.msg);
    const g = by.get(key);
    if (!g) by.set(key, { ...x, stem: m ? m[1] : null, what: m ? [m[2]] : [] });
    else if (m) g.what.push(m[2]);
  }
  return [...by.values()].map(({ stem, what, ...x }) => {
    if (what.length > 1) x.msg = `${what.length} × ${stem}: ${what.slice(0, 4).join(", ")}${what.length > 4 ? ` and ${what.length - 4} more` : ""}`;
    return x;
  });
}
const flat = [];
screens.forEach((s, k) => {
  const uniq = group(all[k]);
  flat.push(uniq);
  if (!uniq.length) return;
  L.push(`## ${k + 1} · ${s.name}`);
  for (const x of uniq.sort((a, b) => (a.level === b.level ? 0 : a.level === "FAIL" ? -1 : 1))) {
    L.push(`- **${x.level}** \`${x.code}\`${PASS_NAME[x.pass] ? ` *${PASS_NAME[x.pass]}*` : ""} ${x.msg}`);
    if (x.level === "FAIL") fails++; else warns++;
  }
  L.push(``);
});
if (press && press.driven.length) {
  L.push(`## Interactions driven (open each strip: pillar 8 is judged from these frames, not from a description)`);
  for (const d of press.driven) L.push(`- ${screens[d.k].name}: "${d.label}" (${d.spec}) → ${d.file}${d.dead ? " — **nothing changed**" : ""}`);
  L.push(``);
}
const codes = new Set(flat.flat().map((x) => x.code));
L.push(`## What this implies for the score`);
if (fails) L.push(`- ${fails} FAIL(s): the Works gate is not passed, so the design is **capped at 6** until they are fixed (a broken screen cannot be a 9).`);
if (QUICK) L.push(`- --quick skipped the size, dark, content and press passes: a gate that was not run **caps at 8**.`);
L.push(`- The blind read is still to do (blind-read.md). Not run: **capped at 8**. Failed on a home, detail or entry screen: **capped at 6**.`);
if (codes.has("dead-band") || codes.has("large-band")) L.push(`- Empty bands: pillar 2 (coverage) is at risk — on a status screen the empty middle is the #1 reason designs stall at 6–7. On calm roles, run the fill test (references/levels.md): space with a job is not dead.`);
const calm = screens.filter((s, k) => !["home", "detail"].includes(base.scan[k].metrics.role));
if (calm.length) L.push(`- Calm roles declared (${calm.map((s) => s.name).join(", ")}): check each role against what the screen actually does. A status screen marked calm to escape the dead-band check is a defect.`);
if (codes.has("no-hero") || codes.has("empty-hero")) L.push(`- Small, missing or empty hero picture: pillar 1 (the picture holds the data) is probably at 0 on those screens.`);
if (codes.has("flat-scale")) L.push(`- Flat type scale: pillar 5 needs one first read (a display moment ≥ ${RULES.displayRatio}× the body size on a glance or instrument screen).`);
if (codes.has("no-status-bar")) L.push(`- No status bar: pillar 4 (real app chrome) — mockups without chrome read as posters.`);
if (codes.has("emoji") || codes.has("ai-gradient")) L.push(`- Emoji / AI gradient present: **capped at 4** until removed.`);
L.push(`- The script cannot see taste. Open every PNG at full size and score the nine pillars yourself (references/levels.md).`);
fs.writeFileSync(path.join(OUT, "report.md"), L.join("\n") + "\n");
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({
  source: target, out: OUT, fails, warns, quick: QUICK, rules: RULES, gate, globals,
  interactions: press ? press.driven.map((d) => ({ screen: screens[d.k].name, label: d.label, spec: d.spec, file: d.file, dead: d.dead })) : [],
  screens: screens.map((s, k) => ({ name: s.name, metrics: base.scan[k].metrics, findings: flat[k] })),
}, null, 2) + "\n");

console.log(L.join("\n"));
console.log(`\n${fails} FAIL · ${warns} WARN · report: ${path.join(OUT, "report.md")}`);
process.exit(fails ? 1 : 0);
