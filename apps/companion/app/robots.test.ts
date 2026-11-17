import { describe, expect, it } from "vitest";
import robots from "./robots";
import { GATED } from "./playersGate";

describe("robots.txt", () => {
  it("keeps every crawler off the player section and lets them read the rest", () => {
    expect([robots().rules].flat()).toEqual([{ userAgent: "*", allow: "/", disallow: GATED }]);
  });
});
