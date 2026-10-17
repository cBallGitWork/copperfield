import { pickAngle } from "../angle";
import type { MatchupContext } from "../brief";
import { matchupState } from "../state";
import { threadsOf } from "../threads";
import type { DraftSide } from "../types";
import { LIMITS } from "./limits";
import { worthOf } from "./worth";

/** Two sides' match-up at the end of gameweek 5, at the league's prices, with nothing around it but what `over` gives,
 *  and the angle the desk would choose unless `over` sets one. */
export function contextOf(home: DraftSide, away: DraftSide, over: Partial<Omit<MatchupContext, "state">> = {}): MatchupContext {
  const ctx: MatchupContext = { state: matchupState({ home, away }, LIMITS), places: { home: null, away: null }, form: [], oldBoys: [], next: { home: null, away: null }, angle: null, ...over };
  return over.angle !== undefined ? ctx : { ...ctx, angle: pickAngle(ctx, threadsOf(ctx, worthOf(), 5), []) };
}
