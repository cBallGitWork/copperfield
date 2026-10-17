import { boardHref, isFiltered, type PlayersQuery } from "./query";
import { EVERYONE } from "./boardChange";
import { POOL } from "./routes";

/** The link off a board the filters emptied: the search kept, the filters dropped and every status shown, or nothing
 *  to offer. */
export function wayOut(query: PlayersQuery, route: string = POOL): { label: string; href: string } | null {
  if (!isFiltered(query)) return null;
  const href = boardHref(query, { pos: undefined, status: EVERYONE, club: undefined, all: undefined }, route);
  return { label: query.q?.trim() ? "Search all players" : "Clear filters", href };
}
