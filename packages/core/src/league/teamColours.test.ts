import { describe, expect, it } from "vitest";
import { teamPlate, coloursOf } from "./teamColours";

const TABLE = { styled: { primary: "#0b5cd5", secondary: "#FFFFFF" } };

describe("coloursOf", () => {
  it("gives a listed team its own colour", () => {
    expect(coloursOf(TABLE, "styled").primary).toBe("#0b5cd5");
  });

  it("falls back for a team nobody has styled", () => {
    expect(coloursOf(TABLE, "a-real-league-id-nobody-has-added")).toEqual(coloursOf(TABLE, "another-unlisted-id"));
    expect(coloursOf(TABLE, "a-real-league-id-nobody-has-added")).not.toEqual(coloursOf(TABLE, "styled"));
  });

  it("never returns nothing, whatever it is asked", () => {
    expect(coloursOf({}, "").primary).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

// A near-black team's bar vanishes on the desk's dark ground: it takes its second colour, and its index spine the
// league's own blue (Craig, 8 Nov 2026, the approved Squad picture).
describe("teamPlate", () => {
  it("is the primary with its ink for an ordinary team", () => {
    expect(teamPlate({ primary: "#c81e2b", secondary: "#FFFFFF" })).toEqual({ background: "#c81e2b", ink: "#ffffff", spine: "own" });
  });

  it("takes the second colour and the league's spine for a near-black team", () => {
    expect(teamPlate({ primary: "#111111", secondary: "#FFFFFF" })).toEqual({ background: "#FFFFFF", ink: "#0b0c10", spine: "league" });
  });

  it("keeps a near-black team on black when its second colour is near-black too", () => {
    expect(teamPlate({ primary: "#111111", secondary: "#1a1a1a" }).background).toBe("#111111");
  });
});
