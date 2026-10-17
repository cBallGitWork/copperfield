import { SIDES } from "../side";
import type { MatchupState } from "./state";
import type { DraftMan } from "./types";

// Where a man's part sits in the gameweek, for a story's twist to come at another moment than the story. Never printed:
// who led on a day is the fixture list's. Pure.

/** The beat a man belongs in: the substitutions for a reserve certain to come on, otherwise his best day by points;
 *  undefined when he has none, a man who did not play. */
export function beatOf(state: MatchupState, man: DraftMan): string | null | undefined {
  if (SIDES.some((w) => state[w].subs.some((s) => s.in === man && !s.provisional))) return null;
  return [...man.byDay].sort((a, b) => b.points - a.points)[0]?.day;
}
