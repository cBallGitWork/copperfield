import { describe, expect, it } from "vitest";
import robots, { BOARD_PATH, META_CRAWLER } from "./robots";

describe("robots.txt", () => {
  // 2 Nov 2026: Meta's crawler made 74k requests in a day to /players and /players/stats.
  it("keeps Meta's crawler off the player board and lets everyone else in", () => {
    const rules = [robots().rules].flat();
    expect(rules).toContainEqual({ userAgent: META_CRAWLER, disallow: BOARD_PATH });
    expect(rules).toContainEqual({ userAgent: "*", allow: "/" });
  });
});
