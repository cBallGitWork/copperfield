import { describe, expect, it } from "vitest";
import type { IntelPastMaps } from "./pastMaps";
import { pastMapsOf } from "./pastMaps";

const GRID = { cols: 24, rows: 16 };

function file(over: Partial<IntelPastMaps> = {}): IntelPastMaps {
  return {
    manifest: { season: "23-24", grid: GRID },
    touches: { "7": { matches: 3, cells: [0, 2, 383, 5] } },
    shots: { "7": [[88.5, 50, 0.31, "goal"], [80, 40, null, "miss"]] },
    ...over,
  };
}

describe("pastMapsOf", () => {
  it("reads his touch counts by cell and his shots", () => {
    const maps = pastMapsOf(file(), 7, GRID);
    expect([...maps.counts]).toEqual([[0, 2], [383, 5]]);
    expect(maps.shots).toEqual([
      { x: 88.5, y: 50, xg: 0.31, outcome: "goal" },
      { x: 80, y: 40, xg: null, outcome: "miss" },
    ]);
  });

  it("has nothing for a man the file does not hold, or no file", () => {
    expect(pastMapsOf(file(), 8, GRID)).toEqual({ counts: new Map(), shots: [] });
    expect(pastMapsOf(null, 7, GRID)).toEqual({ counts: new Map(), shots: [] });
  });

  it("draws no touches from a file binned on another grid", () => {
    const maps = pastMapsOf(file({ manifest: { season: "23-24", grid: { cols: 12, rows: 8 } } }), 7, GRID);
    expect(maps.counts.size).toBe(0);
    expect(maps.shots).toHaveLength(2);
  });

  it("drops a row that lost a number, and a pair off the grid or not a count", () => {
    expect(pastMapsOf(file({ touches: { "7": { matches: 1, cells: [0, 2, 5] } } }), 7, GRID).counts.size).toBe(0);
    const maps = pastMapsOf(file({ touches: { "7": { matches: 1, cells: [384, 1, -1, 1, 4, 0, 5, 1.5, 6, 2] } } }), 7, GRID);
    expect([...maps.counts]).toEqual([[6, 2]]);
  });

  it("drops a shot off the pitch, of an unknown outcome or the wrong shape, and an xG past 1", () => {
    const shots = [[101, 50, 0.1, "goal"], [50, 50, 0.1, "own-goal"], [50, 50, "goal"], "x", [90, 50, 1.4, "save"]];
    expect(pastMapsOf(file({ shots: { "7": shots } }), 7, GRID).shots).toEqual([
      { x: 90, y: 50, xg: null, outcome: "save" },
    ]);
  });
});
