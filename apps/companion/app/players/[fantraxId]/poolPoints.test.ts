import { describe, expect, it } from "vitest";
import type { LeaguePool, PoolRow } from "../pool";
import { poolPoints } from "./poolPoints";

const row = (fplCode: number | null, points: number | null) =>
  ({ entry: { player: { fantraxId: String(fplCode) } }, stats: { points }, fplCode }) as unknown as PoolRow;

const pool = (projected: boolean): LeaguePool => ({
  rows: [row(11, 37), row(12, null), row(null, 50)],
  positions: [],
  season: { code: "S", name: "2026-27 - YTD", projected },
  statsRefused: null,
  teamNames: new Map(),
});

describe("poolPoints", () => {
  it("reads each bridged man's season points by FPL code, a blank as a blank", () => {
    expect(poolPoints(pool(false))).toEqual(new Map([[11, 37], [12, null]]));
  });

  it("refuses a projection, which a column headed FPts must never carry", () => {
    expect(poolPoints(pool(true))).toBeUndefined();
  });

  it("says nothing from a silent pool", () => {
    expect(poolPoints({ unavailable: "x" })).toBeUndefined();
  });
});
