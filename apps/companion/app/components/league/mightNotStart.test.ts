import { describe, expect, it } from "vitest";
import type { RosterLimits, RosterSlot } from "@epl/core";
import { mightNotStart } from "./mightNotStart";

const on = (fantraxId: string, position: string): RosterSlot => ({ fantraxId, position, status: "ACTIVE" });
const off = (fantraxId: string, position: string): RosterSlot => ({ fantraxId, position, status: "RESERVE" });

// Craig's GW8 shape: Sarr, Kudus and Osula short on minutes, a bench at 81, 73 and 71.
const slots = [
  on("gk", "G"),
  ...["d1", "d2", "d3"].map((id) => on(id, "D")),
  ...["sarr", "kudus", "m3", "m4"].map((id) => on(id, "M")),
  ...["osula", "f2", "f3"].map((id) => on(id, "F")),
  off("khalaili", "D"),
  off("kerkez", "D"),
  off("hinshelwood", "M"),
];
const eligibility = new Map(slots.map((s) => [s.fantraxId, [s.position ?? ""]]));
const limits: RosterLimits = {
  maxTotalPlayers: 14,
  maxActivePlayers: 11,
  maxReservePlayers: 4,
  maxActiveByPosition: { G: 1, D: 5, M: 5, F: 3 },
  minActiveByPosition: { G: 1, D: 3 },
};
const xmins: Record<string, number | null> = {
  gk: 90, d1: 88, d2: 85, d3: 80, sarr: 34, kudus: 46, m3: 85, m4: 80, osula: 48, f2: 85, f3: 84,
  khalaili: 81, kerkez: 73, hinshelwood: 71,
};
const order = slots.map((s) => s.fantraxId);
const run = (minutes: Record<string, number | null>, at = slots, eligible = eligibility) =>
  mightNotStart(at, eligible, limits, (id) => minutes[id] ?? null, order);

describe("mightNotStart", () => {
  it("names each starter short on minutes whom a sub could legally replace, in pitch order", () => {
    // Osula is a forward: Khalaili and Kerkez come on at the back, which the cap of five allows (four men there then).
    expect(run(xmins)).toEqual(["sarr", "kudus", "osula"]);
  });

  it("says nothing when no sub is clearly above him", () => {
    expect(run({ ...xmins, khalaili: 55, kerkez: 50, hinshelwood: 40 })).toEqual(["sarr"]);
  });

  it("needs the swap to be legal", () => {
    // The back line already at its cap of five: a defender off the bench cannot come on for a midfielder.
    const full = slots.map((s) => (s.fantraxId === "m3" || s.fantraxId === "m4" ? { ...s, position: "D" } : s));
    const eligible = new Map(full.map((s) => [s.fantraxId, [s.position ?? ""]]));
    expect(run({ ...xmins, hinshelwood: 20 }, full, eligible)).toEqual([]);
  });

  it("never reads a missing figure as a doubt or as cover", () => {
    expect(run({ ...xmins, sarr: null, kudus: null, osula: null })).toEqual([]);
    expect(run({ ...xmins, khalaili: null, kerkez: null, hinshelwood: null })).toEqual([]);
  });

  it("counts a blank week's nought as a doubt", () => {
    expect(run({ ...xmins, sarr: 85, kudus: 85, osula: 0 })).toEqual(["osula"]);
  });
});
