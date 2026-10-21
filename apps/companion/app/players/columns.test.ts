import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ATTRIBUTE_ROWS, GOALS_AGAINST_OUTFIELD, type ScoringRules } from "@epl/core";
import { COLUMNS, DEFAULT_SORT, DEFCON_POINTS, columnFor, headedFor, paidFor, ratedOn } from "./columns";
import { figureCell } from "./Cell";
import { attributeStats } from "./attributeColumns";
import { columnsIn } from "./groups";
import { figureOf } from "./figure";
import { activeSort, playersQuery } from "./query";
import { boardView } from "./views";


vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
describe("COLUMNS", () => {
  it("gives every column a unique key", () => {
    // `columnFor` returns the FIRST match, so a duplicate key is a sort that
    // silently orders by the wrong column and a head that marks the wrong plate.
    // The raw counts derive their keys from Fantrax's abbreviations by lowering
    // and stripping, so `FP/G` and `FPG` would collide without anyone noticing.
    const keys = COLUMNS.map((column) => column.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every column its own label, so Sort by never offers one name twice", () => {
    // Crosses (#413) took Crossing's "Crs".
    const labels = COLUMNS.map((column) => column.label);
    expect(labels.filter((label, at) => labels.indexOf(label) !== at)).toEqual([]);
  });

  it("keeps a key the address bar can carry", () => {
    for (const key of COLUMNS.map((column) => column.key)) {
      expect(key, key).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("runs phone-first, so the figures a thumb sees first are the ones worth seeing", () => {
    // Craig, 24 Sep 2026: seven figures fit beside a name at 390, and these are the seven.
    expect(COLUMNS.filter((column) => column.group !== "attributes").map((column) => column.label)).toEqual([
      "Player", "FPts", "FP/G", "Min", "GP", "G", "AT", "A", "AF", "xG", "xGI", "Sh", "SoT", "BCM", "xA", "KP", "BCC", "Crs", "AC", "Tkl", "Int", "Blk", "Clr", "Rec", "AW", "xGC", "CS", "DC", "DC+", "DCP", "GA", "Sv", "GKP", "PKS", "YC", "RC", "PKM", "OG",
    ]);
  });

  it("has no opponent column", () => {
    // Craig, 24 Sep 2026: "Remove opponent as well". The next fixture is the planner's question.
    expect(columnFor("opp")).toBeUndefined();
  });

  it("resolves the default sort to a real column", () => {
    // Named rather than taken as `COLUMNS[0]`, so this is the assertion that
    // reordering the table cannot silently change what it sorts by.
    expect(columnFor(DEFAULT_SORT)?.key).toBe(DEFAULT_SORT);
  });

  it("has no column that stands down under a thumb", () => {
    // `deskOnly` was deleted on 10 Sep 2026 with `rank`, its last user. This is
    // the assertion that keeps the removal honest rather than a comment: if a
    // column earns the flag back, the plumbing in `PlayerTable` and `Cell` has
    // to come back with it, and this fails first.
    expect(COLUMNS.every((column) => !("deskOnly" in column))).toBe(true);
  });

  it("never lights minutes or games: a denominator is how much he played, not how well", () => {
    expect(columnFor("min")?.mark).toBeUndefined();
    expect(columnFor("gp")?.mark).toBeUndefined();
  });

  it("reads a raw count out of the grouped payload and dashes an absent one", () => {
    const goals = columnFor("g");
    expect(goals).toBeDefined();
    expect(goals!.value({} as never, { G: 3 })).toBe(3);
    // A keeper has no `GAO` and an outfielder no `Sv`: the key is missing rather
    // than nought, and the cell must get null rather than 0.
    expect(goals!.value({} as never, {})).toBeNull();
    expect(goals!.value({} as never, undefined)).toBeNull();
  });

  it("dashes points per game for a man with no game, and prints a played man's nought", () => {
    // 124 of 543 rows printed 0.00 with GP 0 on 16 Oct 2026, padding the foot of an FP/G sort.
    const perGame = columnFor("fpg");
    const row = (value: number) => ({ stats: { perGame: value } }) as never;
    expect(figureOf(perGame!, row(0), { GP: 0 }, false)).toBeNull();
    expect(figureOf(perGame!, row(0), { GP: 3 }, false)).toBe(0);
    expect(figureOf(perGame!, row(4.5), { GP: 2 }, false)).toBe(4.5);
    expect(figureOf(perGame!, row(4.5), undefined, false)).toBe(4.5);
  });
});

describe("goals conceded", () => {
  // A keeper's read calls it GA and an outfielder's GAO: one fact, one column, as on the team's Stats tab.
  const ga = columnFor("ga");

  it("reads a keeper's GA and an outfielder's GAO into the one column, and dashes a man with neither", () => {
    expect(ga?.value({} as never, { GA: 10 })).toBe(10);
    expect(ga?.value({} as never, { GAO: 7 })).toBe(7);
    expect(ga?.value({} as never, { GAO: 0 })).toBe(0);
    expect(ga?.value({} as never, {})).toBeNull();
    expect(columnFor("gao")).toBeUndefined();
  });

  it("stays on Players for a league whose read or scoring carries only the outfield half", () => {
    expect(columnsIn(COLUMNS, "defensive", "fpts", new Set(["Min", "GAO"])).map((column) => column.key)).toContain("ga");
    const outfieldOnly = { "x#GAO": { code: GOALS_AGAINST_OUTFIELD.short, name: "Goals Against (Outfield)", longCode: null } };
    expect(boardView("pool", outfieldOnly).columns.map((column) => column.key)).toContain("ga");
  });

  it("sorts an old ?sort=gao link by the merged column", () => {
    expect(activeSort(playersQuery({ sort: "gao" }), boardView("pool", {})).column.key).toBe("ga");
  });
});

describe("the columns a league scores", () => {
  // Each league's getPlayerStats columns on 1 Oct 2026, both halves together.
  const real = new Set(["GP", "Min", "G", "AT", "YC", "RC", "Pen", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP"]);
  const rehearsal = new Set(["GP", "Min", "G", "A", "AF", "YC", "RC", "DFP", "PKM", "OG", "GAO", "CS", "GA", "Sv", "PKS"]);
  const counts = (scored: ReadonlySet<string>) => columnsIn(COLUMNS, "all", "fpts", scored).filter((column) => column.stat !== undefined).map((column) => column.label);

  it("draws the real league's AT, GKP and both DefCon counts, and not the A, AF and Sv it no longer scores", () => {
    expect(counts(real)).toEqual(["Min", "GP", "G", "AT", "CS", "DC", "DC+", "GA", "GKP", "PKS", "YC", "RC", "PKM", "OG"]);
  });

  it("draws our DefCon points after the counts once the page says the league prices them", () => {
    expect(counts(new Set([...real, DEFCON_POINTS]))).toEqual(expect.arrayContaining(["DC+", "DCP"]));
    expect(columnFor("dcp")?.value({} as never, { [DEFCON_POINTS]: 4 })).toBe(4);
  });

  it("draws the rehearsal league's, with the one DefCon count it scores", () => {
    expect(counts(rehearsal)).toEqual(["Min", "GP", "G", "A", "AF", "CS", "DC", "GA", "Sv", "PKS", "YC", "RC", "PKM", "OG"]);
  });

  // Craig, 6 Oct 2026: "data page needs our dfp and dfp3 stats".
  it("reads both DefCon counts off the grouped payload under Fantrax's codes, under the Defensive plate, per 90 on the toggle", () => {
    const [dfp, dfp3] = [columnFor("dfp"), columnFor("dfp3")];
    const gross = { Min: 450, DFP: 10, DFP3: 24 };
    expect([dfp?.value({} as never, gross), dfp3?.value({} as never, gross)]).toEqual([10, 24]);
    // Headed DC and DC+, still read and keyed in the address bar by Fantrax's codes.
    expect([dfp?.label, dfp3?.label]).toEqual(["DC", "DC+"]);
    expect([dfp?.stat, dfp3?.stat]).toEqual(["DFP", "DFP3"]);
    expect(dfp && figureOf(dfp, {} as never, gross, true)).toBe(2);
    expect(columnsIn(COLUMNS, "defensive", "fpts", real).map((column) => column.key)).toEqual(expect.arrayContaining(["dfp", "dfp3"]));
    // A keeper's half carries no DefCon: an absence, never a nought.
    expect(dfp3?.value({} as never, { Min: 450, GA: 4 })).toBeNull();
  });

  it("keeps a column the board is sorted by, even where the league does not score it", () => {
    expect(columnsIn(COLUMNS, "all", "a", real).some((column) => column.key === "a")).toBe(true);
  });
});

describe("the attribute columns", () => {
  const attributeColumns = COLUMNS.filter((column) => column.group === "attributes");

  it("gives every row of the grid a column under CM's own three-letter heading", () => {
    expect(attributeColumns).toHaveLength(ATTRIBUTE_ROWS.length);
    expect(attributeColumns.every((column) => column.label.length <= 3)).toBe(true);
  });

  it("reads his rating out of the bag, and dashes a man with none", () => {
    const finishing = columnFor("fin");
    expect(finishing?.value({} as never, attributeStats([{ name: "Finishing", rating: 20, from: "" }]))).toBe(20);
    expect(finishing?.value({} as never, {})).toBeNull();
  });

  it("stays off All and fills its own plate, the spine and the sort beside it", () => {
    expect(columnsIn(COLUMNS, "all", "fpts", new Set()).some((column) => column.group === "attributes")).toBe(false);
    const plate = columnsIn(COLUMNS, "attributes", "fpts", new Set()).map((column) => column.key);
    expect(plate).toEqual(["name", "fpts", ...attributeColumns.map((column) => column.key)]);
    expect(columnsIn(COLUMNS, "all", "fin", new Set()).some((column) => column.key === "fin")).toBe(true);
  });

  it("leads with the attribute it is sorted by, so a phone sees the order it is in", () => {
    // Sorted by Work Rate, the 25th column: a 390 phone shows seven, and they were Acc to Dri.
    const plate = columnsIn(COLUMNS, "attributes", "wor", new Set()).map((column) => column.key);
    expect(plate.slice(0, 2)).toEqual(["name", "wor"]);
    expect(plate.filter((key) => key === "wor")).toHaveLength(1);
  });
});

describe("ratedOn", () => {
  const read = new Set(["Min", "G", "GA"]);

  it("hides Per 90 on a plate where no drawn column divides by minutes, so it is never lit doing nothing", () => {
    // The Attributes plate is 1-20 ratings: per=90 lit the toggle and counted as a filter, and changed no figure.
    expect(ratedOn(columnsIn(COLUMNS, "attributes", "acc", read), true)).toBeNull();
    expect(ratedOn(columnsIn(COLUMNS, "attributes", "acc", read), false)).toBeNull();
  });

  it("keeps it where one does, the sorted xG beside the attributes included", () => {
    expect(ratedOn(columnsIn(COLUMNS, "attributes", "xg", read), true)).toBe(true);
    expect(ratedOn(columnsIn(COLUMNS, "defensive", "fpts", read), false)).toBe(false);
  });
});

describe("headedFor", () => {
  const drawn = columnsIn(COLUMNS, "attacking", "xg", new Set(["Min", "G"]));
  const heads = (rated: boolean | null) => headedFor(drawn, rated).map((column) => column.label);

  it("marks each rated head /90 under Per 90, so a rate never reads as a season's total", () => {
    // DATA-7, 21 Oct 2026: xG Sh SoT stood over 1.52 / 6.92 / 4.95 with nothing to say they were per 90.
    expect(heads(true)).toEqual(expect.arrayContaining(["G/90", "xG/90", "Sh/90", "SoT/90"]));
  });

  it("leaves a head no rate divides alone: the name, minutes, games, a per-game figure and a rating", () => {
    const bare = headedFor(COLUMNS, true).filter((column, at) => column.label === COLUMNS[at].label);
    expect(bare.map((column) => column.label)).toEqual(expect.arrayContaining(["Player", "Min", "GP", "FP/G", "Acc"]));
  });

  it("leaves every head bare with the toggle off or hidden", () => {
    expect(heads(false)).toEqual(drawn.map((column) => column.label));
    expect(heads(null)).toEqual(drawn.map((column) => column.label));
  });
});

describe("FPts in the reading cyan", () => {
  // Craig, 21 Oct 2026: "put fpts in cyan too", as on the Profile since #80; cyan is never lit.
  const fpts = columnFor("fpts")!;
  const row = (points: number) => ({ stats: { points } }) as never;

  it("prints his points cyan, never lit, and his nought quiet", () => {
    expect(fpts.mark).toBeUndefined();
    expect(figureCell(fpts, row(49), {}, false, { good: 1, best: 2 }).className).toBe("text-info");
    expect(figureCell(fpts, row(0), {}, false, undefined).className).toBe("text-faint");
  });

  it("still sorts the board highest first, as Fantrax does", () => {
    expect(activeSort(playersQuery({}), boardView("pool", {})).column.key).toBe("fpts");
    expect(fpts.ascending).toBe(false);
  });
});

describe("paidFor: a position chip draws what that position scores", () => {
  // The real league's prices on 21 Oct 2026, by hand: DC pays defenders, DC+ midfielders and forwards, CS D4 M1 F0.
  const band = (points: number) => ({ bands: [{ from: 3, to: 99, points, every: null }], cumulative: false });
  const rules: ScoringRules = {
    goaliePosition: "G",
    goalie: { CS: { Default: 4 }, GA: { Default: band(-1) }, GKP: { Default: band(1) }, PKS: { Default: 5 }, Min: { Default: band(1) } },
    outfield: {
      CS: { D: 4, M: 1, Default: 0 },
      GAO: { D: band(-1), Default: 0 },
      DFP: { D: band(1), Default: 0 },
      DFP3: { M: band(1), F: band(1), Default: 0 },
      Min: { Default: band(1) },
      G: { D: 6, M: 5, F: 4, Default: 0 },
    },
  };
  const real = new Set(["GP", "Min", "G", "AT", "YC", "RC", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP", DEFCON_POINTS]);
  const all = columnsIn(boardView("pool", {}).columns, "all", "fpts", real);
  const drawn = (positions: string[]) => paidFor(all, rules, positions).map((column) => column.label);
  const among = (positions: string[], labels: string[]) => drawn(positions).filter((label) => labels.includes(label));

  it("draws a keeper no DefCon and an outfielder no keeper's figures", () => {
    expect(among(["G"], ["DC", "DC+", "DCP"])).toEqual([]);
    expect(drawn(["G"])).toEqual(expect.arrayContaining(["GA", "GKP", "PKS", "CS"]));
    for (const position of ["D", "M", "F"]) expect(among([position], ["GKP", "PKS"])).toEqual([]);
  });

  it("draws DC and its points for defenders, DC+ and its points for midfielders and forwards", () => {
    expect(drawn(["D"])).toEqual(expect.arrayContaining(["DC", "DCP", "GA", "CS"]));
    expect(drawn(["D"])).not.toContain("DC+");
    expect(drawn(["M"])).toEqual(expect.arrayContaining(["DC+", "DCP", "CS"]));
    expect(among(["M"], ["DC", "GA"])).toEqual([]);
    expect(drawn(["F"])).not.toContain("CS");
  });

  it("draws the union for several chips, everything for none, and always the figures no category prices", () => {
    expect(drawn(["D", "M"])).toEqual(expect.arrayContaining(["DC", "DC+"]));
    expect(drawn([])).toEqual(all.map((column) => column.label));
    expect(drawn(["F"])).toEqual(expect.arrayContaining(["Player", "FPts", "FP/G", "Min", "GP", "G"]));
  });

  it("keeps the column the board is sorted by, so a chip never hides the order", () => {
    expect(paidFor(all, rules, ["G"], "dfp").map((column) => column.label)).toContain("DC");
  });

  it("draws everything where the league's prices were not read", () => {
    expect(paidFor(all, null, ["G"])).toEqual(all);
  });
});
