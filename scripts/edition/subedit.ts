import { NEWS_GAPS, RELATIVE_DAYS, banned, recordOrEmpty, styleFaults, teamSheetGaps, unbackedFit, type TeamSheetExpect } from "@epl/core";
import { writeColumn, type Say } from "./newsroom";
import { sendBack } from "./voice/house";

// The sub-editor's pass: the column read back against the register and sent back ONCE if it reached for a banned
// phrase, an American word or an em dash; a second offence files anyway, and says so. It reads the raw column, before `file()`, so checking never
// stamps two `filedAt` instants on one story.

/** The written surfaces of a column as one string, the headline IN it (unlike `checks.prose()`): it is where a
 *  banned word did its damage, five times on one front page. A team-news row's line and notes are the Team Sheet. */
export function written(column: Record<string, unknown>): string {
  return [...["headline", "deck", "body"].map((key) => column[key]), ...rowWords(column.teamNews)]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

/** Each team-news row's own words, its line and each man's note; never the quote, which is a manager's and is carried. */
function rowWords(rows: unknown): unknown[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const { line, men } = recordOrEmpty(row);
    return [line, ...(Array.isArray(men) ? men.map((man) => recordOrEmpty(man).note) : [])];
  });
}

type PresserFaults = { phrases: string[]; fit: string[]; days: string[]; lines: string[]; quotes: string[]; notes: string[] };

/** What the Team Sheet printed about absent managers or absent news, the FIT men whose note is a bare complaint, and
 *  what it left out that its brief gave it (`teamSheetGaps`). */
export function presserFaults(column: Record<string, unknown>, expected: TeamSheetExpect = NOTHING_OWED): PresserFaults {
  return { phrases: banned(written(column), NEWS_GAPS), fit: unbackedFit(column.teamNews), days: banned(written(column), RELATIVE_DAYS), ...teamSheetGaps(column.teamNews, expected) };
}

const NOTHING_OWED: TeamSheetExpect = { reported: [], quoted: [], noted: [] };
const faulted = (faults: PresserFaults) => Object.values(faults).some((each) => each.length > 0);

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
  const column = await writeColumn(system, brief);
  const first = review(column, kind, expected);
  if (first.offended.length === 0 && !faulted(first.faults)) return column;

  say(`  ↩ ${kind} printed ${first.named.join(", ")}, sending it back once.`);
  const notes = [first.offended.length === 0 ? "" : sendBack(first.offended), sendBackPresser(first.faults)].filter((part) => part !== "");
  const rewrite = await writeColumn(system, `${brief}\n\n${notes.join("\n\n")}`).catch((error: unknown) => {
    say(`  ⚠ ${kind} rewrite failed, filing the first column: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  });
  if (rewrite === null) return column;
  const left = review(rewrite, kind, expected).named;
  if (left.length > 0) say(`  ⚠ ${kind} rewrite still prints ${left.join(", ")}, filing it anyway.`);
  return rewrite;
}

/** The column's banned and style phrases, its Team Sheet faults, and every one of them named for the log. */
function review(column: Record<string, unknown>, kind: string, expected?: TeamSheetExpect) {
  const text = written(column);
  const offended = [...banned(text), ...styleFaults(text)];
  const faults = kind === "presser" ? presserFaults(column, expected) : presserFaults({});
  const gaps = [...faults.lines.map((club) => `${club} with no line`), ...faults.quotes.map((club) => `${club} with no quote`), ...faults.notes.map((name) => `${name} with no note`)];
  const named = [...offended, ...faults.phrases, ...faults.days, ...faults.fit.map((name) => `${name} FIT with a complaint`), ...gaps];
  return { offended, faults, named };
}
