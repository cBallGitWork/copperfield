import type { Fault } from "../predictions/checks";
import type { MatchDesk } from "./desk";
import { capital } from "../../format";
import { escapeRegExp } from "../../regExp";
import { recordOrEmpty, stringOrEmpty } from "../../untrusted";
import { pencil } from "../predictions/checks";
import { numbersIn, sentences, wordCount } from "../predictions/prose";
import { numeral } from "./minutes";
import { REPORT_PENCIL } from "./words";

// What the writer files for a match-day, read field by field; a match whose pieces fail twice keeps the sentences that
// broke no hard rule, else prints the desk's plain line.

interface ReportSection {
  head: string;
  pitch: string;
  stake: string;
}

export interface ReportPiece {
  standfirst: string;
  account: string;
  sections: ReportSection[];
}

export interface ReportsDraft {
  headline: string;
  /** The writer's headline candidates, before the desk strikes and the fan picks. */
  headlines: string[];
  /** The story the candidates pun on, in plain words: what the fan judges them against. */
  headlineStory?: string;
  /** Each candidate's two meanings, as the writer claimed them, for the fan to check. */
  meanings?: Record<string, string>;
  /** By fixture code. */
  matches: Map<number, ReportPiece>;
}

/** House corrections with one right answer. */
export function correct(prose: string): string {
  const fixed = REPORT_PENCIL.reduce((out, [wrong, right]) => out.replace(wrong, right), pencil(prose));
  // One to nine are words outside a score, a formation or a decimal: "for 5 points" is "for five points".
  return fixed.replace(/(?<![\d.,-])\b([1-9]) (points?|goals?|shots?|saves?|assists?|chances?|minutes?|matches|games|changes)\b/gu, (_, n: string, noun: string) => `${numeral(Number(n))} ${noun}`);
}

/** The most words a section's head may run to. */
export const HEAD_WORDS = 4;

/** A head that breaks the rules twice prints as the man it is about: his surname, named first in the section's football. */
export function plainHead(head: string, pitch: string, surnames: readonly string[], never: (text: string) => boolean): string {
  const clean = head !== "" && wordCount(head) <= HEAD_WORDS && !never(head) && surnames.some((name) => head.includes(name));
  if (clean) return head;
  const named = surnames
    .map((name) => ({ name, at: pitch.indexOf(name) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at || b.name.length - a.name.length)[0];
  return named?.name ?? head;
}

/** A surname's particle is lower case except where it opens a sentence: "holds Van Hecke" → "holds van Hecke". */
export function particles(prose: string, surnames: readonly string[]): string {
  return surnames
    .filter((name) => /^\p{Ll}/u.test(name))
    .reduce((out, name) => out.replace(new RegExp(`(?<![.!?]\\s)(?<=\\s)${escapeRegExp(capital(name))}`, "gu"), name), prose);
}

/** Headline candidates from either writer. A pun names the word it turns on and the two meanings that word carries; a
 *  candidate that cannot is not a pun and is dropped. */
export function readHeadlines(raw: Record<string, unknown>): { headlines: string[]; meanings: Record<string, string> } {
  const headlines: string[] = [];
  const meanings: Record<string, string> = {};
  for (const h of Array.isArray(raw.headlines) ? raw.headlines : []) {
    const r = recordOrEmpty(h);
    const line = correct(stringOrEmpty(r.text).trim());
    const on = stringOrEmpty(r.playsOn).trim();
    const two = stringOrEmpty(r.twoMeanings).trim();
    if (line === "" || on === "" || two === "" || !line.toLowerCase().includes(on.toLowerCase())) continue;
    headlines.push(line);
    meanings[line] = two;
  }
  return { headlines, meanings };
}

/** Each match's stakes in section order, by fixture code: the desk writes them and the writer never does. */
export const stakesOf = (desks: readonly MatchDesk[]): Map<number, string[]> => new Map(desks.map((d) => [d.match.fixture.code, d.sections.map((s) => s.stake)]));

/** The model's JSON as a draft; anything missing or misshapen is an empty string for the checks to find. A match the desk
 *  wrote `stakes` for keeps that many sections, each with the desk's stake. */
export function readReportsDraft(raw: Record<string, unknown>, surnames: readonly string[] = [], stakes: ReadonlyMap<number, readonly string[]> = new Map()): ReportsDraft {
  const text = (value: unknown) => particles(correct(stringOrEmpty(value).trim()), surnames);
  const matches = new Map<number, ReportPiece>();
  for (const entry of Array.isArray(raw.matches) ? raw.matches : []) {
    if (typeof entry !== "object" || entry === null) continue;
    const m = entry as Record<string, unknown>;
    const code = Number(m.fixture);
    if (!Number.isInteger(code)) continue;
    const desk = stakes.get(code);
    const written = (Array.isArray(m.sections) ? m.sections : []).flatMap((s): ReportSection[] => {
      if (typeof s !== "object" || s === null) return [];
      const r = s as Record<string, unknown>;
      return [{ head: text(r.head), pitch: text(r.pitch), stake: text(r.stake) }];
    });
    const sections = desk === undefined ? written : written.slice(0, desk.length).map((s, i) => ({ ...s, stake: desk[i] }));
    // An account may come as paragraphs; it is kept as one string, a paragraph to a line.
    const account = Array.isArray(m.account) ? m.account.map(text).filter((p) => p !== "").join("\n") : text(m.account);
    matches.set(code, { standfirst: text(m.standfirst), account, sections });
  }
  const { headlines: offered, meanings } = readHeadlines(raw);
  return { headline: offered[0] ?? "", headlines: offered, meanings, headlineStory: text(raw.headlineStory), matches };
}

/** The part of a fault's section that names its match: `2645244:account` → 2645244. */
export const matchOf = (section: string) => Number(section.split(":")[0]);

const blocking = (faults: readonly Fault[], code: number) =>
  faults.filter((f) => matchOf(f.section) === code && f.severity !== "warn").length;
const hardOn = (faults: readonly Fault[], code: number) => faults.filter((f) => matchOf(f.section) === code && f.severity === "hard");
const hard = (faults: readonly Fault[], code: number) => hardOn(faults, code).length > 0;

/** The piece less each sentence carrying a hard fault's evidence (a figure in digits or words, a name, a sentence), or
 *  undefined when the standfirst carries one or the account or every section goes: a match told without them is not told. */
function salvaged(piece: ReportPiece, faults: readonly Fault[]): ReportPiece | undefined {
  const marks = faults.map((f) => f.evidence.trim().toLowerCase()).filter((e) => e !== "");
  const carries = (s: string) => marks.some((e) => (/^\d+$/u.test(e) ? numbersIn(s).includes(Number(e)) : s.toLowerCase().includes(e)));
  const cut = (text: string) => sentences(text).filter((s) => !carries(s)).join(" ");
  if (marks.length < faults.length || piece.standfirst === "" || carries(piece.standfirst)) return undefined;
  const account = piece.account.split("\n").map(cut).filter((p) => p !== "").join("\n");
  const sections = piece.sections.filter((s) => !carries(s.head)).map((s) => ({ ...s, pitch: cut(s.pitch) })).filter((s) => s.pitch !== "");
  return account === "" || sections.length === 0 ? undefined : { standfirst: piece.standfirst, account, sections };
}

/** A written headline turns on the lead's story, so it never stands over the lead's plain result. */
export const overTheLead = (chosen: string | null, leadWritten: boolean): string | null => (leadWritten ? chosen : null);

/** Per match: the first attempt if it passed; else the rewrite if it has no hard fault and fewer faults than the first;
 *  else the first if it has no hard fault; else the attempt with fewer hard faults, those sentences cut (`salvaged`).
 *  The fan's flags are never hard. */
export function mergeReports(attempts: readonly { draft: ReportsDraft; faults: readonly Fault[] }[], codes: readonly number[]): ReportsDraft {
  const [first, second] = attempts;
  const matches = new Map<number, ReportPiece>();
  for (const code of codes) {
    const a = first?.draft.matches.get(code);
    const b = second?.draft.matches.get(code);
    if (a !== undefined && blocking(first.faults, code) === 0) matches.set(code, a);
    else if (b !== undefined && !hard(second.faults, code) && (a === undefined || hard(first.faults, code) || blocking(second.faults, code) < blocking(first.faults, code))) matches.set(code, b);
    else if (a !== undefined && !hard(first.faults, code)) matches.set(code, a);
    else {
      const tried = attempts.flatMap((t) => { const p = t.draft.matches.get(code); return p === undefined ? [] : [{ p, faults: hardOn(t.faults, code) }]; });
      const fewest = tried.sort((x, y) => x.faults.length - y.faults.length)[0];
      const kept = fewest === undefined ? undefined : salvaged(fewest.p, fewest.faults);
      if (kept !== undefined) matches.set(code, kept);
    }
  }
  const faulted = (faults: readonly Fault[], hardOnly: boolean) =>
    faults.some((f) => f.section === "headline" && (hardOnly ? f.severity === "hard" : f.severity !== "warn"));
  const headline =
    first !== undefined && !faulted(first.faults, false) ? first.draft.headline
    : second !== undefined && second.draft.headline !== "" && !faulted(second.faults, true) ? second.draft.headline
    : (first?.draft.headline ?? "");
  return { headline, headlines: first?.draft.headlines ?? [], matches };
}
