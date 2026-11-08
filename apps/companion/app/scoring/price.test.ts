import { describe, expect, it } from "vitest";
import { priceInk } from "./price";

// The approved Scoring picture (8 Nov 2026): a cost red, a reward and a blank in ink.
describe("a price's ink", () => {
  it("is red for a cost, whatever its band", () => {
    expect(priceInk("-3")).toBe("text-bad");
    expect(priceInk("-1 per 2")).toBe("text-bad");
  });

  it("stays ink for a reward, a band and a slot paid nothing", () => {
    for (const band of ["+4", "1–59: +1", "—"]) expect(priceInk(band)).toBe("text-ink");
  });
});
