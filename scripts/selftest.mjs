#!/usr/bin/env node
/**
 * Proves the audit still catches what it claims to catch.
 *
 *   node scripts/selftest.mjs          (or: npm test)
 *
 * 1. Runs the audit on fixtures/defects.html: every planted mistake must be found on its
 *    own screen, and the screens that are correct on purpose must not be blamed.
 * 2. Runs the audit on the starters in assets/: they must come back with 0 FAIL and 0 WARN,
 *    in every pass.
 *
 * Run it after any change to audit.mjs, the template or the archetypes. Exit code 1 on any miss.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "level9-selftest-"));

// screen → what must be found ("pass:code") and what must not be (a bare code, in any pass)
const EXPECT = {
  "text-on-picture":      { must: ["base:contrast"] },
  "text-on-picture-ok":   { never: ["contrast", "hidden-text"] },
  "text-crosses-picture": { must: ["base:contrast"] },
  "gradient-ground":      { must: ["base:contrast"] },
  "gradient-text-ok":     { never: ["contrast", "hidden-text"] },
  "small-label":          { must: ["base:tiny-text"] },
  "tab-label-ok":         { never: ["tiny-text"] },
  "small-targets":        { must: ["base:small-tap", "base:tiny-tap"] },
  "native-controls-ok":   { never: ["small-tap", "tiny-tap"] },
  "lettering":            { must: ["base:lettering-contrast", "base:small-text"] },
  "flat-hero":            { must: ["base:empty-hero"] },
  "relabelled":           { must: ["base:large-band"] },
  "covered-label":        { must: ["base:hidden-text"] },
  "no-press-state":       { must: ["press:no-press-state"], never: ["empty-hero"] },
  "dead-hold":            { must: ["press:dead-interaction"] },
  "long-content":         { must: ["stress:wrapped"], never: ["base:wrapped"] },
  "wrapped-stat":         { must: ["base:wrapped"] },
  "fixed-pixels":         { must: ["small:offscreen"], never: ["base:offscreen"] },
  "fixed-height":         { must: ["text-xl:clipped"], never: ["base:clipped"] },
  "dark-forgot-ink":      { must: ["dark:contrast"], never: ["base:contrast"] },
  "scrolling-list-ok":    { never: ["offscreen", "clipped"] },
  "row-too-wide":         { must: ["base:offscreen"] },
};

const audit = (file, name) => {
  const out = path.join(tmp, name);
  const r = spawnSync(process.execPath, [path.join(here, "audit.mjs"), file, "--out", out], { encoding: "utf8" });
  const json = path.join(out, "report.json");
  if (!fs.existsSync(json)) { console.error(r.stdout + r.stderr); throw new Error("the audit did not finish on " + file); }
  return JSON.parse(fs.readFileSync(json, "utf8"));
};

let bad = 0;
const miss = (msg) => { bad++; console.log("  ✗ " + msg); };

console.log("1. known mistakes (fixtures/defects.html)");
const rep = audit(path.join(here, "fixtures", "defects.html"), "defects");
const seen = new Set(rep.screens.map((s) => s.name));
for (const [name, want] of Object.entries(EXPECT)) {
  if (!seen.has(name)) { miss(`${name}: the screen was not found`); continue; }
  const got = rep.screens.find((s) => s.name === name).findings;
  const has = (key) => got.some((f) => (key.includes(":") ? f.pass + ":" + f.code === key : f.code === key));
  for (const k of want.must || []) if (!has(k)) miss(`${name}: expected ${k}, got [${got.map((f) => f.pass + ":" + f.code).join(", ") || "nothing"}]`);
  for (const k of want.never || []) if (has(k)) miss(`${name}: ${k} was reported on a screen that is correct — ${got.find((f) => (k.includes(":") ? f.pass + ":" + f.code === k : f.code === k)).msg}`);
}
for (const s of rep.screens) if (!EXPECT[s.name]) miss(`${s.name}: a screen in the fixture has no expectation`);
if (!bad) console.log(`  ✓ ${Object.keys(EXPECT).length} screens: every planted mistake caught, no correct screen blamed`);

console.log("2. the starters must be clean in every pass");
for (const f of ["template.html", "archetypes.html"]) {
  const file = path.join(root, "assets", f);
  if (!fs.existsSync(file)) { console.log(`  – assets/${f} not present, skipped`); continue; }
  const r = audit(file, f.replace(".html", ""));
  if (r.fails || r.warns) {
    miss(`assets/${f}: ${r.fails} FAIL, ${r.warns} WARN`);
    for (const g of r.globals) console.log(`      ${g.level} ${g.code} ${g.msg}`);
    for (const s of r.screens) for (const x of s.findings) console.log(`      ${s.name} · ${x.pass} · ${x.level} ${x.code} ${x.msg}`);
  } else console.log(`  ✓ assets/${f}: ${r.screens.length} screens, 0 FAIL, 0 WARN`);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `\n${bad} problem(s). The audit, a starter, or an expectation is wrong.` : "\nAll good.");
process.exit(bad ? 1 : 0);
