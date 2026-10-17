import { describe, expect, it } from "vitest";
import { markWords, resultLabel } from "./marks";

describe("markWords", () => {
  it("names the best on the pitch only when his mark is high too", () => {
    expect(markWords(8, true)).toBe("the best player on the pitch");
    expect(markWords(6, true)).toBeNull();
  });

  it("speaks at either end of the spread and stays quiet in the middle", () => {
    expect(markWords(7.1, false)).toBe("one of the best on the pitch");
    expect(markWords(3, false)).toBe("one of the poorest on the pitch");
    expect(markWords(5, false)).toBeNull();
    expect(markWords(null, true)).toBeNull();
  });
});

describe("resultLabel", () => {
  it("prints the score once both are in", () => {
    expect(resultLabel("Brighton", "Wolves", 3, 1)).toBe("Brighton 3-1 Wolves");
    expect(resultLabel("Brighton", "Wolves", null, null)).toBe("Brighton v Wolves");
  });
});
