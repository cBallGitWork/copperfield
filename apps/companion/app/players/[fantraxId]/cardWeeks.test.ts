import { describe, expect, it } from "vitest";
import type { Club, ExpectedMinutes, GameLogEntry, Opposition, PlayerMatch } from "@epl/core";
import { formMatches, handedWeeks, nextMatches } from "./cardWeeks";
import type { MatchRow } from "./matchRows";

const club = (id: number, shortName: string): Club => ({ id, code: id, name: shortName, shortName });

const row = (gameweek: number, minutes: number, points: number | null, paidRow = true): MatchRow => ({
  fpl: {
    match: { gameweek, fixtureId: gameweek, opponentClubId: gameweek, home: gameweek % 2 === 0, minutes } as GameLogEntry,
    opponent: club(gameweek, `C${gameweek}`),
  },
  paid: paidRow ? ({ points } as PlayerMatch) : null,
  mark: null,
});

describe("formMatches", () => {
  // The log comes most recent first; the strip reads left to right, oldest first.
  const rows = [row(7, 90, 6), row(6, 0, 0), row(5, 45, 0), row(4, 90, 9)];

  it("takes his latest three, oldest first", () => {
    expect(formMatches(rows).map((m) => m.gameweek)).toEqual([5, 6, 7]);
  });

  it("prints a played nought, and no reading for a match he was not on", () => {
    expect(formMatches(rows).map((m) => m.points)).toEqual([0, null, 6]);
  });

  it("has no league figure where Fantrax's window does not reach", () => {
    expect(formMatches([row(3, 90, null, false)])[0].points).toBeNull();
  });

  it("names the opponent and the venue", () => {
    expect(formMatches(rows)[2]).toMatchObject({ opponent: "C7", home: false });
  });

  it("is empty for a man with no matches", () => {
    expect(formMatches([])).toEqual([]);
  });
});

const match = (id: number, gameweek: number | null, status = "upcoming"): Opposition =>
  ({ club: club(id, `N${id}`), home: true, difficulty: 3, fixture: { id, gameweek, status } }) as unknown as Opposition;

describe("nextMatches", () => {
  const minutes = new Map<number, number | null>([[8, 80], [9, 20]]);

  it("puts the week's xMins under the week's first match only", () => {
    const run = nextMatches([match(1, 8), match(2, 9), match(3, 9)], minutes, 5);
    expect(run.map((m) => m.minutes)).toEqual([80, 20, undefined]);
  });

  it("stops at the count asked", () => {
    expect(nextMatches([match(1, 8), match(2, 9), match(3, 10)], minutes, 2)).toHaveLength(2);
  });

  it("prints no figure for a week the model does not cover, and keeps a rearranged match's place", () => {
    const run = nextMatches([match(1, 10), match(2, null)], minutes, 5);
    expect(run[0].minutes).toBeNull();
    expect(run[1]).toMatchObject({ gameweek: null, against: { shortName: "N2" } });
  });
});

describe("handedWeeks", () => {
  it("keeps the screen's weeks and figures, with no opponent", () => {
    const weeks: ExpectedMinutes[] = [{ gameweek: 8, minutes: 70 } as ExpectedMinutes];
    expect(handedWeeks(weeks)).toEqual([{ key: "gw8", gameweek: 8, against: null, minutes: 70 }]);
  });

  it("puts the screen's own opponent on his week", () => {
    const weeks = [{ gameweek: 8, minutes: 70 }, { gameweek: 9, minutes: 60 }] as ExpectedMinutes[];
    const run = handedWeeks(weeks, [match(4, 8)]);
    expect(run.map((m) => m.against?.shortName ?? null)).toEqual(["N4", null]);
  });

  // UX-10: a match in play is never shown as "next".
  it("drops a week whose only match has kicked off", () => {
    const weeks = [{ gameweek: 8, minutes: 70 }, { gameweek: 9, minutes: 60 }] as ExpectedMinutes[];
    expect(handedWeeks(weeks, [match(4, 8, "live")]).map((m) => m.gameweek)).toEqual([9]);
    expect(handedWeeks(weeks, [match(4, 8, "finished")]).map((m) => m.gameweek)).toEqual([9]);
  });

  it("keeps a double gameweek's match still to come", () => {
    const weeks = [{ gameweek: 8, minutes: 70 }] as ExpectedMinutes[];
    const run = handedWeeks(weeks, [match(4, 8, "finished"), match(5, 8)]);
    expect(run.map((m) => m.against?.shortName)).toEqual(["N5"]);
  });
});
