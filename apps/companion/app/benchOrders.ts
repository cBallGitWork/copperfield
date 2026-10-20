import { FANTRAX_LEAGUE_ID, fetchTeamRosterInfo, mapBenchOrder, mapLineupState, mapRosterSlots } from "@epl/core";
import { BASE_REVALIDATE, PAGE_REVALIDATE } from "./config";
import { leagueCache } from "./leagueCache";
import { refusedAs } from "./refusals";

// The order Fantrax brings a team's bench on in, one read per team per period: the manager's numbers, else the
// deadline's points order. A refusal, an outage or another period's answer draws the bench in position order.

/** A team's roster page for one period, as the auto subs read it. */
export interface BenchRoster {
  /** Reserves by fantraxId, first to come on first. */
  order: string[];
  /** Every man's slot in the league's letters, by fantraxId. */
  slots: Record<string, string>;
}

const NONE: BenchRoster = { order: [], slots: {} };

const read = (teamId: string, period: number): Promise<BenchRoster> =>
  refusedAs(
    fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, teamId, period),
    () => NONE,
    (raw) => (mapLineupState(raw)?.period === period ? { order: mapBenchOrder(raw).order, slots: mapRosterSlots(raw) } : NONE),
  );

/** A locked period's order, held five minutes: its manager can still renumber after the lock (Raccoons, GW6). */
const lockedOrder = leagueCache("bench-roster", read, () => NONE, BASE_REVALIDATE);

/** The cache key of the open period's order, which a lineup save marks stale. */
export const OPEN_ORDER_KEY = "bench-roster-open";

/** The open period's, which its manager may still change. */
const openOrder = leagueCache(OPEN_ORDER_KEY, read, () => NONE, PAGE_REVALIDATE);

/** One team's bench for one period, fantraxIds first-on first. */
export async function benchOrder(teamId: string, period: number, locked: boolean): Promise<string[]> {
  return (await benchRoster(teamId, period, locked)).order;
}

/** One team's bench order and every man's slot for one period. */
export function benchRoster(teamId: string, period: number, locked: boolean): Promise<BenchRoster> {
  return locked ? lockedOrder(teamId, period) : openOrder(teamId, period);
}

/** The open period's order as the planner takes it, `scorerId → rank` from 1; empty when it could not be read. */
export async function benchRanks(teamId: string, period: number): Promise<Record<string, number>> {
  return Object.fromEntries((await openOrder(teamId, period)).order.map((id, i) => [id, i + 1]));
}
