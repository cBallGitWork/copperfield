import { describe, expect, it } from "vitest";
import { ATTRIBUTE_ROWS, GOALS_AGAINST_OUTFIELD } from "@epl/core";
import { COLUMNS, DEFAULT_SORT, DEFCON_POINTS, columnFor, headedFor, ratedOn } from "./columns";
import { attributeStats } from "./attributeColumns";
import { columnsIn } from "./groups";
import { figureOf } from "./figure";
import { activeSort, playersQuery } from "./query";
import { boardView } from "./views";

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
    expect(perGame?.value(row(0), { GP: 0 })).toBeNull();
    expect(perGame?.value(row(0), { GP: 3 })).toBe(0);
    expect(perGame?.value(row(4.5), { GP: 2 })).toBe(4.5);
    expect(perGame?.value(row(4.5), undefined)).toBe(4.5);
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
