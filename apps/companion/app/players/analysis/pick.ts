import { isFantraxPlayerId, nameMatches, searchKey } from "@epl/core";
import type { LeaguePool, PoolRow } from "../pool";
import { unknownToPool } from "../[fantraxId]/unknown";

// Who a search box offers, out of the cached pool, never a profile read (Fantrax throttles those). A folded word
// match on the name (core's `nameMatches`), as the board's own search matches.

/** How many names a box offers: six fit above a phone's keyboard. */
const OFFERED = 6;

/** One name a box can offer: an id and something to print. */
export interface Candidate {
  fantraxId: string;
  name: string;
}

/** Each side's man and what its box holds, as the URL names them (`a`, `b`, `qa`, `qb`), and each side's season. */
export interface Sides {
  a: string | undefined;
  b: string | undefined;
  qa: string;
  qb: string;
  as?: string;
  bs?: string;
}

/** The sides as the screen reads them: a lone man is A, whichever box chose him, with the empty box's search and
 *  season moved to B's; and `?a=X&b=X` is the one-man screen unless the two sides name different seasons. */
export function sides({ a, b, qa, qb, as, bs }: Sides): Sides {
  if (a === undefined && b !== undefined) return { a: b, b: undefined, qa: qb, qb: qa, as: bs };
  return { a, b: b === a && (as ?? "") === (bs ?? "") ? undefined : b, qa, qb, as, bs };
}

/** The sides minus an id the player page would 404 (bad shape, or one the pool answered without), so one stale side
 *  leaves the picker and the other man on screen. */
export function knownSides(pool: LeaguePool, asked: Sides): Sides {
  const known = (id: string | undefined) => (id !== undefined && isFantraxPlayerId(id) && !unknownToPool(pool, id) ? id : undefined);
  return sides({ ...asked, a: known(asked.a), b: known(asked.b) });
}

/** The names matching what was typed, minus the man already on the other side; an empty box offers nothing. */
export function candidates(rows: readonly PoolRow[], typed: string, taken: string | undefined): Candidate[] {
  const needle = searchKey(typed);
  if (needle === "") return [];

  const found: Candidate[] = [];
  for (const row of rows) {
    const player = row.entry.player;
    if (player.fantraxId === taken) continue;
    if (!nameMatches(player.displayName, typed)) continue;
    found.push({ fantraxId: player.fantraxId, name: player.displayName });
    if (found.length === OFFERED) break;
  }
  return found;
}
