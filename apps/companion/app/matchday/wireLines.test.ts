import { describe, expect, it } from "vitest";
import type { Club, FootballPlayer, FootballSnapshot, MatchEvent, PlayerOwner } from "@epl/core";
import { wireLines } from "./wireLines";

// The goals joined to their men: the order and the minute Scores prints under each match.

const HOME = 1;
const AWAY = 2;
const FIXTURE = 2645221;

function club(id: number, short: string): Club {
  return { id, code: id, name: `${short} Town`, shortName: short } as Club;
}

function player(code: number, clubId: number): FootballPlayer {
  return { code, id: code, name: `P${code}`, clubId, optaCode: null } as FootballPlayer;
}

function snapshot(players: FootballPlayer[]): FootballSnapshot {
  return {
    clubs: [club(HOME, "HOM"), club(AWAY, "AWY")],
    players,
    fixtures: [
      {
        id: 1,
        code: FIXTURE,
        homeClubId: HOME,
        awayClubId: AWAY,
        homeScore: 3,
        awayScore: 1,
      },
    ],
  } as FootballSnapshot;
}

function goal(over: Partial<MatchEvent> & { minute: string; code: number }): MatchEvent {
  return {
    id: Number(over.minute.split("+")[0]),
    fixtureCode: FIXTURE,
    kind: "goal",
    seconds: 0,
    absolute: 0,
    players: [over.code, null],
    ...over,
  } as MatchEvent;
}

describe("wireLines order", () => {
  it("orders the goals newest first, an untimed one last", () => {
    const players = [player(10, HOME)];
    const events = [
      goal({ minute: "12", code: 10, absolute: 720_000 }),
      goal({ minute: "50", code: 10, absolute: null }),
      goal({ minute: "80", code: 10, absolute: 4_800_000 }),
    ];
    expect(wireLines(events, snapshot(players), undefined, null).map((row) => row.minute)).toEqual(["80", "12", "50"]);
  });

  it("marks the reader's own man and nobody else's", () => {
    const owners = new Map<number, PlayerOwner>([[10, { teamId: "me", teamName: "Mine" }]]);
    const [line] = wireLines([goal({ minute: "3", code: 10 })], snapshot([player(10, HOME)]), owners, "me");
    expect(line?.man?.mine).toBe(true);
  });
});

describe("wireLines minutes", () => {
  it("prints a minute as football does, without the clock's leading nought", () => {
    const events = [
      goal({ minute: "90", code: 10, absolute: 3 }),
      goal({ minute: "45+2", code: 10, absolute: 2 }),
      goal({ minute: "09", code: 10, absolute: 1 }),
    ];
    const rows = wireLines(events, snapshot([player(10, HOME)]), undefined, null);
    expect(rows.map((row) => row.minute)).toEqual(["90", "45+2", "9"]);
  });
});
