import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { playerTabs } from "./tabs";

// Profile says who he is and Data carries his figures (Craig, 11 Oct 2026): each block draws on one tab, never both.

const drawn = (page: string) => {
  const source = readFileSync(join(__dirname, page), "utf8");
  return new Set([...source.matchAll(/<([A-Z]\w*)[\s/>]/g)].map((tag) => tag[1]));
};

const profile = drawn("page.tsx");
const data = drawn("data/page.tsx");

const WHO_HE_IS = ["BornLine", "Portrait", "AttributeGrid", "Fitness", "SetPieces", "FixtureRun", "RealPosition"];
const FIGURES = ["Rankings", "SeasonMaps", "MatchLog", "PastSeasons"];

describe("the player's Profile and Data tabs", () => {
  it("keeps who he is on the Profile and off Data", () => {
    for (const block of WHO_HE_IS) {
      expect(profile.has(block), block).toBe(true);
      expect(data.has(block), block).toBe(false);
    }
  });

  it("carries every figure on Data and none on the Profile", () => {
    for (const block of FIGURES) {
      expect(data.has(block), block).toBe(true);
      expect(profile.has(block), block).toBe(false);
    }
  });
});

describe("the player's tab strip", () => {
  it("ends on Compare, opened with him as A and the rival as B", () => {
    const tabs = playerTabs("abc12", "xyz34");
    expect(tabs.map((tab) => tab.label)).toEqual(["Profile", "Data", "News", "Transfer", "Compare"]);
    expect(tabs.at(-1)?.href).toBe("/players/analysis?a=abc12&b=xyz34");
  });

  it("opens Compare with him alone when no rival was found", () => {
    expect(playerTabs("abc12", undefined).at(-1)?.href).toBe("/players/analysis?a=abc12");
  });

  it("leaves no second way into Compare on the Profile", () => {
    expect(readFileSync(join(__dirname, "page.tsx"), "utf8")).not.toMatch(/compare/i);
  });
});
