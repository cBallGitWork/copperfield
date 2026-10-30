import { describe, expect, it } from "vitest";
import type { Club, PrinterLine } from "@epl/core";
import { printerRow } from "./printerRow";

const fixtures = new Map([[900, { homeClubId: 1, awayClubId: 2 }]]);
const clubs = new Map<number, Club>([
  [1, { id: 1, code: 3, name: "Arsenal", shortName: "ARS" }],
  [2, { id: 2, code: 11, name: "Everton", shortName: "EVE" }],
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
  second: null,
  score: null,
  counts: [],
  ...over,
});
const row = (over: Partial<PrinterLine>) => printerRow(line(over), fixtures, clubs, players, owners);

describe("printerRow", () => {
  it("prints a whistle as its letters and the match, the score once there is one", () => {
    expect(row({ kind: "kick-off", score: { home: 0, away: 0 } })).toMatchObject({
      clock: "KO",
      word: "Kick-off",
      match: { home: "Arsenal", score: null, away: "Everton" },
    });
    expect(row({ kind: "full-time", score: { home: 2, away: 1 } })).toMatchObject({ clock: "FT", match: { home: "Arsenal", score: "2–1", away: "Everton" } });
  });

  it("prints a goal with its minute, scorer, assister and the score it made", () => {
    expect(row({ man: 10, second: 20, score: { home: 1, away: 0 } })).toMatchObject({
      clock: "7′",
      word: "Goal",
      man: { name: "Saka", ownerTeamId: "t1" },
      second: { name: "Pickford", ownerTeamId: null },
      match: { home: "Arsenal", score: "1–0", away: "Everton" },
    });
  });

  it("names a booked or changed man's club, and a sending-off is a loss", () => {
    expect(row({ kind: "sent-off", man: 20 })).toMatchObject({ word: "Sent off", loss: true, club: "EVE", match: null });
    expect(row({ kind: "on", man: 10 })).toMatchObject({ word: "On", club: "ARS" });
  });

  it("prints a count line with no clock and no word: it sits under its whistle or its match's heading", () => {
    const counts = row({ kind: "tally", minute: null, man: 10, counts: [{ name: "DefCon", value: "1" }, { name: "Saves", value: null }] });
    expect(counts).toMatchObject({ clock: "", word: null, man: { name: "Saka" } });
  });

  it("heads a match in play with the match and its score", () => {
    expect(row({ kind: "in-play", minute: null, score: { home: 1, away: 0 } })).toMatchObject({
      clock: "",
      word: "In play",
      live: true,
      match: { home: "Arsenal", score: "1–0", away: "Everton" },
    });
  });

  it("prints the dash for a man the snapshot cannot name", () => {
    expect(row({ man: 99 }).man?.name).toBe("—");
  });
});
