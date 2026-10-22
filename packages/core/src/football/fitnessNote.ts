import type { FootballPlayer } from "./types";
import type { IntelPlayer } from "./intel/types";
import { availabilityOf, type PlayerState } from "./playerState";

// The few words a row prints after an unfit man's mark: what is wrong, and when he is due back or how likely he plays.

/** The sister repo's week for a man out for the season, or due back after his club's last fixture: no week to print. */
export const SEASON_OUT_GW = 999;

export interface FitnessNote {
  /** "Knee", "Hamstring", "Suspended", "Illness": the complaint in a word or two, never FPL's sentence. */
  word: string;
  /** "GW10" when the squads export has his week, else a doubt's "75%"; null when neither is known. */
  back: string | null;
}

/** His word when the news gives none worth printing. */
const STATE_WORD: Record<Exclude<PlayerState, "fit">, string> = {
  doubt: "Doubt",
  injured: "Injured",
  suspended: "Suspended",
  unavailable: "Unavailable",
};

/** The longest complaint printed as it stands: "Personal reasons" passes, "not included in squad" takes the state's word. */
const MAX_WORDS = 2;

/** The squads export's return week when it is a real gameweek; null for none, a nought or the season-out mark. */
export function returnWeek(intel: Pick<IntelPlayer, "expectedReturnGw"> | undefined): number | null {
  const week = intel?.expectedReturnGw ?? null;
  return week !== null && Number.isInteger(week) && week >= 1 && week < SEASON_OUT_GW ? week : null;
}

/** The complaint before FPL's " - ": "Knee injury" is "Knee", "Unspecified injury" is "Injury"; a move or a ban its kind. */
function wordOf(news: string, state: Exclude<PlayerState, "fit">): string {
  if (state === "suspended") return STATE_WORD.suspended;
  const head = news.trim().split(" - ")[0].replace(/\.$/, "").trim();
  if (/^suspended\b/i.test(head)) return STATE_WORD.suspended;
  if (/^has (joined|departed|returned|left)\b/i.test(head)) return /\bon loan\b/i.test(head) ? "On loan" : "Left";
  const complaint = /^unspecified injury$/i.test(head) ? "Injury" : head.replace(/\s+injury$/i, "");
  if (complaint === "" || complaint.split(/\s+/).length > MAX_WORDS) return STATE_WORD[state];
  return complaint.charAt(0).toUpperCase() + complaint.slice(1);
}

/** An unfit man's note, null for a fit one and a man the bridge has not settled. Reads the squads export's week only,
 *  never a date out of FPL's prose. */
export function fitnessNote(
  player: Pick<FootballPlayer, "code" | "status" | "news" | "chanceOfPlaying"> | null,
  squadIntel: ReadonlyMap<number, Pick<IntelPlayer, "expectedReturnGw">>,
): FitnessNote | null {
  const availability = availabilityOf(player);
  if (player === null || availability.state === "fit") return null;
  const week = returnWeek(squadIntel.get(player.code));
  const { chance } = availability;
  const back =
    week !== null ? `GW${week}` : availability.state === "doubt" && chance !== null && chance > 0 ? `${chance}%` : null;
  return { word: wordOf(availability.news, availability.state), back };
}

/** The note as a row prints it: "Back · 75%", "Knee · GW10", "Hamstring". */
export function fitnessNoteText(note: FitnessNote): string {
  return note.back === null ? note.word : `${note.word} · ${note.back}`;
}
