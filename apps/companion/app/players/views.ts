import { firstScored, type ScoringCategory } from "@epl/core";
import { COLUMNS, DEFAULT_SORT, type PoolColumn } from "./columns";
import { POOL, STATS } from "./routes";
import { groupSort, type PoolGroupKey } from "./groups";

// The two boards over one pool (Craig, 16 Oct 2026: "the first page just being all the fantasy stats, then another
// section for literally all the other stats we have"): Players, what the league scores; Adv Stats, the rest.

export type BoardName = "pool" | "stats";

export interface BoardView {
  key: BoardName;
  route: string;
  /** What it is ordered by when the address bar names none of its columns. */
  sort: string;
  /** Every column it may draw, in the board's order: the spine and its share of the rest. */
  columns: readonly PoolColumn[];
}

/** Adv Stats' default order where its plate names none: expected goals, the resting plate's first column. */
export const STATS_SORT = "xg";

/** Whether a column is Players': the league's points, and a count the league scores; an unread league scores every one. */
export function onPlayers(column: PoolColumn, categories: Record<string, ScoringCategory>): boolean {
  if (column.fantasy) return true;
  if (column.scores === undefined) return false;
  return Object.keys(categories).length === 0 || firstScored(categories, [column.scores]) !== null;
}

/** One board, its columns split off the league's scoring categories as getLeagueInfo gives them. */
export function boardView(key: BoardName, categories: Record<string, ScoringCategory>): BoardView {
  const players = key === "pool";
  return {
    key,
    route: players ? POOL : STATS,
    sort: players ? DEFAULT_SORT : STATS_SORT,
    columns: COLUMNS.filter((column) => column.group === undefined || onPlayers(column, categories) === players),
  };
}

/** The board on one plate: ordered by the plate's own column when the address bar names none. */
export function onPlate(view: BoardView, group: PoolGroupKey): BoardView {
  return { ...view, sort: groupSort(group) ?? view.sort };
}
