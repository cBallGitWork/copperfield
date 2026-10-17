import type { PeriodPairing } from "@epl/core";
import { UNAVAILABLE } from "../../config";
import type { LeagueSquads } from "../../squads";

/** The desk before the draft. `scripts/smoke.ts` keys an undrafted league on its first five words. */
export const NOT_DRAFTED = "The league has not drafted yet.";

/** A drafted league whose gameweek has no pairings, as the real league's period 5 has none. */
export const NO_PAIRINGS = "No matchups this gameweek.";

/** Why the head-to-head section is empty, or null when it has pairings to post. */
export function headToHeadQuiet(
  squads: LeagueSquads,
  pairings: readonly PeriodPairing[],
): string | null {
  if ("undrafted" in squads) return NOT_DRAFTED;
  if ("unavailable" in squads) return `${UNAVAILABLE}.`;
  return pairings.length === 0 ? NO_PAIRINGS : null;
}
