import { describe, expect, it } from "vitest";
import type { PlayerMatchStats } from "@epl/core";
import { isStatSort, sorted, type StatLine } from "./statColumns";
import { statsHref, statsView, viewHref } from "./statsSort";

const man = (name: string, minutes: number | null): StatLine & { name: string } => ({
  name,
  line: undefined,
  stats: minutes === null ? undefined : ({ minutes } as PlayerMatchStats),
  logged: undefined,
});

describe("the Stats tab's foot row", () => {
  it("opens on the Fantasy Report, and reads only the clubs and the match board as anything else", () => {
    expect(statsView(undefined)).toBe("fantasy");
    expect(statsView("home")).toBe("home");
    expect(statsView("away")).toBe("away");
    expect(statsView("match")).toBe("match");
    expect(statsView("HOME")).toBe("fantasy");
  });

  it("gives the Fantasy Report the bare tab URL and every other view its own", () => {
    expect(viewHref(41, "fantasy")).toBe("/prem/match/41/stats");
    expect(viewHref(41, "match")).toBe("/prem/match/41/stats?view=match");
    expect(viewHref(41, "away")).toBe("/prem/match/41/stats?view=away");
  });
});

describe("a club board's column heads", () => {
  it("keep the club they sort, open descending, and flip on a second tap", () => {
    expect(statsHref(41, "home", "G", "Rtg", true)).toBe("/prem/match/41/stats?view=home&sort=G");
    expect(statsHref(41, "home", "Rtg", "Rtg", true)).toBe("/prem/match/41/stats?view=home&sort=Rtg&dir=asc");
    expect(statsHref(41, "away", "xG", "Rtg", false)).toBe("/prem/match/41/stats?view=away&sort=xG");
  });

  it("spell the default — rating, high first — as the bare board", () => {
    expect(statsHref(41, "away", "Rtg", "G", true)).toBe("/prem/match/41/stats?view=away");
  });

  it("refuse a column the board does not have", () => {
    expect(isStatSort("Rtg")).toBe(true);
    expect(isStatSort("Pts")).toBe(false);
    expect(isStatSort("FPts")).toBe(false);
    expect(isStatSort(undefined)).toBe(false);
  });
});

describe("sorted", () => {
  const rows = [man("sat", null), man("a", 2), man("b", 6), man("c", 2)];

  it("keeps the team sheet's order between men level on the column", () => {
    expect(sorted(rows, "Min", true).map((row) => row.name)).toEqual(["b", "a", "c", "sat"]);
  });

  it("sinks a man with no figure in both directions", () => {
    expect(sorted(rows, "Min", false).map((row) => row.name)).toEqual(["a", "c", "b", "sat"]);
  });

  it("reads a man FPL has no figures for as no clean sheet reading, not as none kept", () => {
    const kept = { ...man("kept", 1), stats: { cleanSheet: false } as PlayerMatchStats };
    expect(sorted([man("unread", null), kept], "CS", false).map((row) => row.name)).toEqual(["kept", "unread"]);
  });
});
