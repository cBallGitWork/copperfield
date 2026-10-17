import { describe, expect, it } from "vitest";
import { backStep } from "./backStep";

describe("the phone's back plate", () => {
  it("steps back to the app's own page behind it", () => {
    expect(backStep({ index: 1 }, 2)).toBe("back");
  });

  it("opens the section's list in place of a page opened cold, whatever the tab saw before the app", () => {
    expect(backStep({ index: 0 }, 5)).toBe("list");
  });

  it("falls back to the history's length where the browser cannot say whose page is behind", () => {
    expect(backStep(null, 2)).toBe("back");
    expect(backStep(null, 1)).toBe("list");
  });
});
