import { describe, expect, it } from "vitest";
import real from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import { mapScoringRules, type RawScoringSystem } from "./fantrax/scoring";
import { firstPaid, keeperRung, paidAt, returnPoints } from "./scoring";

const rules = mapScoringRules(real.scoringSystem as RawScoringSystem)!;

describe("returnPoints", () => {
  it("prices a defender's goal, assist and clean sheet by the league's own table", () => {
    expect(returnPoints({ G: 1, AT: 1, CS: 1 }, rules, "D")).toEqual({ attacking: 9, cleanSheet: 4 });
  });

  it("gives a forward nothing for a clean sheet, and a keeper ten for a goal", () => {
    expect(returnPoints({ G: 1, CS: 1 }, rules, "F")).toEqual({ attacking: 4, cleanSheet: 0 });
    expect(returnPoints({ G: 1, CS: 1 }, rules, "G")).toEqual({ attacking: 10, cleanSheet: 4 });
  });

  it("ignores a count the league does not score, and a count it did not send", () => {
    expect(returnPoints({ G: 1, A: 2, AF: 1 }, rules, "M")).toEqual({ attacking: 5, cleanSheet: 0 });
    expect(returnPoints({}, rules, "M")).toEqual({ attacking: 0, cleanSheet: 0 });
  });
});

describe("firstPaid and keeperRung", () => {
  it("finds the fewest of a count the league pays for, flat or in bands", () => {
    expect(firstPaid(rules, "CS", "D")).toBe(1);
    expect(firstPaid(rules, "Min", "M")).toBe(1);
    expect(firstPaid(rules, "DFP", "D")).toBe(3);
    expect(firstPaid(rules, "DFP3", "M")).toBe(8);
    expect(firstPaid(rules, "CS", "F")).toBeNull();
  });

  it("pays a keeper from his third action, one point in every three", () => {
    expect(keeperRung(rules)).toBe(3);
    expect(keeperRung({ ...rules, goaliePosition: null })).toBeNull();
  });
});

describe("paidAt", () => {
  it("draws a category only for a position the league prices above nought", () => {
    expect(paidAt(rules, ["DFP"], ["D"])).toBe(true);
    expect(paidAt(rules, ["DFP"], ["M"])).toBe(false);
    expect(paidAt(rules, ["DFP3"], ["D"])).toBe(false);
    expect(paidAt(rules, ["DFP3"], ["F"])).toBe(true);
    expect(paidAt(rules, ["CS"], ["M"])).toBe(true);
    expect(paidAt(rules, ["CS"], ["F"])).toBe(false);
  });

  it("keeps the keeper's categories to the keeper, and DefCon off him", () => {
    expect(paidAt(rules, ["GKP"], ["G"])).toBe(true);
    expect(paidAt(rules, ["PKS"], ["D"])).toBe(false);
    expect(paidAt(rules, ["DFP", "DFP3"], ["G"])).toBe(false);
    expect(paidAt(rules, ["GA", "GAO"], ["D"])).toBe(true);
    expect(paidAt(rules, ["GA", "GAO"], ["M"])).toBe(false);
  });

  it("draws the union over several positions, and everything over none", () => {
    expect(paidAt(rules, ["DFP"], ["M", "D"])).toBe(true);
    expect(paidAt(rules, ["GKP"], ["D", "M", "F"])).toBe(false);
    expect(paidAt(rules, ["GKP"], [])).toBe(true);
  });

  it("leaves a category the league never priced to the caller, and hides one priced nought everywhere", () => {
    expect(paidAt(rules, ["Sv"], ["D"])).toBe(true);
    expect(paidAt(rules, ["Pen"], ["D"])).toBe(false);
  });

  it("keeps a price it cannot read rather than hide a scored figure", () => {
    const unread = { ...rules, outfield: { ...rules.outfield, X: { Default: null } } };
    expect(paidAt(unread, ["X"], ["M"])).toBe(true);
  });
});
