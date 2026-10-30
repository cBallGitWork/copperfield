import { describe, expect, it } from "vitest";
import type { ScoringCategory, ScoringRules } from "../league/scoring";
import { actionPoints } from "./printerPoints";

const names: Record<string, ScoringCategory> = {
  "1#g": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
  "1#at": { code: "AT", name: "Assists (Total)", longCode: "INDIVIDUAL_ASSISTS_TOTAL" },
  "1#og": { code: "OG", name: "Own Goals", longCode: "INDIVIDUAL_GOALS_ON_OWN_NET" },
  "1#yc": { code: "YC", name: "Yellow Cards", longCode: "INDIVIDUAL_YELLOW_CARDS" },
  "1#rc": { code: "RC", name: "Red Cards", longCode: "INDIVIDUAL_RED_CARDS" },
};
const rules: ScoringRules = {
  goaliePosition: "G",
  goalie: { G: { G: 10 }, YC: { Default: -1 } },
  outfield: {
    G: { D: 6, M: 5, F: 4 },
    AT: { Default: 3 },
    OG: { Default: -2 },
    YC: { Default: -1 },
    RC: { Default: -3 },
  },
};
const scoring = { rules, categories: names };

describe("actionPoints", () => {
  it("prices a goal at the slot his manager played him in, not his own position", () => {
    expect(actionPoints("goal", "first", "D", scoring)).toBe(6);
    expect(actionPoints("penalty-goal", "first", "F", scoring)).toBe(4);
    expect(actionPoints("goal", "first", "G", scoring)).toBe(10);
  });

  it("prices the assister, an own goal and the cards", () => {
    expect(actionPoints("goal", "second", "M", scoring)).toBe(3);
    expect(actionPoints("own-goal", "first", "D", scoring)).toBe(-2);
    expect(actionPoints("booked", "first", "M", scoring)).toBe(-1);
    expect(actionPoints("sent-off", "first", "F", scoring)).toBe(-3);
  });

  it("prices nothing for a man in no eleven, a league with no scoring, or an action it does not score", () => {
    expect(actionPoints("goal", "first", undefined, scoring)).toBeNull();
    expect(actionPoints("goal", "first", "D", null)).toBeNull();
    expect(actionPoints("own-goal", "second", "D", scoring)).toBeNull();
    expect(actionPoints("full-time", "first", "D", scoring)).toBeNull();
    expect(actionPoints("goal", "second", "M", { rules, categories: { "1#g": names["1#g"] as ScoringCategory } })).toBeNull();
  });

  it("prices nothing a tiered price would make a guess of", () => {
    const tiered: ScoringRules = { ...rules, outfield: { ...rules.outfield, G: { Default: { bands: [{ from: 1, to: 1, points: 5, every: null }], cumulative: false } } } };
    expect(actionPoints("goal", "first", "M", { rules: tiered, categories: names })).toBeNull();
  });
});
