import { describe, expect, it } from "vitest";
import { printed } from "@epl/core";
import { LISTS, asPrinted, figureInk, ranked } from "./lists";

const man = (code: number, name: string, figure: number) => ({ code, name, figure });
const list = (key: string) => LISTS.find((each) => each.key === key)!;

describe("ranked", () => {
  it("puts the biggest first and lets level men share a place", () => {
    const top = ranked([man(1, "Saka", 3), man(2, "Haaland", 7), man(3, "Isak", 3), man(4, "Palmer", 2)], 10);
    expect(top.map((row) => [row.rank, row.name])).toEqual([[1, "Haaland"], [2, "Isak"], [2, "Saka"], [4, "Palmer"]]);
  });

  it("gives a nought no place and stops at the count asked for", () => {
    const top = ranked([man(1, "A", 0), man(2, "B", 5), man(3, "C", 4), man(4, "D", 1)], 2);
    expect(top.map((row) => row.name)).toEqual(["B", "C"]);
  });
});

describe("the lists' figures", () => {
  it("prints expected goals to two places and counts whole", () => {
    expect(printed(list("xg"), 8.5)).toBe("8.50");
    expect(printed(list("points"), 1234)).toBe("1,234");
  });

  it("ranks two figures that print alike as level", () => {
    const xg = list("xg");
    const top = ranked([man(1, "Scott", asPrinted(xg, 0.274)), man(2, "Bogle", asPrinted(xg, 0.271))], 10);
    expect(top.map((row) => [row.rank, row.name])).toEqual([[1, "Bogle"], [1, "Scott"]]);
  });
});

describe("figureInk", () => {
  // Craig, 21 Oct 2026: FPts is the league's reading, in cyan wherever it is a column; xG and xA stay the one amber measure.
  it("prints FPts cyan and the football lists amber", () => {
    expect(figureInk(list("points"))).toBe("text-info");
    expect(figureInk(list("xg"))).toBe("text-mid");
    expect(figureInk(list("xa"))).toBe("text-mid");
  });
});
