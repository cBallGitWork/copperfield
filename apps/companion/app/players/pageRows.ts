import { PAGE_ROWS, type PlayersQuery } from "./query";

/** The `?all=` value that draws every row; any other draws the rows `?rows=` asks for. */
export const ALL_ROWS = "1";

/** How many rows a query asks for: all, a whole number past the first page, or the first page. */
function asked(query: PlayersQuery): number {
  if (query.all === ALL_ROWS) return Infinity;
  const rows = Number(query.rows);
  return Number.isInteger(rows) && rows > PAGE_ROWS ? rows : PAGE_ROWS;
}

/** How many of `shown` rows a page draws: one count for the board and the sheet's Show N. */
export function drawnCount(shown: number, query: PlayersQuery): number {
  return Math.min(shown, asked(query));
}

/** The rows a page draws of those the query chose. */
export function pageRows<Row>(shown: Row[], query: PlayersQuery): Row[] {
  return shown.slice(0, drawnCount(shown.length, query));
}

/** The standout shares are tuned on a hundred men, so a shorter page is still judged against the first hundred. */
const LIT_ROWS = 100;

/** The rows a page's lit figures are cut over: the first hundred the query chose, or every row drawn past that. */
export function litRows<Row>(shown: Row[], drawn: Row[]): Row[] {
  return shown.slice(0, Math.max(drawn.length, LIT_ROWS));
}

/** The foot's next step: how many more it draws and the `?rows=` that draws them, or null once all are drawn. */
export function nextStep(shown: number, query: PlayersQuery): { more: number; rows: string } | null {
  const drawn = drawnCount(shown, query);
  const more = Math.min(PAGE_ROWS, shown - drawn);
  return more > 0 ? { more, rows: String(drawn + more) } : null;
}
