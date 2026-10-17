import { describe, expect, it } from "vitest";
import { americanisms } from "./banned";
import { checkBin } from "./binXi/checks";
import { NICKNAMES, clubNickname } from "./clubNames";

describe("British football English", () => {
  it("is one list every desk reads: American idiom, sport and spelling", () => {
    expect(americanisms("He stepped up, it was a tie game, a hat trick and a shut-out, and his behavior was awesome.")).toEqual(
      expect.arrayContaining(["stepped up", "tie game", "hat trick", "shut-out", "behavior", "awesome"]),
    );
    // British copy stays clean: a cup tie, a loss of form, practice the noun.
    expect(americanisms("A cup tie, a loss of form, and in practice a full-back's hat-trick.")).toEqual([]);
  });

  it("reaches the desks that read only half of it before", () => {
    const faults = checkBin({ headline: "Bins", body: "He leaned on nobody and stepped up." }, { brief: "", names: [], total: 0 });
    expect(faults.map((f) => f.evidence)).toContain("stepped up");
  });

  it("gives a club its own nickname, and none it shares", () => {
    expect(clubNickname("Ipswich Town")).toBe("the Tractor Boys");
    expect(clubNickname("Liverpool")).toBeNull();
    expect(NICKNAMES).toContain("Tottenham Hotspur, the Lilywhites");
  });
});
