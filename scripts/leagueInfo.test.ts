import { describe, expect, it, vi } from "vitest";
import { readLeagueInfo } from "./leagueInfo";

// Which league is served; Fantrax describes it with no floors, as it always does.
const served = vi.hoisted(() => ({ league: "" }));

vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  get FANTRAX_LEAGUE_ID() {
    return served.league;
  },
  fetchLeagueInfo: async () => ({}),
}));
vi.mock("../data/leagues/roster-limits.json", () => ({
  default: { leagues: { recorded: { minimumsInForce: true, positions: [{ shortName: "D", minActive: 3 }, { shortName: "F", minActive: 1 }] } } },
}));

describe("readLeagueInfo", () => {
  it("carries the formation floors on record for the served league", async () => {
    served.league = "recorded";
    expect((await readLeagueInfo()).roster.minActiveByPosition).toEqual({ D: 3, F: 1 });
  });

  it("carries no floor for a league with none on record", async () => {
    served.league = "unrecorded";
    expect((await readLeagueInfo()).roster.minActiveByPosition).toEqual({});
  });
});
