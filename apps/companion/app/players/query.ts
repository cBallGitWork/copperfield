import { nameMatches } from "@epl/core";
import type { PoolRow } from "./pool";
import { POOL, lastValue } from "./routes";
import { figureOf } from "./figure";
import { byFigure } from "../components/league/order";
import { atRoute, changed, chosen, statusOn, statusesShown } from "./boardChange";
import type { PoolColumn } from "./columns";
import type { BoardView } from "./views";

// What the URL says a Data board shows. State lives in the address bar, so the board stays a server component, the
// pool never crosses to the phone as data, and a link shares exactly what is on screen.

/** What Next hands a page for `?a=b`, verbatim: a repeated parameter arrives as an array. */
export interface PlayersSearchParams {
  compare?: string | string[];
  /** Which plate of columns the board is on. */
  group?: string | string[];
  q?: string | string[];
  pos?: string | string[];
  status?: string | string[];
  /** Whether the figures are per 90 minutes. */
  per?: string | string[];
  club?: string | string[];
  /** Whether the filter drawer is open: URL state, so the board needs no script for it. */
  panel?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
  all?: string | string[];
}

/** The same query, narrowed. */
export interface PlayersQuery {
  /** The first man of a comparison, while the board is the picker for the second. */
  compare?: string;
  q?: string;
  pos?: string;
  status?: string;
  sort?: string;
  dir?: string;
  all?: string;
  group?: string;
  per?: string;
  club?: string;
  panel?: string;
}

/** The last value wins, as a browser does with a repeated field. */
export function playersQuery(raw: PlayersSearchParams): PlayersQuery {
  return {
    compare: lastValue(raw.compare),
    q: lastValue(raw.q),
    pos: lastValue(raw.pos),
    status: lastValue(raw.status),
    sort: lastValue(raw.sort),
    dir: lastValue(raw.dir),
    all: lastValue(raw.all),
    group: lastValue(raw.group),
    per: lastValue(raw.per),
    club: lastValue(raw.club),
    panel: lastValue(raw.panel),
  };
}

/** Whether the counts are drawn per ninety minutes: `?per=90`, and anything else is off. */
export function isPer90(query: PlayersQuery): boolean {
  return query.per === "90";
}

/** Rows a page carries before it offers the rest: the whole pool is megabytes on a phone. */
export const PAGE_ROWS = 100;

/** Which of a board's columns it is ordered by and which way, resolved once for the order, the arrow and the reverse
 *  link; a sort the board does not draw falls to its own default. */
export function activeSort(query: PlayersQuery, view: BoardView): { column: PoolColumn; descending: boolean } {
  const of = (key: string | undefined) => view.columns.find((column) => column.key === key);
  const column = of(query.sort) ?? of(view.sort) ?? view.columns[0];
  const dir = query.dir === "asc" || query.dir === "desc" ? query.dir : column.ascending ? "asc" : "desc";
  return { column, descending: dir === "desc" };
}

/** The statuses the board lists, null for every man: the free men unless the reader chose, or typed a name. */
export function statusesOf(query: PlayersQuery): string[] | null {
  return statusesShown(query.status, query.q);
}

/** Whether a status chip is pressed on the board the server drew. */
export function isShown(query: PlayersQuery, codes: readonly string[]): boolean {
  return statusOn(query.status, query.q, codes);
}

/** The rows the URL asks for, filtered then ordered by the figure on screen; a man with no figure sorts last either
 *  way. Filters are unions within themselves (defenders or midfielders) and an intersection between. A man the
 *  league holds no status for has left its pool, so he is not listed, unless no man has one (the read failed). */
export function shownRows(
  rows: readonly PoolRow[],
  query: PlayersQuery,
  raw: Map<string, Record<string, number | null>>,
  view: BoardView,
): PoolRow[] {
  const typed = query.q ?? "";
  const status = statusesOf(query);
  const positions = chosen(query.pos);
  const club = (query.club ?? "").trim();
  const rated = isPer90(query);
  const known = rows.some((row) => row.entry.status !== "");
  const filtered = rows.filter(
    (row) =>
      (!known || row.entry.status !== "") &&
      (club === "" || row.entry.player.clubCode === club) &&
      (status === null || status.includes(row.entry.status)) &&
      (positions.length === 0 ||
        positions.some((position) => row.entry.eligiblePositions.includes(position))) &&
      nameMatches(row.entry.player.displayName, typed),
  );

  const { column: read, descending } = activeSort(query, view);

  return filtered.sort((left, right) => {
    const a = figureOf(read, left, raw.get(left.entry.player.fantraxId), rated);
    const b = figureOf(read, right, raw.get(right.entry.player.fantraxId), rated);
    return byFigure(a, b, descending);
  });
}

/** A Data board again with part of the query changed; an undefined value drops the key, so a link can undo itself.
 *  The server's own links (the sort heads, Show all) come through here; a control is a `BoardLink`. */
export function boardHref(query: PlayersQuery, changes: Partial<PlayersQuery>, route: string = POOL): string {
  return atRoute(route, changed("", { set: { ...query, ...changes } }));
}


/** The link that sorts by a board's column, or reverses it if it is already the one. */
export function sortHref(query: PlayersQuery, key: string, view: BoardView): string {
  const current = activeSort(query, view);
  const ascending = view.columns.find((column) => column.key === key)?.ascending ?? true;
  const descending = current.column.key === key ? !current.descending : !ascending;
  return boardHref(query, { sort: key, dir: descending ? "desc" : "asc" }, view.route);
}

/** Whether a filter narrows the rows: a position, a status (the resting free men among them) or a club. A search box
 *  or a sort is not one. */
export function isFiltered(query: PlayersQuery): boolean {
  return chosen(query.pos).length > 0 || statusesOf(query) !== null || (query.club ?? "").trim() !== "";
}

/** Whether a position chip is on. */
export function isChosen(query: PlayersQuery, key: "pos", value: string): boolean {
  return chosen(query[key]).includes(value);
}

