import { MINUTES } from "@epl/core";
import { GAMES, type PoolColumn, type RawStats } from "./columns";
import type { PoolRow } from "./pool";
import { per90 } from "./standout";

// What a column prints for one man under the board's setting: the cell, the sort and the standouts all read this.

/** What a column prints for one man; a column that is not a count comes back untouched whatever the toggle says. */
export function figureOf(
  column: PoolColumn,
  row: PoolRow,
  stats: RawStats,
  rated: boolean,
): number | string | null {
  if (unplayed(stats) && isReading(column)) return null;
  const value = column.value(row, stats);
  if (!rated || column.rate !== true || typeof value !== "number") return value;
  return per90(value, stats?.[column.minutes ?? MINUTES.short] ?? null);
}

/** No minutes this season, by the league's read: no reading at all, so every figure dashes (Craig, 21 Oct 2026). */
function unplayed(stats: RawStats): boolean {
  return stats?.[MINUTES.short] === 0 || stats?.[GAMES] === 0;
}

/** A figure of his season: everything but the name and his ratings, which are no reading of it. */
function isReading(column: PoolColumn): boolean {
  return column.group !== undefined && column.group !== "attributes";
}
