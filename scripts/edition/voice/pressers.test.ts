import { describe, expect, it } from "vitest";
import { presserHeadline } from "./pressers";

describe("presserHeadline", () => {
  it("names the day, or both when Friday's carries Thursday's", () => {
    expect(presserHeadline(["2026-10-29"])).toBe("Thursday Pressers");
    expect(presserHeadline(["2026-10-29", "2026-10-30"])).toBe("Thursday and Friday Pressers");
  });

  it("falls back to Team News on no readable day", () => {
    expect(presserHeadline([])).toBe("Team News");
    expect(presserHeadline(["nope"])).toBe("Team News");
  });
});
