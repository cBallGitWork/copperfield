import { DRAFT_WRITING } from "../../config";
import { everyMan } from "./state";
import { derbyNames } from "../../league/derbies";
import { QUOTE_MARKS, americanisms, banned } from "../banned";
import { faultLog, type Fault } from "../predictions/checks";
import { mentionAt, numbersIn, sentences, wordCount } from "../predictions/prose";
import { blanked, faultOn, strayFigures } from "../proofing";
import { repeatsIn } from "../reports/repeats";
import { REPORT_FPL } from "../reports/words";
import type { MatchupContext } from "./brief";
import { SIDE_ELEVEN, listFaults, menOf, type PastProse } from "./listChecks";
import { retold, type ToldSection } from "./told";
import type { DraftPiece, DraftWriting } from "./writing";
import { DRAFT_NEVER } from "./words";

// The editor reads each match-up against its own block of the brief: its men and no other match-up's, its figures, its
// scores, the league's words, and its length. Pure; the writer is sent back once on these, never on taste.

const SCORE = /\b(\d{1,3})-(\d{1,3})\b/gu;
/** The punctuation the voice never uses: a colon, a question, an exclamation. */
const MARKS = /[:?!]/u;
/** An FM frame is a register, never a person's feeling: a named manager given one is invented. */
const FEELING = /\b(?:manager|boss|owner)\b[^.]{0,40}\b(?:feel|feels|felt|furious|delighted|angry|pleased|worried|fuming|livid)\b/iu;

/** The figures a match-up may print: its block's, and the margin read off the printed result. */
export function allowedFigures(ctx: MatchupContext, block: string): Set<number> {
  return new Set([0, ...numbersIn(block), Math.abs(ctx.state.margin)]);
}

/** A score a match-up prints that its block never gives: a day's score, a running score. */
export function ungivenScores(prose: string, block: string): string[] {
  const given = new Set([...block.matchAll(SCORE)].flatMap(([, a, b]) => [`${a}-${b}`, `${b}-${a}`]));
  return [...prose.matchAll(SCORE)].map(([said]) => said).filter((said) => !given.has(said));
}

/** `past` is the words of recent reports, for the echo; `told` what this gameweek's Prem Reports printed of its men. */
export function checkDraft(writing: DraftWriting, contexts: readonly MatchupContext[], blocks: readonly string[], past: readonly PastProse[] = [], told: readonly ToldSection[] = []): Fault[] {
  const { faults, fault } = faultLog();
  const everyone = contexts.map((ctx) => menOf(ctx).flatMap((m) => m.names));
  // Every side named on the page, next gameweek's opponents too: "test3" is a side, not a 3.
  const sides = [...new Set(contexts.flatMap((c) => [c.state.home.side.name, c.state.away.side.name, ...[c.next.home, c.next.away].flatMap((x) => x?.name ?? [])]))];
  const pieces: { code: number; prose: string }[] = [];
  contexts.forEach((ctx, at) => {
    const n = at + 1;
    const piece: DraftPiece | undefined = writing.matchups.get(n);
    if (piece === undefined || piece.paragraphs.length === 0) {
      fault(`${n}:matchup`, "missing", "hard", "no paragraphs");
      return;
    }
    const prose = piece.paragraphs.join("\n");
    pieces.push({ code: n, prose });
    const block = blocks[at] ?? "";
    const mine = new Set(everyone[at]);
    for (const other of everyone.flatMap((names, i) => (i === at ? [] : names))) {
      if (!mine.has(other) && other.length > 3 && mentionAt(prose, other) >= 0) fault(`${n}:matchup`, "a man from another match-up", "hard", other);
    }
    const allowed = allowedFigures(ctx, block);
    for (const x of strayFigures(prose.replace(SCORE, " ").replace(SIDE_ELEVEN, " "), allowed)) fault(`${n}:matchup`, "a figure the brief does not give", "hard", String(x));
    for (const said of ungivenScores(prose, block)) fault(`${n}:matchup`, "a score the brief does not give", "hard", said);
    faultOn(fault, `${n}:matchup`, "a quotation mark: the paper prints nobody's words", "hard", QUOTE_MARKS, prose);
    // A man's name is never a banned word: Archie Gray is not American spelling.
    const plain = blanked(prose, [...everyone.flat(), ctx.state.home.side.name, ctx.state.away.side.name, ...derbyNames(ctx.derby)]);
    for (const phrase of banned(plain, REPORT_FPL)) fault(`${n}:matchup`, "names a source", "hard", phrase);
    for (const phrase of banned(plain, DRAFT_NEVER)) fault(`${n}:matchup`, "a phrase this paper does not print", "send-back", phrase);
    for (const phrase of americanisms(plain)) fault(`${n}:matchup`, "American, not British", "send-back", phrase);
    faultOn(fault, `${n}:matchup`, "a colon, a question or an exclamation mark", "send-back", MARKS, prose);
    faultOn(fault, `${n}:matchup`, "a named person's feeling", "send-back", FEELING, prose);
    // The brief's "Crystal Palace 3-1 Nott'm Forest" is a label; a report names the match its own way.
    for (const label of new Set(everyMan(ctx.state).flatMap((m) => m.matches.filter((x) => x.played).map((x) => x.label)))) {
      if (prose.includes(label)) fault(`${n}:matchup`, "a match named as the brief names it", "send-back", label);
    }
    // The score prints above the lede, so the lede never gives it again.
    if (sentences(prose)[0]?.includes(ctx.state.score) === true) fault(`${n}:matchup`, "opens on the result the page already prints", "send-back", sentences(prose)[0] ?? "");
    faults.push(...listFaults(piece, ctx, at, block, past, sides), ...retold(piece, ctx, at, told));
    const [least, rest] = DRAFT_WRITING.matchupWords;
    const most = at === 0 ? DRAFT_WRITING.leadWords : rest;
    const words = wordCount(prose);
    if (words < least || words > most) fault(`${n}:matchup`, `a match-up of ${least} to ${most} words`, "send-back", `${words} words`);
  });
  // A side's name is no more a leaned-on word than a man's is.
  for (const r of repeatsIn(pieces, [...everyone.flat(), ...sides, ...contexts.flatMap((c) => derbyNames(c.derby))])) {
    const what = r.kind === "phrase" ? "a phrase said twice" : r.kind === "opener" ? "sentences that open the same way" : "a word leaned on";
    fault(r.code === null ? "page" : `${r.code}:matchup`, what, "send-back", `${r.said} ×${r.count}`);
  }
  return faults;
}
