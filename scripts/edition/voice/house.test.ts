import { describe, expect, it } from "vitest";
import { house } from "./house";

// Pins the house prompt, so a change to a shared list shows up as a reviewed snapshot diff.

describe("house", () => {
  it("prints the house prompt as reviewed", () => {
    expect(house("bin-xi")).toMatchSnapshot();
  });
});
