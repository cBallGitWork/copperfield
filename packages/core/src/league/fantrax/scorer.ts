import type { BlockPlayer } from "../types";
import type { RawScorer } from "./raw";

/** A scorer whose id the caller has checked, as a listed player: name "" when absent, the rest null. */
export function scorerPlayer(fantraxId: string, scorer: RawScorer): BlockPlayer {
  return {
    fantraxId,
    playerName: scorer.name ?? "",
    // Their spelling, untouched: "D", or "F,M" for a man eligible at two.
    position: scorer.posShortNames ?? null,
    club: scorer.teamShortName ?? null,
    clubName: scorer.teamName ?? null,
  };
}
