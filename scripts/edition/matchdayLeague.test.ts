import { describe, expect, it } from "vitest";
import type { Fixture, LeagueTransaction, PlayerStory } from "@epl/core";
import type { DeskFacts } from "./facts";
import { firstStoryAfter, leagueJoin, movesBy } from "./matchdayLeague";

const story = (headline: string, at: string): PlayerStory => ({ id: headline, headline, content: "", analysis: null, at: Date.parse(at) });
const KICKOFF = "2026-09-26T14:00:00Z";
const stories = [story("before", "2026-09-26T09:00:00Z"), story("late", "2026-09-28T09:00:00Z"), story("first", "2026-09-26T18:00:00Z"), story("stale", "2026-10-05T09:00:00Z")];

describe("firstStoryAfter", () => {
  it("is the first story after the kickoff, within a few days of it", () => {
    expect(firstStoryAfter(stories, KICKOFF)).toBe("first");
    expect(firstStoryAfter([stories[0], stories[3]], KICKOFF)).toBeNull();
  });

  it("stops at a cut-off, so a report never reads what was published after it", () => {
    expect(firstStoryAfter(stories, KICKOFF, Date.parse("2026-09-26T17:00:00Z"))).toBeNull();
  });
});

describe("leagueJoin's stake", () => {
  const team = (teamId: string) => ({ teamId, name: teamId });
  const man = (fantraxId: string, code: number, status = "ACTIVE") => ({ slot: { fantraxId, status, position: "M" }, player: { code } });
  const facts = {
    pairings: [
      { home: team("A"), away: team("B") },
      { home: team("C"), away: team("A") },
    ],
    scores: new Map([["A", { points: 40 }], ["B", { points: 30 }], ["C", { points: 50 }]]),
    teams: [{ teamId: "A", teamName: "A", players: [man("f1", 101), man("f2", 102), man("f3", 103, "RESERVE")] }, { teamId: "B", teamName: "B", players: [man("f4", 104)] }],
    playerPoints: new Map(),
    pedigree: new Map(),
    moves: [{ ...row("claim", "f2", "Sat Oct 10, 2026, 6:19AM"), toTeamId: "A" }],
  } as unknown as DeskFacts;
  // Club 1 plays on Saturday and again on Sunday; club 2 only on Saturday.
  const fixture = (id: number, homeClubId: number, kickoff: string) => ({ id, code: id, gameweek: 6, homeClubId, awayClubId: 9, kickoff, homeScore: null, awayScore: null, status: "unstarted", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null }) as unknown as Fixture;
  const clubs = new Map([[101, 1], [102, 2], [103, 1], [104, 1]]);
  const joined = leagueJoin(facts, [fixture(1, 1, "2026-10-10T14:00:00Z"), fixture(2, 2, "2026-10-10T14:00:00Z"), fixture(3, 1, "2026-10-11T14:00:00Z")], clubs, "2026-10-10", 6);

  it("keeps both ties of a double header, running while a match of the period comes after the day", () => {
    expect(joined.holders.get(101)?.h2h).toEqual([
      { opponent: "B", us: 40, them: 30, over: false },
      { opponent: "C", us: 40, them: 50, over: false },
    ]);
  });

  it("marks the man his side claimed this gameweek, and the weekday", () => {
    expect(joined.holders.get(102)?.since).toBe("Saturday");
    expect(joined.holders.get(101)?.since).toBeNull();
  });
});

function row(kind: "claim" | "drop", fantraxId: string, processedAt: string, period = 6): LeagueTransaction {
  return { setId: processedAt, kind, fantraxId, playerName: fantraxId, position: null, club: null, clubName: null, via: null, fromTeamId: null, toTeamId: null, processedAt, period, executed: true };
}

describe("movesBy", () => {
  const teams = new Map([["dome", "domeitalycoach"], ["cows", "Cowthenbeef"]]);
  const rows = [
    { ...row("drop", "doku", "Wed Oct 7, 2026, 4:35PM"), fromTeamId: "dome" },
    { ...row("claim", "amn", "Wed Oct 7, 2026, 4:35PM"), toTeamId: "dome" },
    { ...row("claim", "palestra", "Wed Oct 7, 2026, 3:25PM"), toTeamId: "dome" },
    { ...row("drop", "palestra", "Fri Oct 9, 2026, 3:58PM"), fromTeamId: "dome" },
    { ...row("claim", "palestra", "Sat Oct 10, 2026, 5:15AM"), toTeamId: "dome" },
    { ...row("drop", "eze", "Sat Oct 3, 2026, 9:00AM", 5), fromTeamId: "cows" },
    // 11pm in New York is Sunday in London: after Saturday's page.
    { ...row("drop", "late", "Sat Oct 10, 2026, 11:00PM"), fromTeamId: "cows" },
  ];

  it("keeps each man's last claim or drop this gameweek, by the end of the day in London", () => {
    const { claimed, dropped } = movesBy(rows, 6, "2026-10-10", teams);
    expect(Object.fromEntries(claimed)).toEqual({ amn: { team: "domeitalycoach", day: "Wednesday" }, palestra: { team: "domeitalycoach", day: "Saturday" } });
    expect(Object.fromEntries(dropped)).toEqual({ doku: { team: "domeitalycoach", day: "Wednesday" } });
  });
});
