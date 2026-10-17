import { describe, expect, it } from "vitest";
import type { RosterLimits, RosterSlot } from "@epl/core";
import { whyBlocked } from "./blocked";

const on = (fantraxId: string, position: string): RosterSlot => ({ fantraxId, position, status: "ACTIVE" });
const off = (fantraxId: string, position: string): RosterSlot => ({ fantraxId, position, status: "RESERVE" });

// A 1-3-4-3 with the league's floors: one keeper and three at the back.
const slots = [
  on("trafford", "G"),
  ...["d1", "d2", "d3"].map((id) => on(id, "D")),
  ...["mainoo", "m2", "m3", "m4"].map((id) => on(id, "M")),
  ...["ndoye", "f2", "f3"].map((id) => on(id, "F")),
  off("foden", "M"),
  off("minteh", "F"),
];
const eligibility = new Map(slots.map((s) => [s.fantraxId, [s.position ?? ""]]));
const limits: RosterLimits = {
  maxTotalPlayers: 13,
  maxActivePlayers: 11,
  maxReservePlayers: 4,
  maxActiveByPosition: { G: 1, D: 5, M: 5, F: 3 },
  minActiveByPosition: { G: 1, D: 3 },
};
const name = (id: string) => id[0].toUpperCase() + id.slice(1);
const why = (picked: string, tapped: string) => whyBlocked(slots, eligibility, limits, picked, tapped, name);

describe("whyBlocked", () => {
  it("names the formation floor a swap would break", () => {
    expect(why("trafford", "foden")).toBe("The XI needs at least 1 GK.");
    expect(why("d1", "minteh")).toBe("The XI needs at least 3 DEF.");
  });

  it("names the cap the man coming on would break", () => {
    expect(why("minteh", "m2")).toBe("The XI allows at most 3 FWD.");
  });

  it("says two starters do not swap", () => {
    expect(why("mainoo", "trafford")).toBe("Mainoo can only swap with a sub.");
  });

  it("says nothing for two subs, who always swap places on the bench", () => {
    expect(why("foden", "minteh")).toBeNull();
  });

  it("says when the league has not said where the man coming on can play", () => {
    const unknown = new Map(eligibility);
    unknown.delete("foden");
    expect(whyBlocked(slots, unknown, limits, "d1", "foden", name)).toBe("Foden has no position to play.");
  });
});
