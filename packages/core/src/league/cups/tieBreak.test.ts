import { describe, expect, it } from "vitest";
import type { LivePlayerCategory } from "../points";
import type { ScoringCategory } from "../scoring";
import { CUP_TIE_STEPS, coinToss, decideTie, throughOn, tieTally, type TieTally } from "./tieBreak";

const DRAW = { cupId: "infusr", gameweek: 10 };
const LEVEL: TieTally = { goals: 2, assists: 3, cleanSheets: 1, cards: 2 };
const side = (teamId: string, tally: Partial<TieTally> = {}, points: number | null = 40) => ({
  teamId,
  points,
  tally: { ...LEVEL, ...tally },
});

describe("decideTie", () => {
  it("goes to the higher score first, with no tie-break line", () => {
    expect(decideTie(side("a", {}, 41), side("b", { goals: 9 }), DRAW)).toEqual({ winner: "a", step: "points" });
    expect(throughOn("points")).toBeNull();
  });

  it("reads a score level in hundredths as level", () => {
    expect(decideTie(side("a", { goals: 3 }, 0.1 + 0.2), side("b", {}, 0.3), DRAW)?.step).toBe("goals");
  });

  it("is undecided until both sides are scored", () => {
    expect(decideTie(side("a", {}, null), side("b"), DRAW)).toBeNull();
  });

  it.each([
    ["goals", { goals: 3 }, {}],
    ["assists", { assists: 4 }, {}],
    ["cleanSheets", { cleanSheets: 2 }, {}],
    ["cards", { cards: 1 }, {}],
  ] as const)("level on points, %s decides it", (step, home, away) => {
    expect(decideTie(side("a", home), side("b", away), DRAW)).toEqual({ winner: "a", step });
    expect(decideTie(side("b", away), side("a", home), DRAW)).toEqual({ winner: "a", step });
  });

  it("takes the earlier step over a later one", () => {
    expect(decideTie(side("a", { goals: 3, cards: 9 }), side("b", { assists: 9 }), DRAW)?.step).toBe("goals");
  });

  it("level on everything, goes to the coin, the same one either way round", () => {
    const one = decideTie(side("a"), side("b"), DRAW);
    expect(one?.step).toBe("toss");
    expect(decideTie(side("b"), side("a"), DRAW)).toEqual(one);
    expect(throughOn("toss")).toBe("Through on the toss of a coin");
  });
});

describe("coinToss", () => {
  it("lands the same for every reader and either order", () => {
    expect(coinToss("x1", "y2", DRAW)).toBe(coinToss("y2", "x1", DRAW));
  });

  it("is near even over many ties", () => {
    let low = 0;
    for (let n = 0; n < 2000; n++) if (coinToss(`t${n}`, `u${n}`, DRAW) === `t${n}`) low += 1;
    expect(low).toBeGreaterThan(900);
    expect(low).toBeLessThan(1100);
  });
});

describe("tieTally", () => {
  const named = (code: string, longCode: string): ScoringCategory => ({ code, name: code, longCode });
  const categories: Record<string, ScoringCategory> = {
    "5010#1": named("G", "INDIVIDUAL_GOALS"),
    "5020#1": named("G", "INDIVIDUAL_GOALS"),
    "5010#2": named("AT", "INDIVIDUAL_ASSISTS_TOTAL"),
    "5010#3": named("CS", "INDIVIDUAL_SHUTOUTS_ON_FIELD"),
    "5010#4": named("YC", "INDIVIDUAL_YELLOW_CARDS"),
    "5010#5": named("RC", "INDIVIDUAL_RED_CARDS"),
    "5010#6": named("Min", "INDIVIDUAL_MINUTES_PLAYED"),
  };
  const row = (category: string, value: string | null): LivePlayerCategory => ({ category, points: 0, value });

  it("sums each counted man's goals, assists, clean sheets and cards, a red once", () => {
    const men = [
      [row("5010#1", "2"), row("5010#2", "1"), row("5010#6", "90"), row("5010#4", "1")],
      [row("5020#1", "1"), row("5010#3", "1"), row("5010#5", "1")],
    ];
    expect(tieTally(men, categories)).toEqual({ goals: 3, assists: 1, cleanSheets: 1, cards: 2 });
  });

  it("adds official and fantasy assists where the league scores no total", () => {
    const split = {
      "5010#7": named("A", "INDIVIDUAL_ASSISTS"),
      "5010#8": named("AF", "INDIVIDUAL_ASSISTS_FANTASY"),
    };
    expect(tieTally([[row("5010#7", "1"), row("5010#8", "2")]], split).assists).toBe(3);
  });

  it("counts nought where nobody did it, or the league names no such category", () => {
    expect(tieTally([[row("9999#1", "4")], []], categories)).toEqual({ goals: 0, assists: 0, cleanSheets: 0, cards: 0 });
  });
});

describe("CUP_TIE_STEPS", () => {
  it("is Craig's order of 19 Oct 2026", () => {
    expect(CUP_TIE_STEPS.map((each) => each.step)).toEqual(["goals", "assists", "cleanSheets", "cards", "toss"]);
  });
});
