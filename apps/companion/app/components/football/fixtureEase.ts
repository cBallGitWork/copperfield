import { easeRanks, type PlannerView, type Venue } from "@epl/core";
import { intelStrength } from "../../strength";
import { backToFront } from "../../positions";
import { easeGround } from "./ease";

// A fixture on the planner's ease ramp for one man, in place of FPL's difficulty (Craig, 24 Oct 2026: "apply the
// coloured tiles repo wide"): the back line by the opponent's attack, everyone else by its defence.

const RANKS: Record<PlannerView, Record<Venue, Map<number, number>>> = {
  attack: { home: easeRanks(intelStrength, "attack", "home"), away: easeRanks(intelStrength, "attack", "away") },
  defence: { home: easeRanks(intelStrength, "defence", "home"), away: easeRanks(intelStrength, "defence", "away") },
};

/** Fantrax's back-line letters: a keeper or a defender faces the other side's attack. */
const BACK_LINE = new Set(["G", "D"]);

/** Which planner board a man's fixtures read off, by his deepest position. */
export function easeView(positions: readonly (string | null)[]): PlannerView {
  return BACK_LINE.has(backToFront(positions.filter((position) => position !== null))[0] ?? "") ? "defence" : "attack";
}

/** An opponent's ground and ink for a man on `view`, ranked at the venue the opponent plays at. */
export function fixtureEase(view: PlannerView, opponentCode: number | null, home: boolean): { ground: string; ink: string } {
  return easeGround(opponentCode === null ? null : (RANKS[view][home ? "away" : "home"].get(opponentCode) ?? null));
}
