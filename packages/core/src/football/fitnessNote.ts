import type { FootballPlayer } from "./types";
import type { IntelPlayer } from "./intel/types";
import { availabilityOf, type Availability, type PlayerState } from "./playerState";

// The few words a row prints after an unfit man's mark: what is wrong, and when he is due back or how likely he plays.

/** The sister repo's week for a man out for the season, or due back after his club's last fixture: no week to print. */
export const SEASON_OUT_GW = 999;

export interface FitnessNote {
  /** "Knee", "Hamstring", "Back injury", "Suspended": the complaint in a word or two, never FPL's sentence. */
  word: string;
  /** "GW10" from the squads export, a doubt's "75%", or FPL's fixed "back 1 Nov"; null when none is known. */
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

/** A complaint that reads as a return once "injury" goes: "Back · 75%" would say he is back. */
const RETURN_WORDS = new Set(["back"]);

/** How far off a doubt's week must be to outrank his chance: next week's return says less than "75%". */
const WEEK_OVER_CHANCE = 2;

/** FPL's two fixed-format dates, "Expected back 1 Nov" and "Suspended until 31 Oct"; free prose is never read. */
const FIXED_DATE = /(?: - Expected back|^Suspended until) (\d{1,2} [A-Z][a-z]{2})\.?$/;

/** The squads export's return week when it is a real gameweek; null for none, a nought or the season-out mark. */
export function returnWeek(intel: Pick<IntelPlayer, "expectedReturnGw"> | undefined): number | null {
  const week = intel?.expectedReturnGw ?? null;
  return week !== null && Number.isInteger(week) && week >= 1 && week < SEASON_OUT_GW ? week : null;
}

/** The complaint before FPL's " - ": "Knee injury" is "Knee", "Back injury" stays whole; a move or a ban its kind. */
function wordOf(news: string, state: Exclude<PlayerState, "fit">): string {
  if (state === "suspended") return STATE_WORD.suspended;
  const head = news.trim().split(" - ")[0].replace(/\.$/, "").trim();
  if (/^suspended\b/i.test(head)) return STATE_WORD.suspended;
  if (/^has (joined|departed|returned|left)\b/i.test(head)) return /\bon loan\b/i.test(head) ? "On loan" : "Left";
  const stripped = head.replace(/\s+injury$/i, "");
  const complaint = /^unspecified injury$/i.test(head) ? "Injury" : RETURN_WORDS.has(stripped.toLowerCase()) ? head : stripped;
  if (complaint === "" || complaint.split(/\s+/).length > MAX_WORDS) return STATE_WORD[state];
  return complaint.charAt(0).toUpperCase() + complaint.slice(1);
}

/** When he is due back: a week past the open gameweek (a doubt's chance first unless it is far off), FPL's fixed date. */
function backOf(availability: Availability, week: number | null, open: number | null): string | null {
  // A man who has left is not coming back, whatever week the export carries.
  const ahead = availability.state === "unavailable" || week === null || (open !== null && week <= open) ? null : week;
  const { chance } = availability;
  const odds = availability.state === "doubt" && chance !== null && chance > 0 ? `${chance}%` : null;
  const far = ahead !== null && open !== null && ahead - open >= WEEK_OVER_CHANCE;
  if (ahead !== null && (odds === null || far)) return `GW${ahead}`;
  if (odds !== null) return odds;
  const date = FIXED_DATE.exec(availability.news.trim());
  return date === null ? null : `back ${date[1]}`;
}

/** An unfit man's note, null for a fit one and a man the bridge has not settled. `open` is the gameweek whose lineups
 *  are being picked, null when unknown. */
export function fitnessNote(
  player: Pick<FootballPlayer, "code" | "status" | "news" | "chanceOfPlaying"> | null,
  squadIntel: ReadonlyMap<number, Pick<IntelPlayer, "expectedReturnGw">>,
  open: number | null,
): FitnessNote | null {
  const availability = availabilityOf(player);
  if (player === null || availability.state === "fit") return null;
  const back = backOf(availability, returnWeek(squadIntel.get(player.code)), open);
  return { word: wordOf(availability.news, availability.state), back };
}
