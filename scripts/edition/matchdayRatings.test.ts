import { describe, expect, it } from "vitest";
import type { ScoringRules } from "@epl/core";
import { dayPoints } from "./matchdayRatings";

// The real league's defensive bands, as its scoring lists them on 11 Oct 2026: a defender's DFP from three, a midfielder's DFP3 from seven.
const rules: ScoringRules = {
  goaliePosition: "G",
  goalie: {},
  outfield: {
    DFP: { D: { cumulative: false, bands: [{ from: 3, to: 4, points: 1, every: null }, { from: 5, to: 99, points: 2, every: null }] } },
    DFP3: { M: { cumulative: false, bands: [{ from: 7, to: 10, points: 1, every: null }, { from: 11, to: 99, points: 2, every: null }] } },
  },
};
const row = (fantraxId: string, points: number, position: string) => ({ fantraxId, rank: null, points, perGame: null, rostered: null, trend: null, opponent: null, position });
const reads: Parameters<typeof dayPoints>[0] = {
  rules,
  figures: {
    points: new Map([["nunes", row("nunes", 6, "M")], ["doku", row("doku", 8, "M")]]),
    shorts: new Map<string, Record<string, number | null>>([["nunes", { DFP: 5, DFP3: 8, Min: 90 }], ["doku", { Min: 34 }]]),
    opta: new Map(),
  },
};

describe("dayPoints", () => {
  it("prices a man's defensive points at the slot his manager chose, else at his own position, with the most the slot pays", () => {
    expect(dayPoints(reads, "nunes", "D")).toEqual({ points: 6, defensive: 2, defensiveMost: 2 });
    expect(dayPoints(reads, "nunes", null)).toEqual({ points: 6, defensive: 1, defensiveMost: 2 });
  });

  it("gives a man the league never counted for defending no defensive points at all, rather than nought", () => {
    expect(dayPoints(reads, "doku", null)).toEqual({ points: 8, defensive: null, defensiveMost: null });
    expect(dayPoints(reads, "nobody", null)).toEqual({ points: null, defensive: null, defensiveMost: null });
  });
});
