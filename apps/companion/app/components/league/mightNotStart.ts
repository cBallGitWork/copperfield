import type { Eligibility, RosterLimits, RosterSlot } from "@epl/core";
import { XMINS_MOVE, isActive, legalMoves } from "@epl/core";
import { START_DOUBT_MINUTES } from "../../config";

// The planner's "Might not start" line: starters short on xMins while a sub who could legally take a place is not.
// Each man's own figure: football has no depth chart, so the line never says who would replace him.

/** A bench man is clearly the likelier to play: at or over the floor, and more than the scout's move above the starter. */
const clearlyAbove = (sub: number, starter: number) => sub >= START_DOUBT_MINUTES && sub - starter > XMINS_MOVE;

/** The starters, in `order`, under `START_DOUBT_MINUTES` with a sub clearly above who could swap in for him. */
export function mightNotStart(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
  /** His xMins for the planned week, or null where there is no reading: an unknown is never a doubt. */
  minutesOf: (id: string) => number | null,
  order: readonly string[],
): string[] {
  const subs = slots.filter((slot) => !isActive(slot));
  const doubted = new Set(
    slots.filter(isActive).flatMap((starter) => {
      const his = minutesOf(starter.fantraxId);
      if (his === null || his >= START_DOUBT_MINUTES) return [];
      const covered = subs.some((sub) => {
        const theirs = minutesOf(sub.fantraxId);
        return (
          theirs !== null &&
          clearlyAbove(theirs, his) &&
          legalMoves(slots, eligibility, limits, sub.fantraxId).some(
            (move) => move.kind === "swap" && move.withId === starter.fantraxId,
          )
        );
      });
      return covered ? [starter.fantraxId] : [];
    }),
  );
  return order.filter((id) => doubted.has(id));
}
