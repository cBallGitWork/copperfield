import { describe, expect, it } from "vitest";
import { holderOf } from "./holder";

const names = new Map([["l5kunst8msgbirdf", "The Raccoons"]]);

describe("holderOf", () => {
  // Craig, 6 Oct 2026: "manager names need short manager names".
  it("names a rival holder by the league's short name, and keeps the full one for the title", () => {
    expect(holderOf({ ownerTeamId: "l5kunst8msgbirdf", status: "T" }, names, null)).toEqual({
      text: "Raccoons",
      title: "The Raccoons",
      tone: "rival",
    });
  });

  it("falls back to Fantrax's name for a team with no short one, then to a dash, never its id", () => {
    expect(holderOf({ ownerTeamId: "demo", status: "T" }, new Map([["demo", "Ctrl Alt Defeat"]]), null)?.text).toBe("Ctrl Alt Defeat");
    expect(holderOf({ ownerTeamId: "demo", status: "T" }, new Map(), null)?.text).toBe("—");
  });

  it("says Yours for the reader's own man", () => {
    expect(holderOf({ ownerTeamId: "l5kunst8msgbirdf", status: "T" }, names, "l5kunst8msgbirdf")).toMatchObject({ text: "Yours", tone: "yours" });
  });

  it("prints a free man's status code, titled in words", () => {
    expect(holderOf({ ownerTeamId: null, status: "FA" }, names, null)).toEqual({ text: "FA", title: "Free agent", tone: "free" });
    expect(holderOf({ ownerTeamId: null, status: "WW" }, names, null)?.title).toBe("On waivers");
  });

  // "(WW)" on 100 of 100 rows of a board filtered to WW (review M37).
  it("drops a free man's code when the board is filtered to that one status", () => {
    expect(holderOf({ ownerTeamId: null, status: "WW" }, names, null, ["WW"])).toBeNull();
    expect(holderOf({ ownerTeamId: null, status: "FA" }, names, null, ["FA"])).toBeNull();
    expect(holderOf({ ownerTeamId: null, status: "WW" }, names, null, ["FA", "WW"])?.text).toBe("WW");
    expect(holderOf({ ownerTeamId: "l5kunst8msgbirdf", status: "T" }, names, null, ["T"])?.text).toBe("Raccoons");
  });

  it("prints nothing for a man with neither a holder nor a status", () => {
    expect(holderOf({ ownerTeamId: null, status: "" }, names, null)).toBeNull();
  });
});
