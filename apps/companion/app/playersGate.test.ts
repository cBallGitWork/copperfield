import { describe, expect, it } from "vitest";
import { gated, returnTo, signInFor } from "./playersGate";

describe("gated", () => {
  it("is the player section and everything under it", () => {
    expect(gated("/players")).toBe(true);
    expect(gated("/players/stats")).toBe(true);
    expect(gated("/players/05oeh/compare")).toBe(true);
  });

  it("is nothing else", () => {
    expect(gated("/")).toBe(false);
    expect(gated("/squad")).toBe(false);
    expect(gated("/prem/match/61/stats")).toBe(false);
    expect(gated("/playersfoo")).toBe(false);
  });
});

describe("signInFor", () => {
  it("sends a refused reader to Squad with the page they asked for", () => {
    expect(signInFor("/players/stats?group=attributes&per=90")).toBe(
      "/squad?next=%2Fplayers%2Fstats%3Fgroup%3Dattributes%26per%3D90",
    );
  });
});

describe("returnTo", () => {
  it("returns a page in the player section, query and all", () => {
    expect(returnTo("/players")).toBe("/players");
    expect(returnTo("/players/stats?group=attributes")).toBe("/players/stats?group=attributes");
  });

  it("refuses anywhere else, so the parameter sends nobody off-site", () => {
    expect(returnTo("https://evil.example/players")).toBeNull();
    expect(returnTo("//evil.example/players")).toBeNull();
    expect(returnTo("/players\\@evil.example")).toBeNull();
    expect(returnTo("/playersfoo")).toBeNull();
    expect(returnTo("/league")).toBeNull();
    expect(returnTo("")).toBeNull();
    expect(returnTo(null)).toBeNull();
  });
});
