import { describe, expect, it } from "vitest";
import { PREM_FIXTURES, premFixturesHref } from "./routes";

describe("premFixturesHref", () => {
  it("names the gameweek", () => {
    expect(premFixturesHref(7)).toBe("/prem/fixtures?gw=7");
  });

  it("opens the tab on its own gameweek for a match FPL has given no round", () => {
    expect(premFixturesHref(null)).toBe(PREM_FIXTURES);
  });
});
