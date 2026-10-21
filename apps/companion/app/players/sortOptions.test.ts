import { describe, expect, it } from "vitest";
import { boardView } from "./views";
import { sortLabel, sortOptions } from "./sortOptions";
import type { PoolColumn } from "./columns";

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
