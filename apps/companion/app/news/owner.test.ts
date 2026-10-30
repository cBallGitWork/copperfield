import { describe, expect, it } from "vitest";
import { ownerTag } from "./owner";

const names = new Map([
  ["0g0j5mkomuqqwsbu", "domeitalycoach"],
  ["l5kunst8msgbirdf", "The Raccoons"],
  ["demo0100000000000", "Ctrl Alt Defeat"],
]);

describe("ownerTag", () => {
  it("prints another manager's team by the league's short name", () => {
    expect(ownerTag("0g0j5mkomuqqwsbu", "l5kunst8msgbirdf", names, "Mykolenko a doubt")).toBe("Dome");
  });

  it("says Yours for the reader's own team", () => {
    expect(ownerTag("l5kunst8msgbirdf", "l5kunst8msgbirdf", names, "Mykolenko a doubt")).toBe("Yours");
  });

  it("keeps Fantrax's name for a team with no short name", () => {
    expect(ownerTag("demo0100000000000", null, names, "Mykolenko a doubt")).toBe("Ctrl Alt Defeat");
  });

  it("prints nothing for an item with no team, or a team the league does not describe", () => {
    expect(ownerTag(null, "l5kunst8msgbirdf", names, "Mykolenko a doubt")).toBeNull();
    expect(ownerTag("unknown00000000", null, names, "Mykolenko a doubt")).toBeNull();
  });

  it("prints nothing when the headline already names the team", () => {
    expect(ownerTag("0g0j5mkomuqqwsbu", null, names, "Dome sign Marco Palestra (CHE)")).toBeNull();
    expect(ownerTag("0g0j5mkomuqqwsbu", null, names, "An offer from Dome")).toBeNull();  });

  it("matches the name as a word, not inside another", () => {
    expect(ownerTag("0g0j5mkomuqqwsbu", null, names, "Domenico a doubt")).toBe("Dome");
    expect(ownerTag("l5kunst8msgbirdf", "l5kunst8msgbirdf", names, "Your offer to Dome")).toBe("Yours");
  });
});
