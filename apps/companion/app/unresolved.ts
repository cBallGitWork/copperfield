import type { Unresolved } from "@epl/core";

// Why a roster slot has no footballer behind it; two dialogs read it. Only `unmapped` is settled (the league lists
// players the Premier League never has); the other two are work to do.

const REASON: Record<Unresolved, string> = {
  unmapped: "No Premier League record.",
  unbridged: "No record yet.",
  absent: "No Premier League record.",
};

/** A sentence, for a dialog that has the room for one. */
export function unresolvedReason(unresolved: Unresolved): string {
  return REASON[unresolved];
}
