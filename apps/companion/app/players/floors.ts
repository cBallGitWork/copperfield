import { MINUTES } from "@epl/core";
import { GAMES, isRated, type PoolColumn, type RawStats } from "./columns";

// The floors a rate must clear before it can top a sort (Craig, 21 Oct 2026): a man under one still lists, after
// everyone above it, his figure in the faint ink.

/** Three full matches' minutes behind a per-90: under that one cameo goal reads as a striker's season. */
export const PER90_MINUTES = 270;

/** Three games behind FP/G: two good weeks topped the board at 9.50 on 2 GP. */
export const PER_GAME_GAMES = 3;

/** Whether this man's figure in this column sits under its floor; a man whose minutes or games are unknown never does. */
export function underFloor(column: PoolColumn, stats: RawStats, rated: boolean): boolean {
  if (column.perGame) return below(stats?.[GAMES], PER_GAME_GAMES);
  if (isRated(column, rated)) return below(stats?.[column.minutes ?? MINUTES.short], PER90_MINUTES);
  return false;
}

function below(value: number | null | undefined, floor: number): boolean {
  return typeof value === "number" && value < floor;
}
