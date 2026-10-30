import { describe, expect, it } from "vitest";
import { bareMinute } from "./fixtureEvents";

describe("bareMinute", () => {
  it("prints the feed's padded minute as football does, seconds and all dropped", () => {
    expect(bareMinute("07")).toBe("7");
    expect(bareMinute("07'00")).toBe("7");
    expect(bareMinute("00'00")).toBe("0");
    expect(bareMinute("45+4'00")).toBe("45+4");
    expect(bareMinute("90")).toBe("90");
  });
});
