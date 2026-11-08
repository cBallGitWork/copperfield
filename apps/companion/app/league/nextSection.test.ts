import { describe, expect, it } from "vitest";
import { nextSection } from "./sections";

// CM's foot bar steps along the strip (cm9900/24.jpg): the table's next is Cups, the last has none.
describe("nextSection", () => {
  it("is the strip's next view", () => {
    expect(nextSection("table")).toEqual({ href: "/league/cups", label: "Cups" });
  });

  it("is none after the last view, or off the strip", () => {
    expect(nextSection("squads")).toBeNull();
    expect(nextSection("matchups")).toBeNull();
  });
});
