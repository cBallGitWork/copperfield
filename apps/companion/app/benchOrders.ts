import { FANTRAX_LEAGUE_ID, fetchTeamRosterInfo, mapBenchOrder, mapLineupState } from "@epl/core";
import { BASE_REVALIDATE, PAGE_REVALIDATE } from "./config";
import { leagueCache } from "./leagueCache";
import { refusedAs } from "./refusals";

// The order Fantrax brings a team's bench on in, one read per team per period: the manager's numbers, else the
// deadline's points order. A refusal, an outage or another period's answer draws the bench in position order.

const read = (teamId: string, period: number): Promise<string[]> =>
  refusedAs(
    fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, teamId, period),
    () => [],
    (raw) => (mapLineupState(raw)?.period === period ? mapBenchOrder(raw).order : []),
  );

/** A locked period's order, held five minutes: its manager can still renumber after the lock (Raccoons, GW6). */
const lockedOrder = leagueCache("bench-order", read, () => [], BASE_REVALIDATE);

/** The cache key of the open period's order, which a lineup save marks stale. */
export const OPEN_ORDER_KEY = "bench-order-open";

/** The open period's, which its manager may still change. */
const openOrder = leagueCache(OPEN_ORDER_KEY, read, () => [], PAGE_REVALIDATE);

/** One team's bench for one period, fantraxIds first-on first. */
export function benchOrder(teamId: string, period: number, locked: boolean): Promise<string[]> {
  return locked ? lockedOrder(teamId, period) : openOrder(teamId, period);
}

/** The open period's order as the planner takes it, `scorerId → rank` from 1; empty when it could not be read. */
export async function benchRanks(teamId: string, period: number): Promise<Record<string, number>> {
  return Object.fromEntries((await openOrder(teamId, period)).map((id, i) => [id, i + 1]));
}
