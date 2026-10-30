// The routes the instruments walk, in one place: a route this list does not name ships unmeasured.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { discover } from "./cdp.mjs";

/** Each declared cup but the first, which the bare `/league/cups` draws, by the ids core's `CUPS` declares. */
const CUP_ROUTES = (() => {
  const declared = readFileSync(new URL("../../packages/core/src/league/cups/declared.ts", import.meta.url), "utf8");
  const ids = [...declared.matchAll(/^ {4}id: "([^"]+)",$/gm)].map((match) => match[1]);
  if (ids.length === 0) throw new Error("tools/ui/routes.mjs: cannot read the cups' ids from cups/declared.ts");
  return ids.slice(1).map((id) => `/league/cups?cup=${id}`);
})();

/** Everything the desk draws, and so everything with the photographic ground behind it. */
export const DESK_ROUTES = [
  "/league",
  "/league/fixtures",
  "/league/transfers",
  "/league/waivers",
  "/league/team-stats",
  "/league/cups",
  "/scoring",
  ...CUP_ROUTES,
  // Retired into Fixtures; lands on the gameweek in focus, a played week's results between deadlines.
  "/league/matchups",
  "/squad",
  "/players",
  "/players/stats",
  // The fixture planner's phone view is a query, so the defence board is named too.
  "/players/teams",
  "/players/planner",
  "/players/planner?view=defence",
  "/matchday",
  // The Live tab's Top stats is a query, so nothing links a crawler to it.
  "/matchday?view=stats",
  "/fpl",
  "/news",
  // Not sections: reachable only from the rail's foot, the phone's drawer and the end of Read's strip.
  "/more",
  "/credits",
];

/** The competition's pages: on `sweep` and `tapfit`, not yet on `groundfit`. Gameweek 1 always exists, as smoke says. */
const PREM_ROUTES = ["/prem", "/prem/fixtures", "/prem/fixtures?gw=1"];

/** The front page as an instrument opens it: a signed-in cold open of a bare `/` lands on Mail or Live. */
export const FRONT_PAGE = "/?paper";

/** Newsprint, with no photograph under it, so `groundfit` has nothing to measure here. */
const PAPER_ROUTES = [FRONT_PAGE];

/** Every route worth measuring for contrast, overflow and tap targets. */
export const ALL_ROUTES = [...PAPER_ROUTES, ...DESK_ROUTES, ...PREM_ROUTES];

/** A dynamic route's tabs, read off the app's own folders under `dir` so the list cannot drift. */
function tabsOf(dir) {
  const at = new URL(`../../apps/companion/app/${dir}/`, import.meta.url);
  return readdirSync(at, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(new URL(`${entry.name}/page.tsx`, at)))
    .map((entry) => entry.name)
    .sort();
}

const MATCH_TABS = tabsOf("prem/match/[id]");
const TEAM_TABS = tabsOf("squad/[teamId]");
const CLUB_TABS = tabsOf("prem/club/[code]");

/** The views a tab switches with a query, which no folder shows: each club's board, the Fantasy Report, the pitch. */
const MATCH_VIEWS = ["stats?view=home", "stats?view=fantasy", "players?view=pitch"];

/** One match's overview, every tab under it, and the views its foot rows switch to. */
function matchRoutes(match) {
  return [match, ...[...MATCH_TABS, ...MATCH_VIEWS].map((tab) => `${match}/${tab}`)];
}

/** One team's board, every tab under it and its head-to-head, discovered off the squads list. */
export async function teamRoutes(cdp) {
  const team = await discover(cdp, "/squad", 'a[href^="/squad/"]');
  return team ? [team, ...TEAM_TABS.map((tab) => `${team}/${tab}`), `/league/matchups/${team.split("/").pop()}`] : [];
}

/** One club's page and every tab under it, discovered off the competition's front page. */
export async function clubRoutes(cdp) {
  const club = await discover(cdp, "/prem", 'a[href^="/prem/club/"]');
  return club ? [club, ...CLUB_TABS.map((tab) => `${club}/${tab}`)] : [];
}

/** A fixtures row holding a score, whose `Scoreline` rule is its only `aria-hidden`; a row to come holds a kickoff. */
export const PLAYED_MATCH = 'a[href^="/prem/match/"]:has(span[aria-hidden])';
export const UNPLAYED_MATCH = 'a[href^="/prem/match/"]:not(:has(span[aria-hidden]))';

/** A played match's screens, off the first round, as the bare list may open on a week not yet begun. */
export async function playedMatchRoutes(cdp) {
  const match = await discover(cdp, "/prem/fixtures?gw=1", PLAYED_MATCH);
  return match ? matchRoutes(match) : [];
}

/** A match nobody has played, a different screen under the same bars, off the week the list opens on. */
export async function unplayedMatchRoute(cdp) {
  const match = await discover(cdp, "/prem/fixtures", UNPLAYED_MATCH);
  return match ? [match] : [];
}

/** One player's screens, discovered off the directory's BODY: a bare selector finds Find's own tab strip first. Then
 *  Data's Compare, off the link the board gives the next man once he is chosen (`?compare=`), as no link reaches it bare. */
export async function playerRoutes(cdp) {
  const man = await discover(cdp, "/players", 'tbody a[href^="/players/"]');
  if (!man) return [];
  const pair = await discover(cdp, `/players?compare=${man.split("/").pop()}`, 'tbody a[href^="/players/analysis?"]');
  return [man, ...["data", "news", "compare", "data?season=all"].map((tab) => `${man}/${tab}`), ...(pair ? [pair] : [])];
}
