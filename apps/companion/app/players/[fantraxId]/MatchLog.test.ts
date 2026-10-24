import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, GameLogEntry, PlayerMatch, Ranked } from "@epl/core";
import MatchLog, { type Standing } from "./MatchLog";
import type { MatchRow } from "./matchRows";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const EVE: Club = { id: 1, code: 11, name: "Everton", shortName: "EVE" };

const row = (match: Partial<GameLogEntry>, paid: Partial<PlayerMatch> | null): MatchRow => ({
  fpl: {
    opponent: EVE,
    match: {
      gameweek: 6, fixtureId: 60, opponentClubId: 1, home: true, scored: 2, conceded: 2,
      minutes: 90, goals: 0, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0,
      saves: 4, fplPoints: 2, defensiveContribution: null,
      expectedGoals: 0, expectedAssists: 0, starts: 1, tackles: null, clearancesBlocksInterceptions: null,
      recoveries: null, expectedGoalsConceded: null, goalsConceded: 2, ...match,
    },
  },
  paid: paid === null ? null : {
    opponent: "EVE", home: true, points: 2, minutes: null, goals: null, assists: null,
    shots: null, shotsOnTarget: null, foulsCommitted: 0, foulsSuffered: 0, offsides: null, ...paid,
  },
  mark: null,
});

const ranked = (head: string, value: number | null, rank: number | null): Ranked => ({
  head, title: head, value, kind: head.startsWith("x") || head === "Prv" ? "expected" : "count", rank, of: 23,
});
const UNRANKED: Standing = { ranked: [], fpts: null, group: null, keeper: false };
const FORWARD: Standing = {
  ranked: [ranked("Min", 180, 4), ranked("G", 2, 1), ranked("xG", 1.4, 9), ranked("A", 0, 12), ranked("xA", 0.2, 15), ranked("Sh", 6, 3), ranked("KP", 4, 7), ranked("Def", 9, 20)],
  fpts: ranked("FPts", 30, 2),
  group: "forwards",
  keeper: false,
};
const KEEPER: Standing = {
  ranked: [ranked("Min", 180, 1), ranked("Sv", 8, 2), ranked("CS", 1, 3), ranked("Prv", 0.5, 4)],
  fpts: null,
  group: "goalkeepers",
  keeper: true,
};

/** The cells under one head, in row order: the matches, the foot's plate, then Total and Rank. */
function column(html: string, head: string): string[] {
  const text = (cell: string) => cell.replace(/<[^>]+>/g, "").trim();
  const thead = html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? "";
  const at = [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => text(m[1])).indexOf(head);
  if (at < 0) return [];
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  return [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(
    (m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1]))[at],
  );
}

/** The matches alone, the foot's plate and its two rows off. */
const matches = (html: string, head: string) => column(html, head).slice(0, -3);
/** The foot alone: [Total, Rank]. */
const foot = (html: string, head: string) => column(html, head).slice(-2);

const render = (rows: MatchRow[], standing: Standing = UNRANKED) => renderToStaticMarkup(createElement(MatchLog, { rows, standing }));

describe("the match log", () => {
  it("prints a clean sheet he did not keep as 0, and dashes one he was not on for", () => {
    const html = render([row({ cleanSheet: false }, {}), row({ cleanSheet: true, conceded: 0, fixtureId: 61 }, {}), row({ minutes: 0, fixtureId: 62 }, {})]);
    expect(matches(html, "CS")).toEqual(["0", "1", "—"]);
  });

  // N-1: seven noughts a row for a match he sat out read as a game he played and did nothing in.
  it("dashes every figure but his minutes for a match he was not on for, and keeps a played man's noughts", () => {
    const html = render([
      row({ tackles: 0, clearancesBlocksInterceptions: 0, recoveries: 0 }, { shots: 0 }),
      row({ minutes: 0, tackles: 0, clearancesBlocksInterceptions: 0, recoveries: 0, fixtureId: 61 }, { shots: 0 }),
    ]);
    expect(matches(html, "Min")).toEqual(["90", "0"]);
    for (const head of ["G", "A", "xG", "xA", "Def", "Sh", "FC", "FS"]) expect(matches(html, head)).toEqual([head.startsWith("x") ? "0.00" : "0", "—"]);
    expect(matches(html, "FPts")).toEqual(["2", "2"]);
  });

  it("prints his points in the reading cyan, match by match and in the Total, which still sums", () => {
    const html = render([row({}, {}), row({ fixtureId: 61 }, {})]);
    expect(html.match(/font-bold text-info[^"]*"[^>]*>2</g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(foot(html, "FPts")[0]).toBe("4");
  });

  it("stands down a column only matches he sat out would have filled", () => {
    const html = render([row({ minutes: 0 }, {}), row({ minutes: 0, fixtureId: 61 }, {})]);
    expect(matches(html, "Min")).toEqual(["0", "0"]);
    expect(matches(html, "G")).toEqual([]);
    expect(matches(html, "xG")).toEqual([]);
  });

  it("stands down a column no match of his measured, as Fantrax's keeper table has no shots", () => {
    const html = render([row({}, {}), row({ fixtureId: 61 }, {})]);
    expect(matches(html, "Sh")).toEqual([]);
    expect(matches(html, "Off")).toEqual([]);
    expect(matches(html, "FC")).toEqual(["0", "0"]);
    // The rule that starts Fantrax's account moves to its first column drawn.
    expect(html).toMatch(/<th[^>]*title="Fouls committed"[^>]*border-l/);
  });

  it("keeps a column one match measured, dashing the match Fantrax's window does not reach", () => {
    const html = render([row({}, { shots: 0 }), row({ fixtureId: 61 }, null)]);
    expect(matches(html, "Sh")).toEqual(["0", "—"]);
  });
});

describe("the match log's columns by role (N-14)", () => {
  const heads = (html: string) => [...html.matchAll(/<th[^>]*title="[^"]*"[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));

  it("never draws a keeper's goals, assists or expected figures, even the odd 0.01", () => {
    const html = render([row({ expectedAssists: 0.01, expectedGoalsConceded: 1.2, goalsConceded: 1 }, {})], KEEPER);
    for (const head of ["G", "A", "xG", "xA", "Def", "KP", "Sh"]) expect(heads(html), head).not.toContain(head);
    expect(matches(html, "Sv")).toEqual(["4"]);
    expect(matches(html, "Prv")).toEqual(["0.20"]);
  });

  it("never draws an outfielder's saves", () => {
    expect(heads(render([row({ saves: 0 }, {})]))).not.toContain("Sv");
  });

  it("counts his defending per match as Rankings counted it, and drops FPL's DefCon beside it", () => {
    const html = render([row({ tackles: 2, clearancesBlocksInterceptions: 3, recoveries: 4, defensiveContribution: 5 }, {})]);
    expect(matches(html, "Def")).toEqual(["9"]);
    expect(heads(html)).not.toContain("DC");
  });
});

describe("the match log's foot (N-13)", () => {
  const rows = [row({ goals: 2, expectedGoals: 1.4 }, { shots: 4, points: 20 }), row({ fixtureId: 61 }, { shots: 2, points: 10 })];

  it("closes on his season's Total and his Rank among his group, every old Rankings column among them", () => {
    const html = render(rows, FORWARD);
    expect(foot(html, "FPts")).toEqual(["30", "2nd"]);
    expect(foot(html, "G")).toEqual(["2", "1st"]);
    expect(foot(html, "xG")).toEqual(["1.40", "9th"]);
    for (const head of ["Min", "A", "xA", "Sh", "KP", "Def"]) expect(foot(html, head)[1], head).toMatch(/^\d+(st|nd|rd|th)$/);
    expect(matches(html, "KP")).toEqual(["—", "—"]);
    expect(html).toContain("Ranked among 23 forwards");
    expect(html).toContain('title="9th of 23"');
  });

  it("totals a column Rankings never had from his matches, and ranks it nowhere", () => {
    const html = render(rows, FORWARD);
    expect(foot(html, "FC")).toEqual(["0", "—"]);
    expect(foot(html, "CS")).toEqual(["0", "—"]);
  });

  it("dashes the total of a figure some match he played lacks, rather than print a short sum", () => {
    const html = render([row({}, { shots: 3 }), row({ fixtureId: 61 }, null)]);
    expect(foot(html, "Sh")).toEqual(["—", "—"]);
  });

  // #66: a man with no minutes has totals but no place.
  it("prints a man without minutes his totals and dashes his ranks", () => {
    const standing: Standing = { ...FORWARD, ranked: FORWARD.ranked.map((r) => ({ ...r, value: 0, rank: null })), fpts: null };
    const html = render([row({ minutes: 0 }, {})], standing);
    expect(foot(html, "Min")).toEqual(["0", "—"]);
    expect(foot(html, "G")).toEqual(["0", "—"]);
  });

  it("stands as a foot alone when FPL's game log is silent", () => {
    const html = render([], KEEPER);
    expect(foot(html, "Sv")).toEqual(["8", "2nd"]);
    expect(html).not.toContain("No match he has played");
  });

  it("puts Every match before the season maps on the Data tab", () => {
    const page = readFileSync(join(__dirname, "data/page.tsx"), "utf8");
    const season = page.slice(page.indexOf("<HeldNote"));
    expect(season.indexOf("<MatchLog")).toBeGreaterThan(-1);
    expect(season.indexOf("<MatchLog")).toBeLessThan(season.indexOf("{maps}"));
  });
});

// Craig, 24 Oct 2026: "needs both defcon types". Each match's DFP and DFP3, headed by who the league pays on each.
describe("the match log's DefCon", () => {
  const words = {
    DFP: { head: "DefCon DEF", name: "DefCon DEF", key: "DefCon DEF: tackles won, interceptions and blocks" },
    DFP3: { head: "DefCon M/F", name: "DefCon M/F", key: "DefCon M/F: tackles won, interceptions, blocks, clearances and recoveries" },
  };
  const html = renderToStaticMarkup(
    createElement(MatchLog, {
      rows: [{ ...row({}, null), defcon: { DFP: 4, DFP3: 9 } }, { ...row({ gameweek: 7, fixtureId: 70 }, null), defcon: null }],
      standing: UNRANKED,
      defconWords: words,
    }),
  );

  it("draws only the count he is paid on: a defender's DC D, never DC MF", () => {
    const own = renderToStaticMarkup(
      createElement(MatchLog, {
        rows: [{ ...row({}, null), defcon: { DFP: 4, DFP3: 9 } }],
        standing: UNRANKED,
        defconWords: words,
        defcon: ["DFP"],
      }),
    );
    expect(column(own, "DefCon DEF")[0]).toBe("4");
    expect(column(own, "DefCon M/F")).toEqual([]);
  });

  it("draws both counts a match, a dash where the week was not read", () => {
    expect(column(html, "DefCon DEF").slice(0, 2)).toEqual(["4", "—"]);
    expect(column(html, "DefCon M/F").slice(0, 2)).toEqual(["9", "—"]);
  });
});
