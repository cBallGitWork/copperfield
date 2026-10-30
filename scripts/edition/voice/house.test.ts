import { describe, expect, it } from "vitest";
import { house, sendBack } from "./house";

// Pins the house prompt, so a change to a shared list shows up as a reviewed snapshot diff.

describe("house", () => {
  it("prints the house prompt as reviewed", () => {
    expect(house("bin-xi")).toMatchSnapshot();
  });

  it("never shows the writer the em dash it is sent back for", () => {
    expect(house("bin-xi") + sendBack(["x"])).not.toContain("\u2014");
  });
});
