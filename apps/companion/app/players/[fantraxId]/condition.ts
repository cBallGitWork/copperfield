import type { Availability, PlayerState } from "@epl/core";
import { noteBesideChance } from "@epl/core";

const WORD: Record<Exclude<PlayerState, "fit">, string> = {
  doubt: "Doubtful",
  injured: "Injured",
  suspended: "Suspended",
  unavailable: "Unavailable",
};

/** FPL's note on a man who may miss out, without his chance (the line's quarter blocks carry it); null for a fit man. */
export function fitnessNote(availability: Availability): string | null {
  if (availability.state === "fit") return null;
  return noteBesideChance(availability.news, availability.chance) || WORD[availability.state];
}
