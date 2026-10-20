import { describe, expect, it } from "vitest";
import type { FootballPlayer, LineupDetail, SquadPlayerDetail } from "@epl/core";
import { autoSubLine, autoSubbed } from "./autoSubbed";

const man = (fantraxId: string, position: string, points: number | null): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId, position, status: "" }, player: { code: 1, name: fantraxId } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: undefined,
  points,
  minutes: [],
});

// Craig's GW7: Sarr started and did not play, Kerkez was numbered first and played.
const sheet: LineupDetail = {
  rows: [
    { position: "G", players: [man("Leno", "G", 6)] },
    { position: "M", players: [man("Sarr", "M", null), man("Palmer", "M", 2)] },
  ],
  bench: [man("Kerkez", "D", 3), man("Hinshelwood", "M", 6), man("Khalaili", "D", 1)],
  shape: "1-2",
};
const names = (s: LineupDetail) => ({ rows: s.rows.map((l) => l.players.map((p) => p.rostered.slot.fantraxId)), bench: s.bench.map((p) => p.rostered.slot.fantraxId) });

describe("autoSubbed", () => {
  it("stands the reserve in the starter's slot and sends the starter to the end of the bench", () => {
    const { sheet: after, marks } = autoSubbed(sheet, [{ off: "Sarr", on: "Kerkez", provisional: false }]);
    expect(names(after)).toEqual({ rows: [["Leno"], ["Kerkez", "Palmer"]], bench: ["Hinshelwood", "Khalaili", "Sarr"] });
    expect(marks).toEqual({ Kerkez: { on: true, with: "Sarr", provisional: false }, Sarr: { on: false, with: "Kerkez", provisional: false } });
  });

  it("leaves the sheet alone with no subs, or a sub naming a man it does not hold", () => {
    expect(autoSubbed(sheet, [])).toEqual({ sheet, marks: {} });
    expect(names(autoSubbed(sheet, [{ off: "Sarr", on: "Nobody", provisional: false }]).sheet)).toEqual(names(sheet));
  });
});

describe("autoSubLine", () => {
  it("says in one plain line who came on for whom, and what waits on a reserve still to play", () => {
    expect(autoSubLine({ on: true, with: "Sarr", provisional: false })).toBe("Auto-sub: on for Sarr, who did not play.");
    expect(autoSubLine({ on: false, with: "Kerkez", provisional: false })).toBe("Auto-sub: did not play, so Kerkez comes on for him.");
    expect(autoSubLine({ on: true, with: "Sarr", provisional: true })).toBe("Auto-sub: comes on for Sarr, who did not play, if he plays.");
    expect(autoSubLine({ on: false, with: "Kerkez", provisional: true })).toBe("Auto-sub: did not play, so Kerkez comes on for him if Kerkez plays.");
  });
});
