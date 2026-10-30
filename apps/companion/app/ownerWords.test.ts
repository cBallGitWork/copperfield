import { describe, expect, it } from "vitest";
import { ownerWords } from "./ownerWords";

// Raccoons has a short name in data/leagues/short-names.json.
const RACCOONS = "l5kunst8msgbirdf";
const names = new Map([[RACCOONS, "The Raccoons"]]);

describe("ownerWords", () => {
  it("calls the reader's own man Yours, as a chip and written out", () => {
    expect(ownerWords(RACCOONS, "T", RACCOONS, names)).toEqual({ kind: "yours", chip: "Yours", label: "Yours" });
  });

  it("names a rival's man by the short name on a chip and the full one written out", () => {
    expect(ownerWords(RACCOONS, "T", null, names)).toEqual({ kind: "rival", chip: "Raccoons", label: "The Raccoons" });
  });

  it("gives a free agent Fantrax's code on a chip and Free agent written out", () => {
    expect(ownerWords(null, "FA", RACCOONS, names)).toEqual({ kind: "free", chip: "FA", label: "Free agent" });
  });

  it("gives a man on waivers WW on a chip and On waivers written out", () => {
    expect(ownerWords(null, "WW", null, names)).toEqual({ kind: "free", chip: "WW", label: "On waivers" });
  });

  it("prints a dash, never the team's id, when its name failed to load", () => {
    expect(ownerWords("t9", "T", null, names)).toEqual({ kind: "rival", chip: "—", label: "—" });
  });

  it("says nothing of a man with neither a holder nor a status", () => {
    expect(ownerWords(null, "", null, names)).toBeNull();
  });
});
