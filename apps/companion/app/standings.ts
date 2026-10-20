import {
  type ClaimPlace,
  FANTRAX_LEAGUE_ID,
  type StandingsRow,
  fetchStandingsPage,
  mapClaimOrder,
  mapStandings,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { refusedAs, tell } from "./refusals";
import type { Unavailable } from "./refusals";

// The standings page Fantrax draws for its own site, the table's whole source: the fxea array has no points column.
// It also carries the waiver claim order, as a column of the table.

interface StandingsPage {
  table: StandingsRow[];
  order: ClaimPlace[];
  refused: string | null;
}

/** The table and the claim order, and the refusal if there was one. The key changed with the shape, so no entry
 *  cached before the order was read can answer without it. */
const read = leagueCache("standings-and-order",
  (): Promise<StandingsPage> =>
    refusedAs(fetchStandingsPage(FANTRAX_LEAGUE_ID), (error) => refusal(tell(error)), (raw) => ({
      table: mapStandings(raw),
      order: mapClaimOrder(raw),
      refused: null,
    })),
  (error) => refusal(tell(error)),
);

function refusal(refused: string): StandingsPage {
  return { table: [], order: [], refused };
}

/** The table, or why not: empty and unreachable differ, and nothing here has a stale copy to fall back on. */
export async function leagueTable(): Promise<StandingsRow[] | Unavailable> {
  const { table, refused } = await read();
  return refused === null ? table : { unavailable: refused };
}

/** The waiver claim order, first claim first; empty when Fantrax did not answer. */
export async function claimOrder(): Promise<ClaimPlace[]> {
  return (await read()).order;
}
