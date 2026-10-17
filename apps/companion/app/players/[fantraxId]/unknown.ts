import type { LeaguePool } from "../pool";

/** Whether the pool answered and does not hold him: an id nobody goes by. A silent pool says nothing either way. */
export function unknownToPool(pool: LeaguePool, fantraxId: string): boolean {
  return !("unavailable" in pool) && !pool.rows.some((row) => row.entry.player.fantraxId === fantraxId);
}
