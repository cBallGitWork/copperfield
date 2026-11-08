import { describe, expect, it } from "vitest";
import { lockWords } from "./lockWords";

// 11:00Z in November is 11:00 in London.
const LOCK = "2026-11-07T11:00:00Z";

describe("lockWords", () => {
  it("gives the time alone on the lock's own London day", () => {
    expect(lockWords(LOCK, "2026-11-07T08:00:00Z")).toBe("locks 11:00");
  });

  it("names the weekday before then", () => {
    expect(lockWords(LOCK, "2026-11-05T20:00:00Z")).toBe("locks Sat 11:00");
  });

  it("is null with no lock ahead", () => {
    expect(lockWords(null, "2026-11-07T08:00:00Z")).toBeNull();
  });
});
