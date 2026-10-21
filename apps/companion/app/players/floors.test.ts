import { describe, expect, it } from "vitest";
import { columnFor, type PoolColumn } from "./columns";
import { PER90_MINUTES, PER_GAME_GAMES, underFloor } from "./floors";

const goals = columnFor("g") as PoolColumn;
const fpg = columnFor("fpg") as PoolColumn;
const minutes = columnFor("min") as PoolColumn;

describe("underFloor", () => {
  it("holds a per-90 figure under three matches' minutes, and only with Per 90 on", () => {
    expect(underFloor(goals, { Min: PER90_MINUTES - 1 }, true)).toBe(true);
    expect(underFloor(goals, { Min: PER90_MINUTES }, true)).toBe(false);
    expect(underFloor(goals, { Min: 100 }, false)).toBe(false);
  });

  it("never holds a column the toggle does not divide", () => {
    expect(underFloor(minutes, { Min: 10 }, true)).toBe(false);
  });

  it("holds FP/G under three games, toggle or not", () => {
    expect(underFloor(fpg, { GP: PER_GAME_GAMES - 1 }, false)).toBe(true);
    expect(underFloor(fpg, { GP: PER_GAME_GAMES }, true)).toBe(false);
  });

  it("holds nobody whose games or minutes are not known", () => {
    expect(underFloor(fpg, {}, false)).toBe(false);
    expect(underFloor(goals, undefined, true)).toBe(false);
  });
});
