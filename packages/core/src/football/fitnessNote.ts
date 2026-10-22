import { MS_PER_DAY } from "../time";
import type { Fixture, FootballPlayer } from "./types";

/** How far behind the open gameweek a date may fall before it is read as next year's. */
const ROLLOVER_DAYS = 60;
import type { IntelPlayer } from "./intel/types";
import { availabilityOf, type Availability, type PlayerState } from "./playerState";

// The few words a row prints after an unfit man's mark: what is wrong, and when he is due back or how likely he plays.

/** The sister repo's week for a man out for the season, or due back after his club's last fixture: no week to print. */
export const SEASON_OUT_GW = 999;

export interface FitnessNote {
  /** "Knee", "Hamstring", "Back injury", "Suspended": the complaint in a word or two, never FPL's sentence. */
  word: string;
  /** "GW10": the squads export's week, else FPL's fixed return date as the gameweek it falls before; null when none. */
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

/** FPL's two fixed-format dates, "Expected back 1 Nov" and "Suspended until 31 Oct"; free prose is never read. */
const FIXED_DATE = /(?: - Expected back|^Suspended until) (\d{1,2}) ([A-Z][a-z]{2})\.?$/;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Each gameweek's first kickoff, London date "YYYY-MM-DD", for turning a return date into the week it opens. */
export type GameweekStarts = readonly (readonly [gameweek: number, date: string])[];

/** The calendar a note reads: the gameweek whose lineups are being picked, and when every gameweek starts. */
export interface NoteCalendar {
  open: number | null;
  starts: GameweekStarts;
}

/** Each gameweek's first kickoff date (its UTC day: no Premier League match starts near midnight), ascending. */
export function gameweekStarts(fixtures: readonly Pick<Fixture, "gameweek" | "kickoff">[]): [number, string][] {
  const first = new Map<number, string>();
  for (const { gameweek, kickoff } of fixtures) {
    if (gameweek === null || kickoff === null) continue;
    const day = kickoff.slice(0, 10);
    const held = first.get(gameweek);
    if (held === undefined || day < held) first.set(gameweek, day);
  }
  return [...first].sort((a, b) => a[0] - b[0]);
}

/** The first gameweek starting on or after FPL's "1 Nov": the year is the open gameweek's, or the next when that would
 *  put the date more than two months behind it. Null with no calendar. */
export function weekOfDate(day: number, month: string, calendar: NoteCalendar): number | null {
  const index = MONTHS.indexOf(month);
  const sorted = calendar.starts;
  if (index < 0 || sorted.length === 0) return null;
  const anchor = sorted.find(([gw]) => gw === calendar.open)?.[1] ?? sorted[0][1];
  const year = Number(anchor.slice(0, 4));
  const iso = (y: number) => `${y}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const behind = (date: string) => Date.parse(anchor) - Date.parse(date) > ROLLOVER_DAYS * MS_PER_DAY;
  const date = behind(iso(year)) ? iso(year + 1) : iso(year);
  return sorted.find(([, start]) => start >= date)?.[0] ?? null;
}

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

/** When he is due back, as a gameweek past the open one: the export's week, else FPL's fixed date as the week it opens.
 *  Never his chance (Craig, 22 Oct 2026: "don't put percentages in this row"). */
function backOf(availability: Availability, week: number | null, calendar: NoteCalendar): string | null {
  // A man who has left is not coming back, whatever week the export carries.
  if (availability.state === "unavailable") return null;
  const date = FIXED_DATE.exec(availability.news.trim());
  const due = week ?? (date === null ? null : weekOfDate(Number(date[1]), date[2], calendar));
  return due === null || (calendar.open !== null && due <= calendar.open) ? null : `GW${due}`;
}

/** An unfit man's note, null for a fit one and a man the bridge has not settled. */
export function fitnessNote(
  player: Pick<FootballPlayer, "code" | "status" | "news" | "chanceOfPlaying"> | null,
  squadIntel: ReadonlyMap<number, Pick<IntelPlayer, "expectedReturnGw">>,
  calendar: NoteCalendar,
): FitnessNote | null {
  const availability = availabilityOf(player);
  if (player === null || availability.state === "fit") return null;
  const back = backOf(availability, returnWeek(squadIntel.get(player.code)), calendar);
  return { word: wordOf(availability.news, availability.state), back };
}
