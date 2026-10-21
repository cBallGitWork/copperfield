import { describe, expect, it } from "vitest";
import type { LeagueTransaction } from "@epl/core";
import { holding } from "./holding";

const claim = (over: Partial<LeagueTransaction> = {}) => ({
  transaction: {
    setId: "s1", kind: "claim", fantraxId: "03gu4", playerName: "Harry Maguire", position: "D", club: "MUN",
    clubName: null, via: null, fromTeamId: null, toTeamId: "t1", processedAt: "Wed Oct 7, 2026, 9:14AM", period: 6,
    executed: true, ...over,
  } as LeagueTransaction,
  fromName: null,
  toName: "test3",
});

// 19 Oct 2026: a man nobody holds read "Held by Waivers"; 21 Oct: the bar names his holder, so the line never does.
describe("the Profile's transfer line", () => {
  it("says how a held man joined, never who holds him", () => {
    expect(holding("t1", "T", { joined: claim() })).toEqual({ label: "Joined", value: "Claimed, Wed 7 Oct" });
    expect(holding("t1", "T", { joined: claim({ kind: "trade", fromTeamId: "t2" }) }).value).toBe("Traded, Wed 7 Oct");
  });

  it("reads a held man with no move to him as the draft's", () => {
    expect(holding("t1", "T", { joined: null })).toEqual({ label: "Joined", value: "In the draft" });
  });

  it("is absent for a held man when the log was not read whole", () => {
    expect(holding("t1", "T", "unknown")).toEqual({ label: "Joined", value: null });
  });

  it("gives a free man's status in plain words", () => {
    expect(holding(null, "WW", { dropped: null })).toEqual({ label: "Status", value: "On waivers" });
    expect(holding(null, "FA", { dropped: null })).toEqual({ label: "Status", value: "Free agent" });
  });

  it("is absent when Fantrax gave no status", () => {
    expect(holding(null, "", { dropped: null })).toEqual({ label: "Status", value: null });
  });
});
