import { describe, expect, it, vi } from "vitest";
import { clubOptions } from "./BoardControls";

vi.mock("@/app/desk", () => ({ SMALL_CAPS: "", heldPlate: () => "" }));
vi.mock("@/app/components/shell/Link", () => ({ default: () => null }));

// The board filters on Fantrax's codes; the menu prints the codes every other screen prints (review N30).
describe("clubOptions", () => {
  it("labels Brentford and Forest as every screen does, in that order, keeping Fantrax's value for the filter", () => {
    expect(clubOptions(["ARS", "BRF", "NEW", "NOT"])).toEqual([
      { value: "", label: "All clubs" },
      { value: "ARS", label: "ARS" },
      { value: "BRF", label: "BRE" },
      { value: "NEW", label: "NEW" },
      { value: "NOT", label: "NFO" },
    ]);
  });

  it("orders the menu by the code it prints", () => {
    expect(clubOptions(["NOT", "NEW", "BRF", "BOU"]).map((option) => option.label)).toEqual(["All clubs", "BOU", "BRE", "NEW", "NFO"]);
  });
});
