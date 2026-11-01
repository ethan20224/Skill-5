#!/usr/bin/env node
/**
 * Level Nine audit — render a mobile mockup, screenshot every phone screen,
 * and scan the rendered DOM for the defects and "level ceilings" that keep
 * AI-made app designs stuck at 5–7.
 *
 *   node audit.mjs mockup.html                     -> ./audit next to the file
 *   node audit.mjs mockup.html --out audit/r2      choose the output folder
 *   node audit.mjs mockup.html --scale 3           PNG pixel density (default 2)
 *   node audit.mjs mockup.html --wait 1800         ms to let fonts/animations settle (default 1400)
 *   node audit.mjs mockup.html --screen ".phone"   CSS selector for screens
 *   node audit.mjs mockup.html --dark              prefers-color-scheme: dark
 *   node audit.mjs http://localhost:5173/          URLs work too
 *
 * Screens are found by: --screen selector, else [data-screen] / .screen,
 * else any phone-shaped clipping box (320–480px wide, ~2:1, rounded, overflow hidden).
 *
 * Mark deliberate exceptions in markup:
 *   data-audit-ignore      skip this element and its subtree (e.g. a transient toast)
 *   data-bleed             text/art is allowed to run off-screen here
 *   data-role="…"          on a screen: home (default) | detail | input | entry | transition |
 *                          celebration | utility. A dead band > 28% FAILs on home and detail
 *                          screens only; on the calm roles it is a WARN to defend
 *   data-space="why"       an empty region that is there on purpose (calm roles only); the
 *                          report lists it so the critic can check the reason
 *
 * Writes: <out>/NN-name.png per screen, <out>/sheet.png, <out>/report.md
 * Exit code 1 if any FAIL. WARNs never fail the run, but every WARN must be
 * answered (fixed, or one line on why it is deliberate).
 *
 * playwright-core is resolved from the cwd first, then this skill folder.
 * Missing?  cd ~/.claude/skills/skill-5 && npm i
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  console.error("usage: node audit.mjs <mockup.html|url> [--out dir] [--scale 2] [--wait 1400] [--screen sel] [--dark]");
  process.exit(2);
}
const isUrl = /^https?:\/\//.test(target);
const URL_ = isUrl ? target : pathToFileURL(path.resolve(target)).href;
const OUT = path.resolve(arg("--out", isUrl ? "audit" : path.join(path.dirname(path.resolve(target)), "audit")));
const SCALE = parseFloat(arg("--scale", "2"));
const WAIT = parseInt(arg("--wait", "1400"), 10);
const SEL = arg("--screen", "");
fs.mkdirSync(OUT, { recursive: true });

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
const page = await browser.newPage({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: SCALE,
  colorScheme: has("--dark") ? "dark" : "light",
});
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
page.on("console", (m) => { if (m.type() === "error") pageErrors.push(m.text()); });

await page.goto(URL_, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(WAIT);
// Freeze motion so shots never catch a mid-transition blur: finish finite
// animations, pause infinite ones where they are.
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

const screens = await page.evaluate((sel) => {
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

if (!screens.length) {
  console.error("No screens found. Add data-screen=\"name\" to each phone screen, or pass --screen <selector>.");
  await browser.close();
  process.exit(2);
}

if (screens.length !== await page.locator("[data-l9-idx]").count()) {
  console.error("Screens re-rendered during the audit (live timers or a framework re-render). Freeze the page or pass --screen.");
}
for (const s of screens) {
  await page.locator(`[data-l9-idx="${s.i}"]`).screenshot({ path: path.join(OUT, `${String(s.i + 1).padStart(2, "0")}-${s.name}.png`) });
}
await page.screenshot({ path: path.join(OUT, "sheet.png"), fullPage: true });

const results = await page.evaluate(() => {
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
  const bgOf = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null; // gradient / image: unknown
      const c = rgba(cs.backgroundColor);
      if (c && c.a > 0.01) { layers.push(c); if (c.a > 0.99) break; }
    }
    let col = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) col = over(layers[i], col);
    return col;
  };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const contains = (o, i, t = 1.5) => i.left >= o.left - t && i.right <= o.right + t && i.top >= o.top - t && i.bottom <= o.bottom + t;
  const snip = (s) => (s.length > 42 ? s.slice(0, 40) + "…" : s);
  const CTL = "button, a[href], [role=button], input[type=button], input[type=submit], summary";
  const DEFAULT_FONTS = ["inter", "roboto", "poppins", "montserrat", "open sans", "arial", "helvetica", "lato", "helvetica neue"];

  const out = [];
  for (const scr of document.querySelectorAll("[data-l9-idx]")) {
    const S = scr.getBoundingClientRect();
    const sArea = S.width * S.height;
    const findings = [];
    const add = (level, code, msg) => findings.push({ level, code, msg });
    const sBg = rgba(getComputedStyle(scr).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    // the home-screen rules (hero, no dead band) apply in full only where the screen's job is status
    const ROLES = ["home", "detail", "input", "entry", "transition", "celebration", "utility"];
    let role = (scr.getAttribute("data-role") || "home").trim().toLowerCase();
    if (!ROLES.includes(role)) { add("WARN", "unknown-role", `data-role="${role}" is not one of ${ROLES.join(", ")} — judged as home`); role = "home"; }
    const strict = role === "home" || role === "detail";

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
    let unknownContrast = 0;
    for (const it of texts) {
      const { el, cs, box, text } = it;
      const fs = parseFloat(cs.fontSize);
      const inSvg = !!el.closest("svg");
      sizes.push({ fs, n: text.length });
      const fam = (cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim();
      if (fam) { fams.set(fam, (fams.get(fam) || 0) + text.length); (famW[fam] = famW[fam] || new Set()).add(cs.fontStyle + " " + cs.fontWeight); }

      if (!bleed(el) && !contains(S, box, 2)) add("FAIL", "offscreen", `text runs off the screen: "${snip(text)}"`);
      else {
        for (let n = el.parentElement; n && n !== scr; n = n.parentElement) {
          const ncs = getComputedStyle(n);
          const ov = ncs.overflow + " " + ncs.overflowX + " " + ncs.overflowY;
          if (/auto|scroll/.test(ov)) break; // scroller: deliberate
          if (/hidden|clip/.test(ov) && !contains(n.getBoundingClientRect(), box, 1.5) && !bleed(el)) { add("FAIL", "clipped", `text is cut off by a clipping parent: "${snip(text)}"`); break; }
        }
      }
      if (!inSvg && cs.overflow !== "visible" && el.scrollWidth > el.clientWidth + 1) add("WARN", "truncated", `text is truncated in its box: "${snip(text)}"`);
      if (inSvg) { if (fs < 9) add("WARN", "small-text", `${fs}px lettering inside an illustration: "${snip(text)}"`); }
      else if (fs < 9) add("FAIL", "tiny-text", `${fs}px text: "${snip(text)}"`);
      else if (fs < 10) add("WARN", "small-text", `${fs}px text (11px floor for labels; 10px only for tab-bar labels): "${snip(text)}"`);

      if (/\{\{|\}\}|\bundefined\b|\bNaN\b|\[object Object\]|lorem ipsum/i.test(text)) add("FAIL", "template-junk", `unrendered or placeholder text: "${snip(text)}"`);
      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if ((cp >= 0x1f000 && /\p{Extended_Pictographic}/u.test(ch)) || (cp >= 0x2600 && cp <= 0x27bf && /\p{Extended_Pictographic}/u.test(ch))) { add("FAIL", "emoji", `emoji used as UI: "${snip(text)}"`); break; }
      }
      if (/\b(John|Jane) Doe\b|\bAcme\b|\bLorem\b/i.test(text)) add("WARN", "generic-content", `generic placeholder content: "${snip(text)}"`);
      if (/^(good (morning|afternoon|evening)|welcome back|hello|hi),?\s+[A-Z]/i.test(text)) add("WARN", "greeting-header", `greeting header (an L4 tell): "${snip(text)}"`);

      if (!inSvg) {
        const fg = rgba(cs.color);
        const bg = bgOf(el);
        if (!fg || !bg) unknownContrast++;
        else {
          const f = { ...fg, a: fg.a * opacityOf(el, scr) };
          const cr = ratio(over(f, bg), bg);
          const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
          if (cr < 3) add("FAIL", "contrast", `${cr.toFixed(2)}:1 contrast: "${snip(text)}"`);
          else if (!large && cr < 4.5) add("WARN", "contrast", `${cr.toFixed(2)}:1 (body text wants 4.5:1): "${snip(text)}"`);
        }
      }
    }

    // ---- collisions (text over text) ----
    for (let a = 0; a < texts.length; a++) {
      for (let b = a + 1; b < texts.length; b++) {
        const A = texts[a], B = texts[b];
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
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
      if (r.width < 40 || r.height < 40) {
        if (!(r.width >= 44 && r.height >= 32)) add("WARN", "small-tap", `tap target ${Math.round(r.width)}×${Math.round(r.height)} (44×44 minimum): "${snip((c.innerText || c.getAttribute("aria-label") || c.tagName).trim())}"`);
      }
      const bgc = rgba(cs.backgroundColor);
      const bare = (!bgc || bgc.a < 0.05) && cs.backgroundImage === "none" && cs.boxShadow === "none" &&
        (parseFloat(cs.borderTopWidth) === 0 || (rgba(cs.borderTopColor) || { a: 0 }).a < 0.05);
      if (bare && r.width >= 160 && r.height >= 36) add("FAIL", "no-affordance", `a ${Math.round(r.width)}px-wide control renders as bare text (a reset rule probably beat its fill): "${snip((c.innerText || "").trim())}"`);
    }
    for (const img of scr.querySelectorAll("img")) if (img.complete && img.naturalWidth === 0 && !ignored(img)) add("FAIL", "broken-image", `image failed to load: ${snip(img.getAttribute("src") || "")}`);

    // ---- dead space & hero coverage ----
    const boxes = texts.map((t) => t.box);
    let hero = 0, heroDesc = "";
    for (const el of scr.querySelectorAll("*")) {
      if (ignored(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cl = { left: Math.max(r.left, S.left), top: Math.max(r.top, S.top), right: Math.min(r.right, S.right), bottom: Math.min(r.bottom, S.bottom) };
      const area = Math.max(0, cl.right - cl.left) * Math.max(0, cl.bottom - cl.top);
      if (area <= 0 || area > 0.85 * sArea) continue;
      const tag = el.tagName.toLowerCase();
      const cs = getComputedStyle(el);
      if (el.closest("svg") && tag !== "svg") continue;
      const visual = ["svg", "img", "canvas", "video", "picture"].includes(tag) || (cs.backgroundImage !== "none" && !/^(linear|radial)-gradient\(rgba\(0, 0, 0, 0\)/.test(cs.backgroundImage));
      const bgc = rgba(cs.backgroundColor);
      const filled = bgc && bgc.a > 0.08 && ratio(over(bgc, sBg), sBg) > 1.12;
      const bordered = parseFloat(cs.borderTopWidth) > 0 && (rgba(cs.borderTopColor) || { a: 0 }).a > 0.1;
      if (visual || filled || bordered || cs.boxShadow !== "none") boxes.push(cl);
      if ((visual || (filled && r.width < 0.95 * S.width && r.height > 0.12 * S.height)) && area > hero) { hero = area; heroDesc = tag + (el.getAttribute("class") ? "." + String(el.getAttribute("class")).split(" ")[0] : ""); }
    }
    const top = S.top + S.height * 0.07, bottom = S.bottom - S.height * 0.05;
    const iv = boxes.map((b) => [Math.max(top, b.top), Math.min(bottom, b.bottom)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
    let cur = top, gap = 0, gA = top, gB = top;
    for (const [a, b] of iv) { if (a - cur > gap) { gap = a - cur; gA = cur; gB = a; } cur = Math.max(cur, b); }
    if (bottom - cur > gap) { gap = bottom - cur; gA = cur; gB = bottom; }
    const dead = gap / S.height;
    // a data-space region covering at least half of the largest band defends it (calm roles only)
    let space = null;
    for (const el of scr.querySelectorAll("[data-space]")) {
      if (ignored(el)) continue;
      const r = el.getBoundingClientRect(), why = (el.getAttribute("data-space") || "").trim();
      if (why && gap > 0 && Math.min(r.bottom, gB) - Math.max(r.top, gA) >= 0.5 * gap) { space = why; break; }
    }
    const pct = Math.round(dead * 100);
    if (strict) {
      const note = space ? " (data-space does not excuse a dead band on a home or detail screen)" : "";
      if (dead > 0.28) add("FAIL", "dead-band", `${pct}% of the screen height is an empty band (pillar 2: the picture should be the space)${note}`);
      else if (dead > 0.15) add("WARN", "dead-band", `${pct}% of the screen height is an empty band — fill it with the hero, or defend the rest${note}`);
    } else if (dead > 0.15 && !space) {
      add("WARN", "dead-band", `${pct}% of the screen height is an empty band on ${/^[aeiou]/.test(role) ? "an" : "a"} ${role} screen — fine if it has a job (frames the focal object, a pause before the action, space above a pinned button, the end of a short list): run the fill test, then defend it in one line or mark it data-space="why"`);
    }
    const heroCov = hero / sArea;
    if (strict && heroCov < 0.12) add("WARN", "no-hero", `largest picture covers ${Math.round(heroCov * 100)}% of the screen (${role === "detail" ? "detail screens want the zoomed hero or chart to lead" : "core screens want 30–50%"}: pillar 1)`);

    // ---- type scale & families ----
    const tot = sizes.reduce((s, x) => s + x.n, 0);
    const sorted = sizes.slice().sort((a, b) => a.fs - b.fs);
    let acc = 0, body = sorted.length ? sorted[0].fs : 16;
    for (const x of sorted) { acc += x.n; if (acc >= tot / 2) { body = x.fs; break; } }
    const display = sizes.reduce((m, x) => Math.max(m, x.fs), 0);
    const typeRatio = display / Math.max(1, body);
    if (texts.length > 4 && typeRatio < 2.2) add("WARN", "flat-scale", `largest text is only ${typeRatio.toFixed(1)}× the body size — no display moment (pillar 5)`);
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

    out.push({
      findings,
      metrics: {
        role, space: space && dead > 0.15 && !strict ? space : null,
        deadBand: Math.round(dead * 100), heroCoverage: Math.round(heroCov * 100), hero: heroDesc,
        typeRatio: +typeRatio.toFixed(1), body, display, families: famList,
        hueFamilies: sigBins.length, palette: [...pal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
        texts: texts.length, unknownContrast,
      },
    });
  }
  return out;
});
await browser.close();

// ---- report ----
const L = [];
let fails = 0, warns = 0;
L.push(`# Level Nine audit`, ``, `- source: ${target}`, `- screens: ${screens.length}`, `- shots: ${OUT}`, ``);
if (pageErrors.length) { L.push(`## Page errors (fix first)`, ...pageErrors.slice(0, 20).map((e) => `- ${e}`), ``); }
L.push(`| # | screen | role | dead band | hero | type ratio | hue families | fonts |`, `|---|---|---|---|---|---|---|---|`);
screens.forEach((s, k) => {
  const m = results[k].metrics;
  L.push(`| ${k + 1} | ${s.name} | ${m.role} | ${m.deadBand}% | ${m.heroCoverage}% ${m.hero ? "(" + m.hero + ")" : ""} | ${m.typeRatio}× (${m.body}→${m.display}px) | ${m.hueFamilies} | ${m.families.join(", ")} |`);
});
L.push(``);
const spaces = screens.map((s, k) => [s, results[k].metrics]).filter(([, m]) => m.space);
if (spaces.length) {
  L.push(`## Defended space (check each reason with the fill test)`);
  for (const [s, m] of spaces) L.push(`- ${s.name} (${m.role}): ${m.deadBand}% band — "${m.space}"`);
  L.push(``);
}
screens.forEach((s, k) => {
  const f = results[k].findings;
  const uniq = [...new Map(f.map((x) => [x.level + x.code + x.msg, x])).values()];
  if (!uniq.length) return;
  L.push(`## ${k + 1} · ${s.name}`);
  for (const x of uniq.sort((a, b) => (a.level === b.level ? 0 : a.level === "FAIL" ? -1 : 1))) {
    L.push(`- **${x.level}** \`${x.code}\` ${x.msg}`);
    if (x.level === "FAIL") fails++; else warns++;
  }
  L.push(``);
});
const codes = new Set(results.flatMap((r) => r.findings.map((x) => x.code)));
L.push(`## What this implies for the score`);
if (fails) L.push(`- ${fails} FAIL(s): the design is **capped at 6** until they are fixed (a broken screen cannot be a 9).`);
if (codes.has("dead-band")) L.push(`- Dead bands: pillar 2 (coverage) is at risk — on a status screen the empty middle is the #1 reason designs stall at 6–7. On calm roles, run the fill test (references/levels.md): space with a job is not dead.`);
const calm = screens.filter((s, k) => !["home", "detail"].includes(results[k].metrics.role));
if (calm.length) L.push(`- Calm roles declared (${calm.map((s, k) => s.name).join(", ")}): check each role against what the screen actually does. A status screen marked calm to escape the dead-band check is a defect.`);
if (codes.has("no-hero")) L.push(`- Small or missing hero picture: pillar 1 (the picture holds the data) is probably at 0 on those screens.`);
if (codes.has("flat-scale")) L.push(`- Flat type scale: pillar 5 needs one display moment ≥ 2.5× the body size.`);
if (codes.has("no-status-bar")) L.push(`- No status bar: pillar 4 (real app chrome) — mockups without chrome read as posters.`);
if (codes.has("emoji") || codes.has("ai-gradient")) L.push(`- Emoji / AI gradient present: **capped at 4** until removed.`);
L.push(`- The script cannot see taste. Open every PNG at full size and score the nine pillars yourself (references/levels.md).`);
fs.writeFileSync(path.join(OUT, "report.md"), L.join("\n") + "\n");

console.log(L.join("\n"));
console.log(`\n${fails} FAIL · ${warns} WARN · report: ${path.join(OUT, "report.md")}`);
process.exit(fails ? 1 : 0);
