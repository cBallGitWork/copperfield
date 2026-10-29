import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { CUPS } from "@epl/core";
import { ANALYSIS } from "../../apps/companion/app/players/routes";
import { walkPaths } from "../../scripts/smoke/routes";
import {
  ALL_ROUTES,
  DESK_ROUTES,
  PLAYED_MATCH,
  UNPLAYED_MATCH,
  clubRoutes,
  playedMatchRoutes,
  playerRoutes,
  teamRoutes,
  unplayedMatchRoute,
} from "./routes.mjs";

// The instruments' route list, and the routes they discover, against a browser written here: no Chrome.

/** A page per route, each a selector and the href it finds; `discover` asks with the selector in its expression. */
function browser(pages) {
  let at = "";
  return {
    open: async (route) => {
      at = route;
    },
    js: async (expression) =>
      Object.entries(pages[at] ?? {}).find(([selector]) => expression.includes(selector))?.[1] ?? "",
  };
}

describe("the instruments' routes", () => {
  it("walk each declared cup but the first, which the bare page draws, by its id", () => {
    const cups = DESK_ROUTES.flatMap((route) => /^\/league\/cups\?cup=([^&]+)$/.exec(route)?.[1] ?? []);
    expect(cups).toEqual(CUPS.slice(1).map((cup) => cup.id));
  });

  it("name no player: a Fantrax id is discovered, never written down", () => {
    expect(DESK_ROUTES.filter((route) => /^\/players\/analysis\?/.test(route))).toEqual([]);
  });

  it("compare the directory's first man with whoever the board's own Compare link pairs him", async () => {
    const cdp = browser({
      "/players": { 'tbody a[href^="/players/"]': "/players/p1" },
      "/players?compare=p1": { 'tbody a[href^="/players/analysis?"]': "/players/analysis?a=p1&b=p2" },
    });
    expect(await playerRoutes(cdp)).toContain("/players/analysis?a=p1&b=p2");
  });

  it("measure every page the smoke walk visits without an id; Compare is the player's, discovered", () => {
    const measured = new Set(ALL_ROUTES.map((route) => route.split("?")[0]));
    const free = walkPaths({ teamId: null, playerId: null, rivalId: null, club: null, match: null }).map((path) => path.split("?")[0]);
    expect([...new Set(free)].filter((path) => path !== ANALYSIS && !measured.has(path))).toEqual([]);
  });

  it("walk a team's every tab, read off its folders, and its head-to-head", async () => {
    const tabs = readdirSync(new URL("../../apps/companion/app/squad/[teamId]/", import.meta.url), { withFileTypes: true }).filter((entry) => entry.isDirectory());
    const routes = await teamRoutes(browser({ "/squad": { 'a[href^="/squad/"]': "/squad/t1" } }));
    expect(routes).toEqual(["/squad/t1", ...tabs.map((tab) => `/squad/t1/${tab.name}`).sort(), "/league/matchups/t1"]);
  });

  it("walk a club's every tab, read off its folders", async () => {
    const routes = await clubRoutes(browser({ "/prem": { 'a[href^="/prem/club/"]': "/prem/club/3" } }));
    expect(routes).toEqual(["/prem/club/3", "/prem/club/3/depth", "/prem/club/3/fixtures", "/prem/club/3/set-pieces", "/prem/club/3/stats"]);
  });

  it("walk no team or club when none is linked", async () => {
    expect([...(await teamRoutes(browser({}))), ...(await clubRoutes(browser({})))]).toEqual([]);
  });

  it("measure a match nobody has played as well as one that was, off the rows that hold a score and those that do not", async () => {
    const cdp = browser({
      "/prem/fixtures?gw=1": { [PLAYED_MATCH]: "/prem/match/1" },
      "/prem/fixtures": { [UNPLAYED_MATCH]: "/prem/match/2" },
    });
    expect((await playedMatchRoutes(cdp))[0]).toBe("/prem/match/1");
    expect(await unplayedMatchRoute(cdp)).toEqual(["/prem/match/2"]);
  });
});
