import { describe, expect, it } from "vitest";
import { LEAGUE } from "../league/routes";
import { OWN, teamBack, teamPick } from "./routes";

/** A Fantrax team id, which is sixteen characters of base-36. */
const RIVAL = "1b6gp5utmtj36y3g";

describe("a team's way back on a phone", () => {
  it("falls back to the league table on a rival's squad", () => {
    expect(teamBack(RIVAL)).toBe(LEAGUE);
  });

  it("is not drawn on your own team, which has its own tab", () => {
    expect(teamBack(OWN)).toBeUndefined();
  });
});

describe("the team picker's pick", () => {
  it("opens the picked team at the week on screen", () => {
    expect(teamPick(RIVAL, "8")).toBe(`/squad/${RIVAL}?gw=8`);
  });

  it("opens his default week when the week is not a whole number", () => {
    expect(teamPick(RIVAL, "eight")).toBe(`/squad/${RIVAL}`);
    expect(teamPick(RIVAL, undefined)).toBe(`/squad/${RIVAL}`);
  });

  it("keeps a typed id inside the squad routes", () => {
    expect(teamPick("../news", "8")).toBe("/squad/..%2Fnews?gw=8");
  });

  it("is no pick without a team", () => {
    expect(teamPick(undefined, "8")).toBeNull();
    expect(teamPick("", "8")).toBeNull();
  });
});
