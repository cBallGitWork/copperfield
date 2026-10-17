import { PAGE_ROWS, type PlayersQuery } from "./query";

/** The `?all=` value that draws every row; any other draws the first page. */
export const ALL_ROWS = "1";

/** The rows a page draws of those the query chose. */
export function pageRows<Row>(shown: Row[], query: PlayersQuery): Row[] {
  return query.all === ALL_ROWS ? shown : shown.slice(0, PAGE_ROWS);
}
