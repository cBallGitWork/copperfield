import { describe, expect, it, vi } from "vitest";
import { readMatchParts } from "./matchParts";

// The Premier League's own match detail timed out from Vercel 91 times in six hours on 11 Oct: the card must not need it.
vi.mock("next/cache", () => ({ unstable_cache: <F>(read: F) => read }));
vi.mock("./scoring", () => ({ leagueScoring: async () => null }));
vi.mock("./plFeed", async (actual) => ({
  ...(await actual<typeof import("./plFeed")>()),
  theirFixture: async () => ({ id: 128973 }),
  plFixture: async () => {
    throw new Error("footballapi.pulselive.com /football/fixtures/128973 → TIMEOUT");
  },
}));
vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  fetchPlPlayerMatchStats: async (playerId: number, fixtureId: number) =>
    playerId === 69914 && fixtureId === 128973
      ? { stats: [{ name: "appearances", value: 1 }, { name: "won_tackle", value: 3 }] }
      : { stats: [] },
}));

describe("readMatchParts", () => {
  it("reads a man the bridge names without the match detail, so its timeout does not empty the card", async () => {
    // Calafiori: Opta p466075 is the Premier League's 69914 in data/mappings/premierleague.json.
    const read = await readMatchParts({ opta: "p466075", fixtures: [{ gameweek: 6, code: 2561899 }], position: "D" });
    expect(read.parts?.tacklesWon).toBe(3);
  });
});
