// The design lint: fails a board (or any page) whose drawn text or stylesheet carries a tell that a
// script can see. The tells are DESIGN.md §10's Never list; the source names are §7's. What a script
// can't see (a colour on the wrong slot, a stat tile, a sentence telling a manager what he knows) is
// the review panel's job (.claude/skills/design/SKILL.md, step 5).
// Run by the /design skill's render check; draft-platform's scripts/design/lint.mjs is its parent.
//
//   node tools/ui/designlint.mjs <board.html>...

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const MIDDLE_DOT = "·";
const ENTITIES = { "&middot;": MIDDLE_DOT, "&#183;": MIDDLE_DOT, "&#xb7;": MIDDLE_DOT, "&amp;": "&", "&nbsp;": " " };
const ENTITY = new RegExp(Object.keys(ENTITIES).join("|"), "gi");
// Never drawn as text: the head, scripts and stylesheets.
const NOT_DRAWN = /<head\b[\s\S]*?<\/head>|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi;
const TAG = /<[^>]*>/g;
const STYLES = /<style\b[^>]*>([\s\S]*?)<\/style>|\sstyle="([^"]*)"/gi;

// "Key", "Legend:", "Difficulty key": a heading of up to four words ending in key or legend.
const KEY_HEADING = /^(?:\S+\s+){0,3}(?:key|legend)s?:?$|^(?:key|legend):/i;
// §7: no screen names its source. A control that leaves the app keeps the name, and says so with ↗.
const SOURCE = /\b(Fantrax|FPL|SofaScore|Understat|Opta|our model)\b/i;
const LEAVES_THE_APP = /↗/;
// The FPL tab keeps its name (§7): a run that is the word alone is the rail's plate.
const THE_FPL_TAB = /^FPL$/;
// A star typed as text: stars are drawn (DESIGN §2, Icons).
const TYPED_STAR = /[★☆]/;

// Stylesheet tells. Radius is 0 everywhere on the desk, save a crest's own circle, which is the crest.
const RADIUS = /border-radius\s*:\s*([^;}"]+)/i;
const SQUARE = /^0(?:px)?$/;
// A gradient is CM's index ramp (`cm-index`) and the ground's shade, nothing else: no gradient button.
const GRADIENT_ALLOWED = /^\s*(?:\.cm-index|\.ground|\.cm-ground)\b/;
const RULE = /([^{}]+)\{([^{}]*)\}/g;
const TRACKED_CAPS = /text-transform\s*:\s*uppercase[^}]*letter-spacing\s*:\s*0?\.\d|letter-spacing\s*:\s*0?\.\d[^}]*text-transform\s*:\s*uppercase/i;
const BLUR = /backdrop-filter\s*:\s*blur/i;
const SOFT_SHADOW = /box-shadow\s*:[^;}]*\b(?:[1-9]\d)px\s+(?:[1-9]\d*px\s+)?rgba?\(/i;

/** Every run of drawn text in a page, entities decoded. */
export function drawnText(html) {
  return html
    .replace(NOT_DRAWN, " ")
    .split(TAG)
    .map((run) => run.replace(ENTITY, (entity) => ENTITIES[entity.toLowerCase()]).trim())
    .filter(Boolean);
}

/** Every rule a page's stylesheets and style attributes declare, as [selector, body]. */
export function styleRules(html) {
  const rules = [];
  for (const [, sheet, inline] of html.matchAll(STYLES)) {
    if (inline !== undefined) rules.push(["(inline)", inline]);
    else for (const [, selector, body] of sheet.matchAll(RULE)) rules.push([selector.trim(), body]);
  }
  return rules;
}

function textProblems(runs) {
  const problems = new Set();
  for (const run of runs) {
    if (run.includes(MIDDLE_DOT)) problems.add(`a ${MIDDLE_DOT} string, "${run}": a rule or a column, never a dot (Never 4)`);
    if (KEY_HEADING.test(run)) problems.add(`a key or legend, "${run}": the colours carry it (Never 6)`);
    if (TYPED_STAR.test(run)) problems.add(`a star typed as text, "${run}": draw it (Never 4)`);
    const source = run.match(SOURCE);
    if (source && !LEAVES_THE_APP.test(run) && !THE_FPL_TAB.test(run)) problems.add(`names a source, "${run}": no screen names its source (§7)`);
  }
  return problems;
}

function styleProblems(rules) {
  const problems = new Set();
  for (const [selector, body] of rules) {
    const radius = body.match(RADIUS)?.[1].trim();
    if (radius && !SQUARE.test(radius) && !/crest/i.test(selector)) problems.add(`${selector}: border-radius ${radius}: radius is 0 (Never 2)`);
    if (/gradient\(/i.test(body) && !GRADIENT_ALLOWED.test(selector)) problems.add(`${selector}: a gradient off the index ramp and the ground (Never 3)`);
    if (TRACKED_CAPS.test(body)) problems.add(`${selector}: small tracked capitals are the paper's, never the desk's (Never 1)`);
    if (BLUR.test(body)) problems.add(`${selector}: a frosted blur; CM's panel is a tint over the ground (Never 3)`);
    if (SOFT_SHADOW.test(body)) problems.add(`${selector}: a soft drop shadow; depth is the 2px bevel (Never 3)`);
  }
  return problems;
}

/** What a page breaks, one line for each different problem. */
export function lintPage(html) {
  return [...textProblems(drawnText(html)), ...styleProblems(styleRules(html))];
}

function main(files) {
  if (files.length === 0) {
    console.error("usage: node tools/ui/designlint.mjs <board.html>...");
    return 2;
  }
  let failed = false;
  for (const file of files) {
    const problems = lintPage(readFileSync(file, "utf8"));
    for (const problem of problems) console.error(`${file}: ${problem}`);
    if (problems.length === 0) console.log(`${file}: clean`);
    failed ||= problems.length > 0;
  }
  return failed ? 1 : 0;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
