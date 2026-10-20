import { describe, expect, it } from "vitest";
import { matchupsLanding } from "./landing";

describe("matchupsLanding", () => {
  it("sends a bare old Matchups link to the gameweek in focus Matchups showed, not Fixtures' default", () => {
    expect(matchupsLanding(7)).toBe("/league/fixtures?gw=7");
  });

  it("falls back to Fixtures' own default when no gameweek is in view", () => {
    expect(matchupsLanding(null)).toBe("/league/fixtures");
  });
});
