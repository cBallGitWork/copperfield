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
    expect(row({ kind: "kick-off", score: { home: 0, away: 0 } })).toMatchObject({ clock: "KO", word: "Kick-off", where: "Arsenal v Everton" });
    expect(row({ kind: "full-time", score: { home: 2, away: 1 } })).toMatchObject({ clock: "FT", where: "Arsenal 2–1 Everton" });
  });

  it("prints a goal with its minute, scorer, assister and the score it made", () => {
    expect(row({ man: 10, second: 20, score: { home: 1, away: 0 } })).toMatchObject({
      clock: "7′",
      word: "Goal",
      man: { name: "Saka", ownerTeamId: "t1" },
      second: { name: "Pickford", ownerTeamId: null },
      where: "Arsenal 1–0 Everton",
    });
  });

  it("names a booked or changed man's club, and a sending-off is a loss", () => {
    expect(row({ kind: "sent-off", man: 20 })).toMatchObject({ word: "Sent off", loss: true, where: "EVE" });
  });

  it("prints a count line with the dash for its minute and no word", () => {
    const counts = row({ kind: "tally", minute: null, man: 10, counts: [{ name: "DefCon", value: "1" }, { name: "Saves", value: null }] });
    expect(counts).toMatchObject({ clock: "—", word: null, man: { name: "Saka" } });
  });

  it("prints the dash for a man the snapshot cannot name", () => {
    expect(row({ man: 99 }).man?.name).toBe("—");
  });
});
