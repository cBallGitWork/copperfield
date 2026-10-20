import { describe, expect, it } from "vitest";
import type { RosteredPlayer, RosteredTeam } from "@epl/core";
import { rosterOrder, squadTabOrder } from "./order";

const line = (fantraxId: string) => ({ fantraxId });
const slot = (fantraxId: string, position: string, status = "ACTIVE"): RosteredPlayer => ({
  slot: { fantraxId, position, status },
  unresolved: "unmapped",
});

// A real team as Fantrax lists it, which is no screen's order: the keeper sits 7th.
const team: RosteredTeam = {
  teamId: "t1",
  teamName: "T",
  players: [
    slot("Kerkez", "D"),
    slot("Sarr", "F"),
    slot("Khalaili", "D"),
    slot("Osula", "F", "RESERVE"),
    slot("Dewsbury-Hall", "M"),
    slot("Van Hecke", "D", "RESERVE"),
    slot("Leno", "G"),
    slot("Haaland", "F"),
    slot("Hinshelwood", "M", "RESERVE"),
    slot("Matheus N.", "D"),
    slot("Silva", "D"),
    slot("Gonzalo", "F"),
    slot("Kudus", "M"),
    slot("Palmer", "M"),
  ],
};

// The stats read's order: outfield by points, then the keepers.
const read = ["Haaland", "Palmer", "Dewsbury-Hall", "Van Hecke", "Khalaili", "Kerkez", "Matheus N.", "Gonzalo",
  "Hinshelwood", "Kudus", "Silva", "Osula", "Sarr", "Leno"].map(line);
const opened = (ids: string[]) => rosterOrder(read, ids).map((each) => each.fantraxId);

describe("squadTabOrder", () => {
  it("opens in the order the Squad tab prints: the eleven by line, keeper first, then the bench", () => {
    expect(opened(squadTabOrder(team, "lineup", []))).toEqual([
      "Leno", "Kerkez", "Khalaili", "Matheus N.", "Silva", "Dewsbury-Hall", "Kudus", "Palmer", "Sarr", "Haaland",
      "Gonzalo", "Van Hecke", "Hinshelwood", "Osula",
    ]);
  });

  it("brings the bench on in Fantrax's order when it has one", () => {
    expect(opened(squadTabOrder(team, "lineup", ["Osula", "Van Hecke"])).slice(-3)).toEqual([
      "Osula", "Van Hecke", "Hinshelwood",
    ]);
  });

  it("before the lock, a rival's men by line and by name, so the board says nothing of who starts", () => {
    expect(opened(squadTabOrder(team, "squad", []))).toEqual([
      "Leno", "Kerkez", "Khalaili", "Matheus N.", "Silva", "Van Hecke", "Dewsbury-Hall", "Hinshelwood", "Kudus",
      "Palmer", "Gonzalo", "Haaland", "Osula", "Sarr",
    ]);
  });
});

describe("rosterOrder", () => {
  it("keeps a man the read has and the order lacks, at the foot, in the read's order", () => {
    const lines = [line("x"), line("leno"), line("y")];
    expect(rosterOrder(lines, ["leno"]).map((each) => each.fantraxId)).toEqual(["leno", "x", "y"]);
  });
});
