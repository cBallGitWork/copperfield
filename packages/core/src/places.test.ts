import { describe, expect, it } from "vitest";
import { sharedPlaces } from "./places";

const same = (a: number, b: number) => a === b;

describe("sharedPlaces", () => {
  it("shares a place on a tie and skips the next, as a table counts", () => {
    expect(sharedPlaces([12, 11, 11, 9, 9, 9, 8], same)).toEqual([1, 2, 2, 4, 4, 4, 7]);
  });

  it("is empty for an empty board", () => {
    expect(sharedPlaces([], same)).toEqual([]);
  });
});
