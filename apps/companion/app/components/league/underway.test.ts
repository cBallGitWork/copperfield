import { describe, expect, it } from "vitest";
import type { Opposition } from "@epl/core";
import { underway } from "./underway";

const at = (status: string) => [{ fixture: { status } } as unknown as Opposition];
const goals = [{ code: "G", name: "Goals", points: 8, value: "2" }];

// FPL's fixture status can lag or be refused for a whole match; Fantrax crediting him says the match is on.
describe("whether a man's match is under way", () => {
  it("is FPL's word once his fixture has kicked off", () => {
    expect(underway(at("live"), { breakdown: [], played: null })).toBe(true);
  });

  it("is Fantrax's word when it has credited him and FPL still says the match is to come", () => {
    expect(underway(at("upcoming"), { breakdown: goals, played: null })).toBe(true);
    expect(underway(at("upcoming"), { breakdown: [], played: 12 })).toBe(true);
  });

  it("is not under way with neither", () => {
    expect(underway(at("upcoming"), { breakdown: [], played: null })).toBe(false);
    expect(underway(at("upcoming"), { breakdown: [], played: 0 })).toBe(false);
    expect(underway(undefined, { breakdown: [], played: null })).toBe(false);
  });
});
