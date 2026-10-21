import { describe, expect, it } from "vitest";
import type { ScoringRules } from "@epl/core";
import { boardView } from "./views";
import { offeredFor, sortLabel, sortOptions as optionsOf } from "./sortOptions";
import { DEFCON_POINTS, paidFor, type PoolColumn } from "./columns";
import { columnsIn, sortableIn } from "./groups";
import type { BoardView } from "./views";

const sortOptions = (view: BoardView, scored: ReadonlySet<string>, rated: boolean | null) =>
  optionsOf(view, sortableIn(view.columns, scored), rated);

// P-15: Sort by listed 44 bare codes (`Tkl`, `BCC`, `OtB`), which a reader decoded only from the key.
describe("Sort by's options", () => {
  const every = new Set<string>();
  // An unread league scores every category, so Players takes them all and Adv Stats the rest.
  const stats = boardView("stats", {});
  const players = boardView("pool", {});
  const column = (label: string, title: string) => ({ label, title }) as PoolColumn;

  it("names a code's column in words, cutting the title's gloss", () => {
    expect(sortLabel(column("xG", "Expected goals"))).toBe("xG — Expected goals");
    expect(sortLabel(column("DC+", "DefCon+: tackles won, interceptions, blocks"))).toBe("DC+ — DefCon+");
    expect(sortLabel(column("FPts", "Fantasy points, under this league's scoring"))).toBe("FPts — Fantasy points");
    expect(sortLabel(column("Saves", "Saves"))).toBe("Saves");
  });

  it("never offers a bare code", () => {
    for (const option of [...sortOptions(stats, every, false), ...sortOptions(players, every, null)])
      expect(option.label).toMatch(/ — [A-Z][a-z]/);
  });

  it("carries the per-90 head the board prints", () => {
    expect(sortOptions(stats, every, true).find((option) => option.value === "xg")?.label).toBe("xG/90 — Expected goals");
    expect(sortOptions(stats, every, true).find((option) => option.value === "acc")?.label).toBe("Acc — Acceleration");
  });

  it("groups Adv Stats under its plates' words in plate order", () => {
    const groups = [...new Set(sortOptions(stats, every, false).map((option) => option.group))];
    expect(groups).toEqual(["Attack", "Creating", "Defence", "Attributes"]);
    expect(new Set(sortOptions(stats, every, false).map((option) => option.value)).size).toBe(stats.columns.length - 1);
  });

  it("leaves Players' few figures flat, in the board's order", () => {
    const options = sortOptions(players, every, null);
    expect(options.every((option) => option.group === undefined)).toBe(true);
    expect(options.slice(0, 2).map((option) => option.label)).toEqual(["FPts — Fantasy points", "FP/G — Fantasy points per game"]);
  });
});

describe("Sort by under a position chip", () => {
  // Craig, 21 Oct 2026: Sort by offered DC, DC+ and DCP under GK, columns the chip had hidden.
  const band = (points: number) => ({ bands: [{ from: 3, to: 99, points, every: null }], cumulative: false });
  const rules: ScoringRules = {
    goaliePosition: "G",
    goalie: { CS: { Default: 4 }, GA: { Default: band(-1) }, GKP: { Default: band(1) }, PKS: { Default: 5 } },
    outfield: { CS: { D: 4, M: 1, Default: 0 }, DFP: { D: band(1), Default: 0 }, DFP3: { M: band(1), F: band(1), Default: 0 }, G: { D: 6, Default: 0 } },
  };
  const scored = new Set(["GP", "Min", "G", "AT", "YC", "RC", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP", DEFCON_POINTS]);
  const players = boardView("pool", {});
  const offered = (positions: string[], sorted: string) => offeredFor(players, scored, rules, positions, sorted).map((column) => column.key);

  it("offers exactly the columns the board draws, the name aside", () => {
    for (const positions of [["G"], ["D"], ["M", "F"], []]) {
      const drawn = paidFor(columnsIn(players.columns, "all", "fpts", scored), rules, positions, "fpts");
      expect(offered(positions, "fpts")).toEqual(drawn.filter((column) => column.key !== "name").map((column) => column.key));
    }
    for (const key of ["dfp", "dfp3", "dcp"]) expect(offered(["G"], "fpts")).not.toContain(key);
  });

  it("keeps the column the board is sorted by, so the menu still names the order", () => {
    expect(offered(["G"], "dcp")).toContain("dcp");
    expect(offered(["G"], "dcp")).not.toContain("dfp");
  });

  it("offers everything where the league's prices were not read", () => {
    expect(offeredFor(players, scored, null, ["G"], "fpts")).toEqual(sortableIn(players.columns, scored));
  });
});
