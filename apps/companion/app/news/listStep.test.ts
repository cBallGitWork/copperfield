import { describe, expect, it } from "vitest";
import { listStep } from "./listStep";

describe("the letter's way back to the list", () => {
  it("steps back when the page behind is the list, so Back never reopens the letter", () => {
    expect(listStep("https://app.test/news", "/news", 3)).toBe("back");
  });

  it("puts the list in the letter's place when the page behind is anything else", () => {
    expect(listStep("https://app.test/squad/me", "/news", 3)).toBe("list");
    expect(listStep("https://app.test/news?item=deal%3A1", "/news", 3)).toBe("list");
  });

  it("puts the list in the letter's place for a letter opened cold", () => {
    expect(listStep(null, "/news", 5)).toBe("list");
  });

  it("falls back to the history's length where the browser cannot say what is behind", () => {
    expect(listStep(undefined, "/news", 2)).toBe("back");
    expect(listStep(undefined, "/news", 1)).toBe("list");
  });

  it("serves a player's news list the same way", () => {
    expect(listStep("https://app.test/players/04abc/news", "/players/04abc/news", 4)).toBe("back");
  });
});
