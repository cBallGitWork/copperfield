import { type ReactElement, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { FootballSnapshot, LineupDetail, RosteredTeam } from "@epl/core";

// A1, review round 5: the Squad tab numbered GW9's bench Branthwaite, Scherpen, Diarra, Wieffer as Fantrax does; the
// Match tab listed the same team's bench in position order.

const reads = vi.hoisted(() => ({
  benchOrder: vi.fn(async (teamId: string) => (teamId === "a" ? ["diarra", "scherpen", "branthwaite"] : [])),
}));
vi.mock("../../../benchOrders", () => ({ benchOrder: reads.benchOrder }));
vi.mock("../../../poolNews", () => ({ readPoolNews: async () => null, newsFor: () => ({}) }));
vi.mock("../../../scoreboard", () => ({ squadLivePoints: async () => null, liveScores: async () => null }));
vi.mock("../../../clock", () => ({ now: () => new Date("2026-10-30T12:00:00Z") }));
vi.mock("../../../standings", () => ({ leagueTable: async () => [] }));
vi.mock("../../../round", () => ({ planningRound: async () => ({ period: 9 }) }));
vi.mock("../../../session", () => ({ myTeamId: async () => "a" }));
vi.mock("../title", () => ({ teamTitle: () => async () => ({}) }));
vi.mock("@/app/components/shell/Link", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/league/routes", () => ({ matchupHref: () => "/" }));
vi.mock("@/app/teamColours", () => ({ teamColours: () => ({}) }));
// What draws the sides; the case reads what the page hands them.
vi.mock("../../../components/league/TeamName", () => ({ default: () => null }));
vi.mock("../Shell", () => ({ default: () => null }));
vi.mock("../../../league/matchups/[teamId]/sides", () => ({ SquadList: () => null }));

const man = (fantraxId: string, position: string, status: string) => ({
  slot: { fantraxId, position, status },
  player: { code: 1, clubId: null, name: fantraxId, newsAdded: null, status: "a", news: "", chanceOfPlaying: null },
  stats: [],
});
const team = (teamId: string): RosteredTeam =>
  ({
    teamId,
    teamName: teamId.toUpperCase(),
    players: [
      man(`${teamId}-keeper`, "G", "ACTIVE"),
      man("scherpen", "G", "RESERVE"),
      man("branthwaite", "D", "RESERVE"),
      man("diarra", "M", "RESERVE"),
    ],
  }) as unknown as RosteredTeam;
const snapshot = {
  clubs: [], players: [], stats: [], gameweek: 9, deadline: null, gameweeks: [9], fetchedAt: "2026-10-30T12:00:00Z",
  dataChecked: true, statsUnavailable: false,
  fixtures: [{ id: 1, code: 1, gameweek: 9, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-31T15:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null }],
} as unknown as FootballSnapshot;
const squads = {
  snapshot,
  roundPeriod: 9,
  period: { teams: [team("a"), team("b")] },
  info: {
    scoringCategories: {},
    teams: [{ teamId: "a", name: "A" }, { teamId: "b", name: "B" }],
    matchups: [{ period: 9, homeTeamId: "a", awayTeamId: "b" }],
  },
};
vi.mock("../../../squads", () => ({
  getLeagueSquads: async () => squads,
  readableOr404: (read: unknown) => read,
  // Your own eleven is always shown; the rival's waits for the lock.
  teamDisplay: (_squads: unknown, mine: boolean) => (mine ? { show: "lineup", period: 9 } : { show: "squad", because: "not-locked", period: 9 }),
}));

import NextMatchPage from "./page";

/** Every `listed` side the page hands a squad list, depth first. */
function listedSides(node: unknown, out: unknown[] = []): unknown[] {
  if (Array.isArray(node)) node.forEach((child) => listedSides(child, out));
  if (!isValidElement(node)) return out;
  const props = (node as ReactElement<Record<string, unknown>>).props;
  if ("listed" in props) out.push(props.listed);
  for (const value of Object.values(props)) listedSides(value, out);
  return out;
}

describe("the Match tab's bench", () => {
  it("lists your bench in Fantrax's numbered order, as the Squad tab does", async () => {
    const page = await NextMatchPage({ params: Promise.resolve({ teamId: "me" }), searchParams: Promise.resolve({}) });
    const yours = listedSides(page).find((side) => side !== undefined && "sheet" in (side as object)) as { sheet: LineupDetail };
    expect(yours.sheet.bench.map((detail) => detail.rostered.slot.fantraxId)).toEqual(["diarra", "scherpen", "branthwaite"]);
    expect(reads.benchOrder).toHaveBeenCalledWith("a", 9, false);
  });
});
