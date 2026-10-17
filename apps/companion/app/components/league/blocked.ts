import type { Eligibility, RosterLimits, RosterSlot } from "@epl/core";
import { activeAt, applyMove, isActive } from "@epl/core";
import { leaguePositionLabel } from "../../positions";

// Why a dimmed card on the planner cannot change places with the picked man, as the line a tap on it shows.

const countAt = (slots: readonly RosterSlot[], position: string) => activeAt(slots, position).length;

/** The rule a swap of `picked` and `tapped` would break, in a line; null for two subs, who always swap places. */
export function whyBlocked(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
  picked: string,
  tapped: string,
  nameOf: (id: string) => string,
): string | null {
  const a = slots.find((slot) => slot.fantraxId === picked);
  const b = slots.find((slot) => slot.fantraxId === tapped);
  if (a === undefined || b === undefined) return null;
  if (isActive(a) && isActive(b)) return `${nameOf(picked)} can only swap with a sub.`;
  if (!isActive(a) && !isActive(b)) return null;
  const [going, coming] = isActive(a) ? [a, b] : [b, a];
  const places = eligibility.get(coming.fantraxId) ?? [];
  if (places.length === 0) return `${nameOf(coming.fantraxId)} has no position to play.`;

  // Played out at each place he could take: the floor the man going off leaves first, then the cap he would pass.
  const after = places.map((to) => ({ to, slots: applyMove(slots, { kind: "swap", fantraxId: coming.fantraxId, withId: going.fantraxId, to }) }));
  const left = going.position;
  const min = left === null ? undefined : limits.minActiveByPosition[left];
  if (left !== null && min !== undefined && after.every((each) => countAt(each.slots, left) < min)) {
    return `The XI needs at least ${min} ${leaguePositionLabel(left)}.`;
  }
  const full = after.find((each) => countAt(each.slots, each.to) > (limits.maxActiveByPosition[each.to] ?? 0));
  return full === undefined
    ? "That swap breaks the league's rules."
    : `The XI allows at most ${limits.maxActiveByPosition[full.to] ?? 0} ${leaguePositionLabel(full.to)}.`;
}
