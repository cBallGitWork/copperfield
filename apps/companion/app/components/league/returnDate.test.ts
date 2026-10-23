import { describe, expect, it } from "vitest";
import { returnDate } from "./returnDate";

describe("returnDate", () => {
  it("reads the day FPL expects him back, or the day a ban ends", () => {
    expect(returnDate("Leg injury - Expected back 28 Nov")).toBe("Back 28 Nov");
    expect(returnDate("Suspended until 25 Oct")).toBe("Back 25 Oct");
  });

  it("says nothing where FPL gives no day: the chip already says he is out or doubtful", () => {
    expect(returnDate("Thigh injury - Unknown return date")).toBeNull();
    expect(returnDate("Leg injury - 75% chance of playing")).toBeNull();
    expect(returnDate("Suspended")).toBeNull();
    expect(returnDate("")).toBeNull();
  });
});
