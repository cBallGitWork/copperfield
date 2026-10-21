import type { LeaguePool, PoolRow } from "../pool";
import { poolPoints } from "../[fantraxId]/poolPoints";

// Who his own Compare offers beside him: the nearest in league points among his position group.

/** The man in his group with the nearest season league points, ties to a free agent and then pool order; never
 *  himself, and undefined when he has no group or no points to measure from. */
export function defaultRival(
  rows: readonly PoolRow[],
  fantraxId: string,
  points: ReadonlyMap<number, number | null>,
  groupOf: (code: number) => string | null,
): string | undefined {
  const scored = (row: PoolRow) => (row.fplCode === null ? null : (points.get(row.fplCode) ?? null));
  const grouped = (row: PoolRow) => (row.fplCode === null ? null : groupOf(row.fplCode));
  const him = rows.find((row) => row.entry.player.fantraxId === fantraxId);
  const mine = him === undefined ? null : scored(him);
  const group = him === undefined ? null : grouped(him);
  if (mine === null || group === null) return undefined;

  let best: { row: PoolRow; gap: number } | undefined;
  for (const row of rows) {
    const theirs = scored(row);
    if (row === him || theirs === null || grouped(row) !== group) continue;
    const gap = Math.abs(theirs - mine);
    const free = row.entry.ownerTeamId === null;
    if (best === undefined || gap < best.gap || (gap === best.gap && free && best.row.entry.ownerTeamId !== null)) {
      best = { row, gap };
    }
  }
  return best?.row.entry.player.fantraxId;
}

/** The rival off the cached pool; undefined while it is silent or projected, which a points measure must not read. */
export function rivalIn(pool: LeaguePool, fantraxId: string, groupOf: (code: number) => string | null): string | undefined {
  const points = poolPoints(pool);
  return points === undefined || "unavailable" in pool ? undefined : defaultRival(pool.rows, fantraxId, points, groupOf);
}
