import { describe, expect, it, vi } from "vitest";
import type { FootballSnapshot, PlayerMatchStats } from "@epl/core";
import { fixture } from "../../packages/core/src/gazette/reports/__fixtures__/spursVilla";
import type { DeskFacts } from "./facts";
import { matchdayInput, seasonLines, startsEarlierThisRound } from "./matchday";

vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  fetchFixtures: () => Promise.reject(new Error("refused")),
  fetchPlRound: () => Promise.reject(new Error("refused")),
}));

const row = (playerId: number, starts: number, goals: number, fixtureId = 1, minutes = 90): PlayerMatchStats => ({
  playerId, fixtureId, minutes, goals, assists: 0, cleanSheet: false, goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0,
  penaltiesMissed: 0, yellowCards: 0, redCards: 0, saves: 0, expectedGoals: 0, expectedAssists: 0, starts, fplPoints: 0,
});
// A double gameweek: fixture 1 on Tuesday, fixture 2 on Saturday.
const TUE = "2026-10-20";
const SAT = "2026-10-24";
const fixtures = [{ id: 1, kickoff: "2026-10-20T19:00:00Z" }, { id: 2, kickoff: "2026-10-24T14:00:00Z" }];
const snapshot = { players: [{ id: 7, code: 700 }], stats: [row(7, 1, 1)], fixtures };
const kickoffs = new Map(fixtures.map((f) => [f.id, f.kickoff]));

describe("seasonLines", () => {
  it("counts a man's starts and goals over every past gameweek, and this one's goals, by code", () => {
    expect(seasonLines([[row(7, 1, 2)], [row(7, 0, 0)]], snapshot, TUE)?.get(700)).toEqual({ startsBefore: 1, matchesBefore: 0, goalsSeason: 3 });
  });

  it("counts a past double's two starts as two, since FPL writes the gameweek's count on both rows", () => {
    expect(seasonLines([[row(7, 2, 0, 1), row(7, 2, 0, 2)]], snapshot, TUE)?.get(700)?.startsBefore).toBe(2);
  });

  it("counts none of this gameweek's goals from a later day, when the report is written late", () => {
    const late = { ...snapshot, stats: [row(7, 2, 1, 1), row(7, 2, 2, 2)] };
    expect(seasonLines([], late, TUE)?.get(700)?.goalsSeason).toBe(1);
    expect(seasonLines([], late, SAT)?.get(700)?.goalsSeason).toBe(3);
  });

  it("tells nobody's season when a past gameweek would not load", () => {
    expect(seasonLines([[row(7, 1, 2)], null], snapshot, TUE)).toBeNull();
  });
});

describe("startsEarlierThisRound", () => {
  const both = [row(7, 2, 0, 1), row(7, 2, 0, 2)];

  it("counts Tuesday's start in Saturday's report, so Saturday is not his first league start", () => {
    expect(startsEarlierThisRound(both, kickoffs, SAT, true)).toBe(1);
  });

  it("counts nothing before Tuesday in a Tuesday report written after Saturday", () => {
    expect(startsEarlierThisRound(both, kickoffs, TUE, true)).toBe(0);
  });

  it("counts no start from a Tuesday he came off the bench in, when he starts Saturday", () => {
    expect(startsEarlierThisRound([row(7, 1, 0, 1), row(7, 1, 0, 2)], kickoffs, SAT, true)).toBe(0);
  });

  it("counts Tuesday's start for a man on the bench on Saturday", () => {
    expect(startsEarlierThisRound([row(7, 1, 0, 1), row(7, 1, 0, 2, 20)], kickoffs, SAT, false)).toBe(1);
  });

  it("counts nothing in a single gameweek, whose one fixture is today", () => {
    expect(startsEarlierThisRound([row(7, 1, 0, 2)], kickoffs, SAT, true)).toBe(0);
  });
});

describe("matchdayInput", () => {
  it("files no report when FPL will not give the season's fixtures, which the table is read from", async () => {
    const said: string[] = [];
    const day: FootballSnapshot = {
      clubs: [], players: [], fixtures: [fixture], stats: [], gameweek: 5, deadline: null, gameweeks: [5],
      fetchedAt: "2026-09-20T09:00:00Z", dataChecked: true, statsUnavailable: false,
    };
    // Facts are read only after the season and the round.
    expect(await matchdayInput({ snapshot: day, facts: {} as DeskFacts, scoring: undefined, pick: () => true, say: (m) => said.push(m) })).toBeNull();
    expect(said).toEqual(["FPL would not give the season's fixtures, which the table is read from."]);
  });
});
