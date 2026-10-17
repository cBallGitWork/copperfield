import { describe, expect, it, vi } from "vitest";
import HeadToHeadPage from "./page";

const reads = vi.hoisted(() => ({
  getLeagueSquads: vi.fn(),
  calendar: [
    { period: 5, gameweeks: [5], own: 5 },
    { period: 6, gameweeks: [6], own: 6 },
    { period: 7, gameweeks: [7], own: 7 },
  ],
}));
vi.mock("../../../round", () => ({
  readCalendar: async () => reads.calendar,
  // The league's schedule starts at period 6: gameweek 5 is a week before it.
  leagueInfo: async () => ({ matchups: [{ period: 6 }, { period: 7 }] }),
}));
vi.mock("../../../squads", () => ({
  getLeagueSquads: reads.getLeagueSquads,
  readableOr404: () => {
    throw new Error("read");
  },
  teamDisplay: () => null,
}));
// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path, or a stand-in.
vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/config", () => import("../../../config"));
vi.mock("@/app/components/league/StandingsTable", () => import("../../../components/league/StandingsTable"));
vi.mock("@/app/components/league/TeamName", () => import("../../../components/league/TeamName"));
vi.mock("@/app/components/shell/Absent", () => import("../../../components/shell/Absent"));
vi.mock("@/app/squad/routes", () => import("../../../squad/routes"));
vi.mock("@/app/mine", () => import("../../../mine"));
vi.mock("@/app/teamNames", () => import("../../../teamNames"));
vi.mock("@/app/teamColours", () => import("../../../teamColours"));
vi.mock("@/app/components/shell/Link", () => ({ default: () => null }));

const open = (gw: string) =>
  HeadToHeadPage({ params: Promise.resolve({ teamId: "a" }), searchParams: Promise.resolve({ gw }) }).catch(() => null);

// #529: `?gw=` went through the whole calendar, so ?gw=5 opened a week before the league.
describe("the head-to-head's ?gw=", () => {
  it("opens a gameweek the league plays", async () => {
    await open("6");
    expect(reads.getLeagueSquads).toHaveBeenLastCalledWith({ gameweek: 6, period: 6 });
  });

  it("opens the default for a gameweek before the league", async () => {
    await open("5");
    expect(reads.getLeagueSquads).toHaveBeenLastCalledWith(null);
  });
});
