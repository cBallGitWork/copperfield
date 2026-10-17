import type { LeaguePool } from "../pool";

/** Every bridged man's season of league points by FPL code; undefined while the pool is silent or holds a projection,
 *  which a column headed FPts must never carry. */
export function poolPoints(pool: LeaguePool): Map<number, number | null> | undefined {
  if ("unavailable" in pool || pool.season === null || pool.season.projected) return undefined;
  return new Map(pool.rows.flatMap((row) => (row.fplCode === null ? [] : [[row.fplCode, row.stats?.points ?? null]])));
}
