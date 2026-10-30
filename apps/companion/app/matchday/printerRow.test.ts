import { describe, expect, it } from "vitest";
import type { Club, PrinterLine } from "@epl/core";
import { printerRow } from "./printerRow";

const fixtures = new Map([[900, { homeClubId: 1, awayClubId: 2 }]]);
const ARSENAL: Club = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" };
const EVERTON: Club = { id: 2, code: 11, name: "Everton", shortName: "EVE" };
const clubs = new Map<number, Club>([
  [1, ARSENAL],
  [2, EVERTON],
]);
const players = new Map([
  [10, { name: "Saka", clubId: 1 }],
  [20, { name: "Pickford", clubId: 2 }],
]);
const owners = new Map([[10, { teamId: "t1", teamName: "Raccoons" }]]);

const line = (over: Partial<PrinterLine>): PrinterLine => ({
  key: "k",
  fixtureCode: 900,
  kind: "goal",
  minute: "7",
  at: 1,
  man: null,
  points: null,
  second: null,
  secondPoints: null,
  score: null,
  counts: [],
  ...over,
});
const row = (over: Partial<PrinterLine>) => printerRow(line(over), fixtures, clubs, players, owners);

describe("printerRow", () => {
  it("prints a whistle as its letters and both sides with their crests, a score once one stands", () => {
    expect(row({ kind: "kick-off", score: { home: 0, away: 0 } })).toMatchObject({
      word: "KO",
      minute: null,
      sides: [
        { club: ARSENAL, name: "Arsenal", score: null },
        { club: EVERTON, name: "Everton", score: null },
      ],
    });
    expect(row({ kind: "full-time", score: { home: 2, away: 1 } }).sides?.map((side) => side.score)).toEqual([2, 1]);
  });

  it("prints a goal with its minute, scorer and assister with their clubs and points, and the score it made", () => {
    expect(row({ man: 10, points: 5, second: 20, secondPoints: null, score: { home: 1, away: 0 } })).toMatchObject({
      word: "Goal",
      minute: "7′",
      man: { name: "Saka", club: ARSENAL, owner: { teamId: "t1", teamName: "Raccoons" }, points: "+5" },
      second: { word: "As", man: { name: "Pickford", club: EVERTON, owner: null, points: null } },
      score: "ARS 1–0 EVE",
      sides: null,
    });
  });

  it("signs a loss, and prints no figure for a nought", () => {
    expect(row({ kind: "booked", man: 10, points: -1 }).man?.points).toBe("-1");
    expect(row({ kind: "booked", man: 10, points: 0 }).man?.points).toBeNull();
  });

  it("prints a change as the man coming on and the man taken off, with his counts and their points", () => {
    const change = row({ kind: "injury", man: 20, second: 10, counts: [{ name: "DefCon", value: "1", points: 2 }] });
    expect(change).toMatchObject({ word: "Injury", second: { word: "Off", man: { name: "Saka" } }, score: null });
    expect(change.counts).toEqual([{ name: "DefCon", value: "1", points: "+2" }]);
  });

  it("prints a man's full-time counts with no word and no minute: they sit under the whistle", () => {
    expect(row({ kind: "tally", minute: null, man: 10 })).toMatchObject({ word: null, minute: null, man: { name: "Saka" } });
  });

  it("prints the dash for a man the snapshot cannot name", () => {
    expect(row({ man: 99 }).man).toMatchObject({ name: "—", club: null });
  });
});
