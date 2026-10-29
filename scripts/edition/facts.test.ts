import { describe, expect, it, vi } from "vitest";
import { mapLeagueInfo, type FootballSnapshot } from "@epl/core";
import real from "../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";

vi.mock("@epl/core", async (actual) => {
  const refused = () => Promise.reject(new Error("refused"));
  return {
    ...(await actual<typeof import("@epl/core")>()),
    fetchLiveScoring: refused, fetchTeamRosters: refused, fetchTransactions: refused, fetchDraftResults: refused, fetchStandingsPage: refused,
  };
});
const { gatherRoundFacts } = await import("./facts");

describe("gatherRoundFacts", () => {
  it("reads every refused surface as empty, so the filing still goes ahead", async () => {
    // With the rosters refused the snapshot is never joined, so an empty one stands in.
    const facts = await gatherRoundFacts(mapLeagueInfo(real), { players: [], stats: [] } as unknown as FootballSnapshot, 1);
    expect([facts.moves, facts.traded, facts.trades, facts.business, facts.teams, facts.table]).toEqual([[], [], [], [], [], []]);
    expect([facts.scores.size, facts.playerPoints.size, facts.pedigree.size, facts.fielded]).toEqual([0, 0, 0, false]);
  });
});
