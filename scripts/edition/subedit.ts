import { NEWS_GAPS, RELATIVE_DAYS, banned, styleFaults, teamSheetGaps, unbackedFit, type Fault, type TeamSheetExpect } from "@epl/core";
import { surfaces } from "./checks";
import type { Say } from "./newsroom";
import { sendBackOnce } from "./sendBack";
import { sendBack } from "./voice/house";

// The sub-editor's pass: the column read back against the register and sent back ONCE if it reached for a banned
// phrase, an American word or an em dash; a second offence files anyway, and says so. It reads the raw column, before `file()`, so checking never
// stamps two `filedAt` instants on one story.

/** The written surfaces of a column, the headline IN it (unlike `checks.prose()`): it is where a banned word did its
 *  damage, five times on one front page. Never a manager's quote, which is his and is carried. */
export const written = (column: Record<string, unknown>): string => surfaces(column, { withHeadline: true, withQuotes: false });

type PresserFaults = { phrases: string[]; fit: string[]; days: string[]; lines: string[]; quotes: string[]; notes: string[] };

/** What the Team Sheet printed about absent managers or absent news, the FIT men whose note is a bare complaint, and
 *  what it left out that its brief gave it (`teamSheetGaps`). */
export function presserFaults(column: Record<string, unknown>, expected: TeamSheetExpect = NOTHING_OWED): PresserFaults {
  return { phrases: banned(written(column), NEWS_GAPS), fit: unbackedFit(column.teamNews), days: banned(written(column), RELATIVE_DAYS), ...teamSheetGaps(column.teamNews, expected) };
}

const NOTHING_OWED: TeamSheetExpect = { reported: [], quoted: [], noted: [] };

/** One part of a send-back: its words around the names, or nothing when there are none. */
const ask = (names: readonly string[], words: (list: string) => string) => (names.length === 0 ? [] : [words(names.join(", "))]);

/** The Team Sheet's send-back in the writer's terms, or "" when there is nothing to send back. */
export function sendBackPresser(faults: PresserFaults): string {
  return [
    ...ask(faults.phrases.map((phrase) => `"${phrase}"`), (list) => `YOUR LAST ATTEMPT WROTE ABOUT WHO DID NOT SPEAK OR WHAT WAS NOT SAID: ${list}. A reader wants who is out and who is back. Say that plainly, and never forecast who starts.`),
    ...ask(faults.fit, (list) => `THESE FIT MEN CARRY A BARE COMPLAINT AS THEIR NOTE, which reads as if they still have it: ${list}. Write "back from a muscle injury", and what was said of him where you were given it.`),
    ...ask(faults.days.map((day) => `"${day}"`), (list) => `THESE WORDS DATE THE COLUMN TO THE DAY IT WAS FILED, and it is read on the days after: ${list}. NAME THE DAY instead, as the brief gives them. A manager's quote keeps his own words.`),
    ...ask(faults.lines, (list) => `THESE CLUBS HAD NEWS AND NO LINE: ${list}. Give each one sentence of what its manager said: what was decided, the timescale, the reason.`),
    ...ask(faults.quotes, (list) => `THESE CLUBS WERE GIVEN A QUOTE WITH A FACT AND PRINTED NONE: ${list}. Print one each, verbatim, trimmed to the sentence that carries the fact.`),
    ...ask(faults.notes, (list) => `THESE MEN HAVE AN EMPTY NOTE: ${list}. The brief gave each a complaint or his manager's words; put it in a few words.`),
  ].join("\n\n");
}

export async function writeSubedited(
  system: string,
  brief: string,
  /** How the desk reports sending one back. Injected so this file does no I/O
   *  of its own and the orchestrator keeps one voice for its log. */
  say: Say,
  kind: string,
  /** What the Team Sheet's brief gave it, so a column that drops it is sent back. */
  expected?: TeamSheetExpect,
): Promise<Record<string, unknown>> {
  const read = (raw: Record<string, unknown>) => ({ raw, faults: review(raw, kind, expected) });
  const attempts = await sendBackOnce({ desk: kind, voice: system, brief, read, sendBack: subeditSendBack, summary: named }, say);
  const filed = attempts.at(-1)!;
  if (attempts.length > 1 && filed.faults.length > 0) say(`  ⚠ ${kind} rewrite still prints ${named(filed.faults)}, filing it anyway.`);
  return filed.raw;
}

/** A banned or style phrase's check; every other sub-edit fault's check is a `PresserFaults` key. */
const BANNED_CHECK = "banned";
const PRESSER_KEYS = ["phrases", "fit", "days", "lines", "quotes", "notes"] as const satisfies readonly (keyof PresserFaults)[];

/** The column's banned and style phrases, then its Team Sheet faults, each a fault whose evidence is the phrase or the name. */
function review(column: Record<string, unknown>, kind: string, expected?: TeamSheetExpect): Fault[] {
  const text = written(column);
  const presser = kind === "presser" ? presserFaults(column, expected) : presserFaults({});
  const fault = (check: string) => (evidence: string): Fault => ({ section: "column", check, severity: "send-back", evidence });
  return [...[...banned(text), ...styleFaults(text)].map(fault(BANNED_CHECK)), ...PRESSER_KEYS.flatMap((key) => presser[key].map(fault(key)))];
}

/** The send-back the writer reads: the banned phrases quoted, then the Team Sheet's faults in its own terms. */
function subeditSendBack(faults: readonly Fault[]): string {
  const of = (check: string) => faults.filter((fault) => fault.check === check).map((fault) => fault.evidence);
  const offended = of(BANNED_CHECK);
  const presser = Object.fromEntries(PRESSER_KEYS.map((key) => [key, of(key)])) as PresserFaults;
  return [offended.length === 0 ? "" : sendBack(offended), sendBackPresser(presser)].filter((part) => part !== "").join("\n\n");
}

/** How the log names a man or a club, with what is wrong with him; a phrase is named as printed. */
const LOGGED: Partial<Record<string, (evidence: string) => string>> = {
  fit: (name) => `${name} FIT with a complaint`,
  lines: (club) => `${club} with no line`,
  quotes: (club) => `${club} with no quote`,
  notes: (name) => `${name} with no note`,
};

/** The log's list: phrases, days, fit men, then the gaps. */
function named(faults: readonly Fault[]): string {
  const order = [BANNED_CHECK, "phrases", "days", "fit", "lines", "quotes", "notes"];
  return order.flatMap((check) => faults.filter((fault) => fault.check === check).map((fault) => (LOGGED[check] ?? String)(fault.evidence))).join(", ");
}
