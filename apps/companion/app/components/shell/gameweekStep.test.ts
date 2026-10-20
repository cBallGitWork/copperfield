import { describe, expect, it } from "vitest";
import { beside, openGameweek } from "./gameweekStep";

const season = [
  { gameweek: 5, started: true, finished: true },
  { gameweek: 6, started: true, finished: false },
  { gameweek: 7, started: false, finished: false },
  { gameweek: 9, started: false, finished: false },
];

describe("openGameweek", () => {
  it("opens on the latest gameweek under way", () => {
    expect(openGameweek(season, null)).toBe(6);
  });

  it("opens on the next gameweek once the last one is done", () => {
    const friday = season.map((round) => (round.gameweek === 6 ? { ...round, finished: true } : round));
    expect(openGameweek(friday, null)).toBe(7);
  });

  it("stays on the last gameweek once the season is done", () => {
    expect(openGameweek(season.map((round) => ({ ...round, started: true, finished: true })), null)).toBe(9);
  });

  it("honours a gameweek the page has, played or to come", () => {
    expect(openGameweek(season, 5)).toBe(5);
    expect(openGameweek(season, 9)).toBe(9);
  });

  it("ignores a gameweek the page does not have", () => {
    expect(openGameweek(season, 8)).toBe(6);
  });

  it("opens on the first before a ball is kicked, and on nothing with no rounds", () => {
    expect(openGameweek(season.map((round) => ({ ...round, started: false, finished: false })), null)).toBe(5);
    expect(openGameweek([], 3)).toBeNull();
  });
});

describe("beside", () => {
  const weeks = season.map((round) => round.gameweek);

  it("steps over a break", () => {
    expect(beside(weeks, 7)).toEqual({ previous: 6, next: 9 });
  });

  it("stops at either end", () => {
    expect(beside(weeks, 5)).toEqual({ previous: null, next: 6 });
    expect(beside(weeks, 9)).toEqual({ previous: 7, next: null });
  });
});
