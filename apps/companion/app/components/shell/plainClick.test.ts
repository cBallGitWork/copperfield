import { describe, expect, it } from "vitest";
import { plainClick } from "./plainClick";

const CLICK = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

describe("a plain click", () => {
  it("is a primary click with no modifier", () => {
    expect(plainClick(CLICK)).toBe(true);
  });

  it("is not a middle click or a modified one, which open a tab or a window", () => {
    expect(plainClick({ ...CLICK, button: 1 })).toBe(false);
    expect(plainClick({ ...CLICK, metaKey: true })).toBe(false);
    expect(plainClick({ ...CLICK, shiftKey: true })).toBe(false);
  });
});
