import { describe, expect, it } from "vitest";
import { filedWhen } from "./filedWhen";

// Mon 19 Oct 2026, 12:00 in London.
const NOW = new Date("2026-10-19T11:00:00Z");

// 19 Oct 2026: "Filed Mon 22:47" on the front was Mon 5 Oct, and Sun 11 Oct's read as Sun 18 Oct's.
describe("when a story was filed", () => {
  it("is a weekday and a time within the six days a weekday names alone", () => {
    expect(filedWhen("2026-10-18T19:07:00Z", NOW)).toBe("Sun 20:07");
    expect(filedWhen("2026-10-13T21:47:00Z", NOW)).toBe("Tue 22:47");
    expect(filedWhen("2026-10-19T07:00:00Z", NOW)).toBe("Mon 08:00");
  });

  it("is a date from a week back, when the weekday would read as this week's", () => {
    expect(filedWhen("2026-10-12T21:47:00Z", NOW)).toBe("Mon 12 Oct");
    expect(filedWhen("2026-10-11T18:44:00Z", NOW)).toBe("Sun 11 Oct");
    expect(filedWhen("2026-10-05T21:47:00Z", NOW)).toBe("Mon 5 Oct");
  });
});
