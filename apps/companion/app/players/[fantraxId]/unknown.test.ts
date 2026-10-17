import { describe, expect, it } from "vitest";
import type { LeaguePool, PoolRow } from "../pool";
import { unknownToPool } from "./unknown";

const pool = (...ids: string[]): LeaguePool => ({
  rows: ids.map((fantraxId) => ({ entry: { player: { fantraxId } }, stats: null, fplCode: null }) as unknown as PoolRow),
  positions: [],
  season: null,
  statsRefused: null,
  teamNames: new Map(),
});

describe("unknownToPool", () => {
  it("is nobody when the pool answered without him: a 404, not a page", () => {
    expect(unknownToPool(pool("04fk1", "05ybq"), "zzzzz")).toBe(true);
  });

  it("keeps a man the pool holds, whose profile read alone missed", () => {
    expect(unknownToPool(pool("04fk1"), "04fk1")).toBe(false);
  });

  it("cannot say from a pool that did not answer", () => {
    expect(unknownToPool({ unavailable: "getPlayerStats → WARNING" }, "zzzzz")).toBe(false);
  });
});
