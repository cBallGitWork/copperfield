// Every tappable thing on every route, against the floor its width has (docs/rules/PRODUCT.md). It names what is under
// the floor and never decides: the exceptions below are read out on every run, not hidden.
//   node tools/ui/tapfit.mjs [--team-cookie <file>]

import { AUDIT_WIDTHS, DESK, PHONE, connect, discover, parseArgs, teamCookie } from "./cdp.mjs";
import { ALL_ROUTES, FRONT_PAGE, clubRoutes, playedMatchRoutes, playerRoutes, teamRoutes } from "./routes.mjs";

/** This run's routes: the shared list plus the ids discovered below; a copy, so `routes.mjs` stays a declaration. */
const ROUTES = [...ALL_ROUTES];

/** Under a thumb a control is 44 and a `.cm-row` row 36 (Craig, 21 Oct 2026); above `lg` a row is 28 and a control 36. */
const THUMB = 44;
const THUMB_ROW = 36;
const DESK_ROW = 28;
const DESK_CONTROL = 36;
// Recorded exceptions, detected by structure and never by label (a label prefix once exempted "FPL" as "FP"):
// a column head is whatever sits inside a `<th>`; an inline link inside a sentence is a link in a `<p>` with text beside it.
// Anything else at 36 under a thumb declares it on itself, `min-h-9`, `max-lg:min-h-9` or `.cm-tab-compact` (the match
// screens' switches), and must clear 36.

/** Runs in the page. No backticks inside: it is a template literal. */
const MEASURE = `(function(){
  var nodes=Array.prototype.slice.call(
    document.querySelectorAll('a[href],button,select,input,[role=button],summary'));
  return JSON.stringify(nodes.flatMap(function(n){
    var r=n.getBoundingClientRect();
    // Nothing with no box: a screen-reader skip link is 1px until focused.
    if(!r.height||!r.width||n.closest('.sr-only')||n.classList.contains('sr-only')) return [];
    var label=(n.textContent||n.getAttribute('aria-label')||n.tagName).trim().replace(/\\s+/g," ");
    var p=n.closest('p');
    var prose=!!p && p.textContent.replace(n.textContent,"").trim().length>0;
    var head=!!n.closest('th');
    var cls=' '+(n.getAttribute('class')||'')+' ';
    var tight=cls.indexOf(' min-h-9 ')>=0||cls.indexOf(' max-lg:min-h-9 ')>=0||cls.indexOf(' cm-tab-compact ')>=0;
    return [{t:label.slice(0,24), h:Math.round(r.height),
             known:prose||head, tight:tight,
             // Either side of the element: a schedule tie wraps its row in the link, and a table row IS the link.
             row:String(n.className||"").indexOf('cm-row')>=0
                 || !!n.closest('.cm-row') || !!n.querySelector('.cm-row'),
             tag:n.tagName}];
  }));
})()`;

const { flags } = parseArgs(process.argv.slice(2));
const cdp = await connect();
await cdp.setCookie(teamCookie(flags));

// Per-record routes are discovered, never written down: their ids are the league's, FPL's or a story's, and move.
await cdp.setViewport(PHONE.width, DESK.height);
ROUTES.push(...(await teamRoutes(cdp)));

ROUTES.push(...(await clubRoutes(cdp)));

const played = await playedMatchRoutes(cdp);
ROUTES.push(...played);

// A match nobody has played is a different screen under the same two bars; the results list cannot produce one.
const coming = await discover(cdp, "/prem/fixtures", 'a[href^="/prem/match/"]');
if (coming && coming !== played[0]) ROUTES.push(coming);

const article = await discover(cdp, FRONT_PAGE, 'a[href^="/paper/"]');
if (article) ROUTES.push(article);

ROUTES.push(...(await playerRoutes(cdp)));

let failures = 0;
for (const width of AUDIT_WIDTHS) {
  for (const route of ROUTES) {
    await cdp.setViewport(width, DESK.height);
    await cdp.open(route, 2200);
    const all = JSON.parse(await cdp.js(MEASURE));
    const phone = width < 1024;
    const floor = (item) =>
      phone ? (item.row || item.tight ? THUMB_ROW : THUMB) : item.row ? DESK_ROW : DESK_CONTROL;
    const under = all.filter((item) => item.h < floor(item));
    const known = under.filter((item) => item.known);
    const news = under.filter((item) => !item.known);
    // Read out: a target declaring 36 off a `.cm-row`, and the rows at 36, so a run shows how many lean on each.
    const tight = phone ? all.filter((item) => item.tight && !item.row && !item.known && item.h >= THUMB_ROW && item.h < THUMB) : [];
    const rows = phone ? all.filter((item) => item.row && !item.known && item.h >= THUMB_ROW && item.h < THUMB) : [];
    failures += news.length;

    const note = news.length ? `${news.length} UNDER FLOOR` : "ok";
    const recorded = [known.length ? `${known.length} recorded exceptions` : "", tight.length ? `${tight.length} declared at 36` : "", rows.length ? `${rows.length} rows at 36` : ""];
    const aside = recorded.some(Boolean) ? `  (${recorded.filter(Boolean).join(", ")})` : "";
    console.log(`${width} ${route.padEnd(20)} ${note}${aside}`);
    for (const item of news) console.log(`      ${item.h}px ${item.tag} "${item.t}"`);
  }
}

cdp.close();
process.exit(failures ? 1 : 0);
