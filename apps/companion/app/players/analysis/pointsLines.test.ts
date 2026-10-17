import { describe, expect, it } from "vitest";
import { pointsLines } from "./pointsLines";
import type { PoolRow } from "../pool";

const row = (points: number | null, perGame: number | null) => ({ stats: { points, perGame } }) as unknown as PoolRow;

describe("pointsLines", () => {
  it("reads both men's FPts and FP/G off their pool rows, printed as the board prints them", () => {
    const lines = pointsLines({ row: row(45.5, 7.583), stats: { GP: 6 } }, { row: row(30, 6), stats: { GP: 5 } });
    expect(lines.map((line) => [line.label, line.shown.a, line.shown.b])).toEqual([
      ["FPts", "45.5", "30"],
      ["FP/G", "7.58", "6.00"],
    ]);
    expect([lines[0].a, lines[0].b]).toEqual([45.5, 30]);
  });

  it("prints a played man's noughts and dashes points per game for a man with no game", () => {
    const [fpts, fpg] = pointsLines({ row: row(0, 0), stats: { GP: 0 } }, { row: row(0, 0), stats: { GP: 2 } });
    expect([fpts.shown.a, fpts.shown.b]).toEqual(["0", "0"]);
    expect([fpg.shown.a, fpg.shown.b]).toEqual(["—", "0.00"]);
  });

  it("dashes a man the pool does not hold, and draws nothing when it holds neither", () => {
    const [fpts] = pointsLines({ row: row(12, 4), stats: { GP: 3 } }, { row: undefined, stats: undefined });
    expect([fpts.shown.a, fpts.shown.b, fpts.b]).toEqual(["12", "—", null]);
    expect(pointsLines({ row: undefined, stats: undefined }, null)).toEqual([]);
  });

  it("draws one man alone", () => {
    expect(pointsLines({ row: row(12, 4), stats: { GP: 3 } }, null).map((line) => line.shown.a)).toEqual(["12", "4.00"]);
  });
});
