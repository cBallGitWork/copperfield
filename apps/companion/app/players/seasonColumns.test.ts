import { describe, expect, it } from "vitest";
import type { FootballPlayer, Shot, StatsRow } from "@epl/core";
import type { PoolRow } from "./pool";
import { COLUMNS, columnFor } from "./columns";
import { columnsIn, sortableIn } from "./groups";
import { figureOf } from "./figure";
import { shownRows } from "./query";
import { boardView } from "./views";
import { DAILY_COLUMNS, SEASON_COLUMNS, expectedStats, seasonStats } from "./seasonColumns";

// Haaland's line in the stats league on 6 Oct 2026, and a keeper's, whose half of the read carries no shots or crosses.
const HAALAND: StatsRow = {
  minutes: 450,
  shots: 20,
  shotsOnTarget: 10,
  keyPasses: 1,
  bigChancesCreated: 1,
  bigChancesMissed: 4,
  crosses: 0,
  accurateCrosses: 0,
  tacklesWon: 1,
  interceptions: 0,
  defensivePoints: 3,
  clearances: 5,
  recoveries: 9,
  aerialsWon: 12,
};
const KEEPER: StatsRow = { minutes: 450, shots: null, keyPasses: 0, crosses: null, saves: 16 };

/** A footballer's season as the snapshot carries it; only the figures read here matter. */
const footballer = (season: Partial<FootballPlayer["season"]>): FootballPlayer =>
  ({ season: { minutes: 0, expectedGoals: 0, expectedAssists: 0, expectedGoalsConceded: 0, ...season } }) as FootballPlayer;

// The real league's getPlayerStats columns on 1 Oct 2026: none of these.
const REAL = new Set(["GP", "Min", "G", "AT", "YC", "RC", "Pen", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP"]);
const ATTACK = ["xg", "npxg", "xgi", "npxgi", "sh", "sot", "bcm"];
const CHANCES = ["xa", "kp", "bcc", "cr", "ac"];
const DEFENCE = ["tkl", "int", "blk", "clr", "rec", "aw", "xgc"];
const KEYS = [...ATTACK, ...CHANCES, ...DEFENCE];

const row = (fantraxId: string): PoolRow =>
  ({
    entry: {
      player: { fantraxId, displayName: fantraxId, rawName: fantraxId, clubCode: "MCI", position: null, rotowireId: null },
      eligiblePositions: ["F"],
      status: "T",
      ownerTeamId: null,
    },
    stats: null,
    fplCode: null,
  }) as unknown as PoolRow;

const read = (key: string, bag: Record<string, number | null>) => columnFor(key)?.value({} as never, bag);

describe("Adv Stats' season columns", () => {
  it("heads them in the house's words, KP titled as its head says (UX review, 19 Oct 2026)", () => {
    expect(SEASON_COLUMNS.map((column) => column.label)).toEqual([
      "xG", "npxG", "xGI", "npxGI", "Sh", "SoT", "BCM", "xA", "KP", "BCC", "Crs", "AC", "Tkl", "Int", "Blk", "Clr", "Rec", "AW", "xGC",
    ]);
    expect(columnFor("kp")?.title).toBe("Key passes");
  });

  it("gives every head a line for the key, none of them naming a source", () => {
    for (const column of SEASON_COLUMNS) expect(column.means).toMatch(/^[A-Z].*\.$/);
  });

  it("keys each apart from every other column, the attribute grid's Crossing included", () => {
    expect(SEASON_COLUMNS.map((column) => column.key)).toEqual(KEYS);
    expect(COLUMNS.filter((column) => KEYS.includes(column.key))).toEqual(SEASON_COLUMNS);
  });

  it("splits into Attack, Chances and Defence, each a phone's width (Craig, 19 Oct 2026)", () => {
    const stats = boardView("stats", {}).columns;
    const plate = (group: "attacking" | "creating" | "defensive", sorted: string) =>
      columnsIn(stats, group, sorted, REAL).map((column) => column.key);
    expect(plate("attacking", "xg")).toEqual(["name", ...ATTACK]);
    expect(plate("creating", "xa")).toEqual(["name", ...CHANCES]);
    expect(plate("defensive", "tkl")).toEqual(["name", ...DEFENCE]);
  });

  it("stays off Players, and a served league that scores none of them never drops one", () => {
    expect(sortableIn(boardView("stats", {}).columns, REAL).map((column) => column.key)).toEqual(expect.arrayContaining(KEYS));
    expect(boardView("pool", {}).columns.some((column) => KEYS.includes(column.key))).toBe(false);
  });

  it("reads a man's season out of the bag it was joined into, blocks worked out of DefCon's count", () => {
    const bag = seasonStats(HAALAND);
    expect(["sh", "sot", "bcm", "kp", "bcc", "cr", "ac"].map((key) => read(key, bag))).toEqual([20, 10, 4, 1, 1, 0, 0]);
    expect(["tkl", "int", "blk", "clr", "rec", "aw"].map((key) => read(key, bag))).toEqual([1, 0, 2, 5, 9, 12]);
  });

  it("dashes a man the file does not hold, and prints a played man's noughts", () => {
    expect(seasonStats(undefined)).toEqual({});
    expect(read("sh", seasonStats(undefined))).toBeNull();
    expect(read("cr", seasonStats(HAALAND))).toBe(0);
  });

  it("dashes a keeper's shots and defending, which his half never carries, and keeps his nought chances", () => {
    const bag = seasonStats(KEEPER);
    expect(read("sh", bag)).toBeNull();
    expect(read("blk", bag)).toBeNull();
    expect(read("kp", bag)).toBe(0);
  });

  it("lights the most big chances missed and expected goals conceded at the bad end, the rest at the good", () => {
    const low = SEASON_COLUMNS.filter((column) => column.mark === "low").map((column) => column.key);
    expect(low).toEqual(["bcm", "xgc"]);
  });

  it("dates only the daily file's columns", () => {
    expect(DAILY_COLUMNS.map((column) => column.key)).toEqual(KEYS.filter((key) => !/^(np)?x/.test(key)));
  });

  it("rates per 90 over the file's own minutes, not the served league's", () => {
    const shots = columnFor("sh");
    // A live gameweek: the served read has a match the daily file has not caught up with.
    const bag = { Min: 540, ...seasonStats(HAALAND) };
    expect(shots && figureOf(shots, row("haaland"), bag, true)).toBe(4);
    expect(shots && figureOf(shots, row("haaland"), bag, false)).toBe(20);
  });

  it("sorts by shots either way with a man the file does not hold last", () => {
    const raw = new Map([
      ["haaland", seasonStats(HAALAND)],
      ["wirtz", seasonStats({ minutes: 415, shots: 15 })],
      ["unplayed", seasonStats(undefined)],
    ]);
    const rows = [row("unplayed"), row("wirtz"), row("haaland")];
    const order = (dir: string) =>
      shownRows(rows, { sort: "sh", dir, status: "all" }, raw, boardView("stats", {})).map((each) => each.entry.player.fantraxId);
    expect(order("desc")).toEqual(["haaland", "wirtz", "unplayed"]);
    expect(order("asc")).toEqual(["wirtz", "haaland", "unplayed"]);
  });
});

describe("expectedStats", () => {
  const haaland = footballer({ minutes: 540, expectedGoals: 6.12, expectedAssists: 0.75, expectedGoalsConceded: 4.5 });

  it("reads his xG, xA and xGC, and xGI as the two together, at two places", () => {
    const bag = expectedStats(haaland, []);
    expect(["xg", "xa", "xgc"].map((key) => read(key, bag))).toEqual([6.12, 0.75, 4.5]);
    expect(read("xgi", bag)).toBeCloseTo(6.87);
    expect(columnFor("xg")?.places).toBe("expected");
  });

  it("rates per 90 over his own minutes, never the stats league's", () => {
    const xg = columnFor("xg");
    const bag = { ...seasonStats({ minutes: 450 }), ...expectedStats(haaland, []) };
    expect(xg && figureOf(xg, row("haaland"), bag, true)).toBeCloseTo(1.02);
  });

  it("dashes a man who has not played, and one the bridge has not settled", () => {
    expect(expectedStats(footballer({ minutes: 0 }), [])).toEqual({});
    expect(expectedStats(undefined, null)).toEqual({});
  });

  it("takes his penalties off npxG and npxGI, and rates them per 90 like xG", () => {
    const penalty = { situation: "penalty", xg: 0.7884 } as Shot;
    const bag = expectedStats(haaland, [penalty, penalty, { situation: "assisted", xg: 0.4 } as Shot]);
    expect(read("npxg", bag)).toBeCloseTo(4.5432);
    expect(read("npxgi", bag)).toBeCloseTo(5.2932);
    const npxg = columnFor("npxg");
    expect(npxg && figureOf(npxg, row("haaland"), bag, true)).toBeCloseTo(0.76);
  });

  it("dashes npxG and npxGI where his shots cannot vouch for it, keeping xG", () => {
    for (const shots of [null, []]) {
      const bag = expectedStats(haaland, shots);
      expect([read("npxg", bag), read("npxgi", bag), read("xg", bag)]).toEqual([null, null, 6.12]);
    }
  });

  it("prints a played man's nought", () => {
    expect(read("xg", expectedStats(footballer({ minutes: 90 }), []))).toBe(0);
  });
});
