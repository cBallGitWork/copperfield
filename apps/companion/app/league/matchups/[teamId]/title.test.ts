import { describe, expect, it, vi } from "vitest";
import { headToHeadTitle } from "./title";

vi.mock("../../../round", () => ({
  readCalendar: async () => [
    { period: 6, gameweeks: [6], own: 6 },
    { period: 7, gameweeks: [7], own: 7 },
  ],
  leagueInfo: async () => ({ teams: [{ teamId: "a", name: "The Raccoons" }], matchups: [{ period: 6 }, { period: 7 }] }),
}));

const titleFor = (gw?: string) =>
  headToHeadTitle({ params: Promise.resolve({ teamId: "a" }), searchParams: Promise.resolve({ gw }) });

// 19 Oct 2026: ?gw=99 drew GW7, the default, under a title that said "Gameweek 99".
describe("a head-to-head's title", () => {
  it("names the gameweek asked for when the league plays it", async () => {
    expect((await titleFor("6")).title).toContain("Gameweek 6");
  });

  it("names none for a week the league does not play, as the page opens the default", async () => {
    for (const gw of ["99", "0", "1"]) expect((await titleFor(gw)).title).not.toContain("Gameweek");
  });
});
