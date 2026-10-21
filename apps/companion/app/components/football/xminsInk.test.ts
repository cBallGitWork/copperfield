import { describe, expect, it } from "vitest";
import { START_DOUBT_MINUTES } from "../../config";
import { minutesInk } from "./xminsInk";

describe("minutesInk", () => {
  it("inks a man under the floor in the loss red", () => {
    expect(minutesInk(0)).toBe("text-bad");
    expect(minutesInk(START_DOUBT_MINUTES - 1)).toBe("text-bad");
  });

  it("inks the floor and above, and a dash, in the derived cyan", () => {
    expect(minutesInk(START_DOUBT_MINUTES)).toBe("text-info");
    expect(minutesInk(90)).toBe("text-info");
    expect(minutesInk(null)).toBe("text-info");
  });
});
