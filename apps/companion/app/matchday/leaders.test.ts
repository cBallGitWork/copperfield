import { describe, expect, it } from "vitest";
import type { Club, FootballPlayer, FootballSnapshot, LeagueScoring, PlayerMatchStats, PoolPlayer } from "@epl/core";
import { defconCounts, defconGroups, defconList, defconSeats, gameweekLeaders, type Listed } from "./leaders";

const CLUB = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" } as Club;

// A fixture gameweek of seventeen men, each `f{code}` to Fantrax; Kiwior, Nwaneri and Zinchenko are on no roster.
const NAMES = ["Saka", "Rice", "Saliba", "Gabriel", "Odegaard", "Havertz", "White", "Timber", "Partey", "Martinelli", "Trossard", "Jesus", "Kiwior", "Nwaneri", "Merino", "Calafiori", "Zinchenko"];
const MEN: FootballPlayer[] = NAMES.map((name, at) => ({ code: at + 1, id: (at + 1) * 10, name, clubId: CLUB.id }) as FootballPlayer);
const SNAPSHOT = { clubs: [CLUB], players: MEN } as FootballSnapshot;
const man = (name: string) => MEN.find((each) => each.name === name)!;
const fx = (name: string) => `f${man(name).code}`;

function row(name: string, over: Partial<PlayerMatchStats>): PlayerMatchStats {
  return { playerId: man(name).id, fixtureId: 1, minutes: 90, expectedGoals: 0, expectedAssists: 0, ...over } as PlayerMatchStats;
}

const FREE = new Set(["Kiwior", "Nwaneri", "Zinchenko"]);
const LISTED = new Map<number, Listed>(
  MEN.map((each) => [
    each.code,
    {
      fantraxId: `f${each.code}`,
      held: FREE.has(each.name) ? { ownerTeamId: null, status: "WW" } : { ownerTeamId: each.code % 2 === 0 ? "t2" : "t1", status: "T" },
    },
  ]),
);

const figures = (pairs: [string, number][]) => pairs.map(([name, figure]): [string, number] => [fx(name), figure]);

function leaders(over: Partial<Parameters<typeof gameweekLeaders>[0]> = {}) {
  return gameweekLeaders({
    snapshot: SNAPSHOT,
    stats: [],
    priced: new Map(),
    pooled: new Map(),
    defcon: [],
    codeOf: (fantraxId) => Number(fantraxId.slice(1)),
    listed: LISTED,
    hrefOf: (fantraxId) => `/players/${fantraxId}`,
    shown: 10,
    ...over,
  });
}

describe("gameweekLeaders on a fixture gameweek", () => {
  const boards = leaders({
    // Twelve rostered men at their slots; Saka's pool figure is his forward price, which the live read overrules.
    priced: new Map(figures([["Saka", 8], ["Rice", 7], ["Saliba", 6], ["Gabriel", 12], ["Odegaard", 5], ["Havertz", 4], ["White", 3], ["Timber", 2], ["Partey", 2], ["Martinelli", 1], ["Trossard", 1], ["Jesus", 0]])),
    pooled: new Map(figures([["Saka", 6], ["Kiwior", 16], ["Nwaneri", 9]])),
    // The stats league's DefCon counts: DFP at the back, DFP3 for midfielders and forwards together; Kiwior plays both.
    defcon: [
      {
        category: "DFP",
        positions: ["D"],
        counts: { ...Object.fromEntries(figures([["Gabriel", 11], ["Saliba", 11], ["Calafiori", 9], ["White", 7], ["Timber", 6], ["Kiwior", 6]])), [fx("Zinchenko")]: null },
      },
      {
        category: "DFP3",
        positions: ["M", "F"],
        counts: Object.fromEntries(
          figures([["Rice", 14], ["Partey", 12], ["Merino", 12], ["Havertz", 9], ["Odegaard", 9], ["Kiwior", 8], ["Nwaneri", 8], ["Saka", 6], ["Martinelli", 5], ["Trossard", 5], ["Jesus", 4]]),
        ),
      },
    ],
    stats: NAMES.slice(0, 14).map((name, at) => row(name, { expectedGoals: (at + 1) / 10, expectedAssists: (14 - at) / 20 })),
  });
  const board = (key: string) => boards.find((each) => each.key === key);
  const drawn = (key: string) => board(key)?.rows.map((r) => `${r.rank} ${r.name}`);
  const counted = (key: string) => board(key)?.rows.map((r) => `${r.rank} ${r.name} ${r.figure}`);

  it("draws five lists in order, DefCon as two: defenders, then midfielders and forwards together", () => {
    expect(boards.map((board) => [board.key, board.tab])).toEqual([
      ["points", "Points"],
      ["defcon-D", "DefCon DEF"],
      ["defcon-MF", "DefCon M/F"],
      ["xg", "xG"],
      ["xa", "xA"],
    ]);
  });

  it("ranks ten on Fantrax points, a free agent first and the live slot price over the pool's", () => {
    expect(drawn("points")).toEqual(["1 Kiwior", "2 Gabriel", "3 Nwaneri", "4 Saka", "5 Rice", "6 Saliba", "7 Odegaard", "8 Havertz", "9 White", "10 Partey"]);
  });

  it("ranks the DefCon count itself, ties sharing a place, a free agent on both lists and an unread man left off", () => {
    expect(counted("defcon-D")).toEqual(["1 Gabriel 11", "1 Saliba 11", "3 Calafiori 9", "4 White 7", "5 Kiwior 6", "5 Timber 6"]);
    expect(counted("defcon-MF")).toEqual([
      "1 Rice 14",
      "2 Merino 12",
      "2 Partey 12",
      "4 Havertz 9",
      "4 Odegaard 9",
      "6 Kiwior 8",
      "6 Nwaneri 8",
      "8 Saka 6",
      "9 Martinelli 5",
      "9 Trossard 5",
    ]);
  });

  it("heads the counts by who the league pays (Craig, 24 Oct 2026), never DefCon points", () => {
    const list = board("defcon-MF")!.list;
    expect(list).toMatchObject({ title: "DefCon, midfielders and forwards", head: "DefCon M/F", kind: "count" });
  });

  it("ranks ten on FPL's xG and xA among the fourteen who played", () => {
    expect(drawn("xg")).toEqual(["1 Nwaneri", "2 Kiwior", "3 Jesus", "4 Trossard", "5 Martinelli", "6 Partey", "7 Timber", "8 White", "9 Havertz", "10 Odegaard"]);
    expect(drawn("xa")).toEqual(["1 Saka", "2 Rice", "3 Saliba", "4 Gabriel", "5 Odegaard", "6 Havertz", "7 White", "8 Timber", "9 Partey", "10 Martinelli"]);
  });

  it("says who holds each man, nothing for a man nobody does, and links his page", () => {
    const top = boards[0].rows;
    expect(top.slice(0, 3).map((r) => [r.name, r.held, r.href])).toEqual([
      ["Kiwior", null, "/players/f13"],
      ["Gabriel", { ownerTeamId: "t2", status: "T" }, "/players/f4"],
      ["Nwaneri", null, "/players/f14"],
    ]);
    expect(top[0].club).toBe(CLUB);
  });
});

describe("gameweekLeaders", () => {
  it("reads a double gameweek's round figure once: FPL writes it on each of his rows", () => {
    const xg = leaders({ stats: [row("Saka", { expectedGoals: 0.75 }), row("Saka", { fixtureId: 2, expectedGoals: 0.75 })] })[1];
    expect(xg.key).toBe("xg");
    expect(xg.rows.map((r) => [r.name, r.figure])).toEqual([["Saka", 0.75]]);
  });

  it("leads on nobody who did not play or did not register", () => {
    const xg = leaders({ stats: [row("Saka", { minutes: 0, expectedGoals: 0.3 }), row("Rice", { expectedGoals: 0 })] })[1];
    expect(xg.rows).toEqual([]);
  });

  it("drops a Fantrax man the bridge cannot place, and holds no holder for a man our league does not list", () => {
    const [points] = leaders({ priced: new Map([["f99", 20], ["f1", 3]]), listed: new Map() });
    expect(points.rows.map((r) => [r.name, r.held, r.href])).toEqual([["Saka", null, null]]);
  });
});

describe("defconSeats", () => {
  const entry = (fantraxId: string, slot: string | null, eligiblePositions: string[]) =>
    ({ player: { fantraxId }, slot, eligiblePositions, ownerTeamId: slot === null ? null : "t1", status: slot === null ? "FA" : "T" }) as unknown as PoolPlayer;

  it("seats a rostered man only at his slot, and a man on no roster wherever he may play", () => {
    const pool = [entry("a", "F", ["F", "M"]), entry("b", null, ["D", "M"]), entry("c", "D", ["D"]), entry("d", "G", ["G"])];
    expect(defconSeats(pool, ["M", "F"])).toEqual(["a", "b"]);
    expect(defconSeats(pool, ["D"])).toEqual(["b", "c"]);
    expect(defconSeats(pool, [])).toEqual([]);
  });
});

describe("defconGroups", () => {
  // The real league's shape: DFP pays only at the back, DFP3 in midfield and up front, and no keeper is paid either.
  const band = (from: number) => ({ bands: [{ from, to: null, points: 1, every: null }], cumulative: false });
  const scoring = {
    rules: { goalie: {}, outfield: { DFP: { D: band(3), Default: 0 }, DFP3: { M: band(8), F: band(6), Default: 0 } }, goaliePosition: "G" },
    categories: {
      a: { code: "DFP", name: "Defensive Points", longCode: "INDIVIDUAL_DEFENSIVE_POINTS" },
      b: { code: "DFP3", name: "Defensive Points 3", longCode: "INDIVIDUAL_DEFENSIVE_POINTS_3" },
    },
  } as unknown as LeagueScoring;

  it("groups the positions the league counts alike, in the order given, and leaves out the keeper", () => {
    expect(defconGroups(scoring, ["G", "D", "M", "F"])).toEqual([
      { category: "DFP", positions: ["D"] },
      { category: "DFP3", positions: ["M", "F"] },
    ]);
  });

  it("names the two lists for their positions", () => {
    expect(defconGroups(scoring, ["G", "D", "M", "F"]).map((group) => defconList(group).tab)).toEqual(["DefCon DEF", "DefCon M/F"]);
  });
});

describe("defconCounts", () => {
  it("reads each seated man's count in the category, a missing count null and an unseated man off", () => {
    const lines: [string, number | null, Record<string, number | null>][] = [
      ["a", 1, { DFP: 4, DFP3: 9 }],
      ["b", 2, { DFP: 7, DFP3: 15 }],
      ["c", 1, { DFP: null }],
      ["d", 1, { DFP3: 12 }],
    ];
    expect(defconCounts(lines, ["a", "b", "c"], "DFP3")).toEqual({ a: 9, b: 15, c: null });
  });
});
