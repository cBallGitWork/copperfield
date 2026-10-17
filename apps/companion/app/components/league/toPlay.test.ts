import { describe, expect, it } from "vitest";
import { toPlayWord } from "./toPlay";

describe("a side's men still to play", () => {
  it("counts the men left", () => {
    expect(toPlayWord(2, true)).toBe("2 to play");
    expect(toPlayWord(1, false)).toBe("1 to play");
  });

  it("says all played only while the round runs: on a Wednesday everybody has nobody left", () => {
    expect(toPlayWord(0, true)).toBe("all played");
    expect(toPlayWord(0, false)).toBeNull();
  });

  it("says nothing where Fantrax gave no count", () => {
    expect(toPlayWord(null, true)).toBeNull();
    expect(toPlayWord(undefined, true)).toBeNull();
  });
});
