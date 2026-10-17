import { describe, expect, it } from "vitest";
import { BIN_PREMISE, banned } from "@epl/core";
import { BIN_XI_VOICE } from "./binXi";
import { house } from "./house";

describe("the Bin XI's voice", () => {
  it("never states the column's premise, or the column copies it, and never mentions a bench", () => {
    const own = BIN_XI_VOICE.slice(house("bin-xi").length);
    expect(banned(BIN_XI_VOICE, BIN_PREMISE)).toEqual([]);
    expect(own).not.toMatch(/nobody|no one|bench/iu);
  });
});
