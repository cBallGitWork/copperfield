import { REPORTS } from "../../config";
import { banned } from "../banned";
import type { Report } from "../predictions/checks";
import { mentionAt, sentences, wordCount } from "../predictions/prose";
import { blanked } from "../proofing";
import { capital, howMany } from "../../format";
import type { MatchDesk } from "./desk";
import type { ReportPiece } from "./draft";
import { CHANGE } from "./parts";
import { isGoal } from "./timeline";
import { REPORT_BOX, REPORT_GLOSSES, REPORT_RESTATED } from "./words";

// The account read as passages, not a log: the paragraphs the desk planned, few of one sentence, in match order, each goal
// in one sentence, no substitution on its own, and nothing the reader already has or the key-stats box prints.

const GOAL = /\b(?:scored|replied|equalised|levelled|drew level|were level|doubled (?:the|their) lead|made it \d+-\d+|put [\p{L}'’ &-]+? (?:ahead|in front)|gave [\p{L}'’ &-]+? the lead|pulled one back|took the lead|went (?:ahead|in front))\b/iu;
/** A sentence that opens on the man who made a goal: its leading name is captured. */
const MAKER_FIRST = /^((?:[\p{Lu}][\p{L}'’-]+ ){1,3})(?:then )?(?:played|supplied|provided|laid on|delivered|set (?:\p{L}+ )?up|found|crossed|released|picked out|sent)\b/u;
const GOAL_AGAIN = /^(?:The goal came|(?:His|The) (?:shot|header|finish|effort|strike)\b)/u;
const HAND = /\b(?:set (?:\p{L}+ )?up|supplied|provided|laid on|delivered|crossed|played (?:the|a) pass|found|picked out|released)\b/iu;
const INJURY = /\binjur|\bhurt\b/iu;
const FLASHBACK = /\bhad (?:put|given|scored|opened|equalised|levelled|pulled|doubled|headed|struck|fired|netted|made it|brought|taken)\b/iu;
/** A goal announced in this few words, then explained, is one goal told twice. */
const ANNOUNCED = 12;
const SCORED = 8;

/** Whether a name stands in the text, allowing the capital a particle takes at a sentence's start ("Van Hecke"). */
const stands = (text: string, name: string) => mentionAt(text, name) >= 0 || mentionAt(text, capital(name)) >= 0;

export function flowFaults(code: number, piece: ReportPiece, desk: MatchDesk, names: readonly string[], fault: Report): void {
  const section = `${code}:account`;
  const paragraphs = piece.account.split("\n").filter((p) => p.trim() !== "");
  const planned = Math.max(desk.paragraphs.length, 1);
  if (paragraphs.length !== planned) fault(section, `${howMany(planned, "paragraph")}, as the desk planned them`, "send-back", `${paragraphs.length}`);
  const short = paragraphs.filter((p) => sentences(p).length < REPORTS.paragraph[0]);
  if (short.length > 1) fault(section, "paragraphs of one sentence; a paragraph is a passage of play", "send-back", short.map((p) => p.slice(0, 60)).join(" | "));

  const lines = sentences(piece.account);
  // The account runs in match order; a goal told after a later one comes back in the pluperfect.
  const back = FLASHBACK.exec(blanked(piece.account, names, "X"));
  if (back !== null) fault(section, "out of order; tell the goals as they came", "send-back", back[0]);

  const plain = blanked(piece.account, names, "X");
  for (const said of banned(blanked([piece.standfirst, piece.account, ...piece.sections.map((s) => s.pitch)].join("\n"), names, "X"), REPORT_GLOSSES)) {
    fault(`${code}:match`, "says what did not happen; cut it, never reword it", "send-back", said);
  }
  for (const said of banned(plain, REPORT_RESTATED)) fault(section, "restates what the reader has; cut it", "send-back", said);
  for (const said of banned(plain, REPORT_BOX)) fault(section, "a figure the key-stats box prints, never the account", "send-back", said);
  for (const line of lines) {
    if (CHANGE.test(line) && !GOAL.test(line) && !HAND.test(line) && !INJURY.test(line)) fault(section, "a substitution on its own; it goes in the sentence of his goal", "send-back", line.slice(0, 70));
  }
  for (const twice of goalsToldTwice(lines, desk)) fault(section, "a goal told in two sentences; one goal, one sentence", "send-back", twice.slice(0, 90));
}

/** Pairs of sentences that tell one goal: announced and then explained, or made and then scored. */
function goalsToldTwice(lines: readonly string[], desk: MatchDesk): string[] {
  const goals = desk.events.filter(isGoal);
  const scored = (line: string) => goals.filter((g) => g.man !== null && stands(line, g.man.surname));
  const made = (lead: string) => goals.filter((g) => g.other !== null && stands(lead, g.other.surname));
  return lines.slice(1).flatMap((b, i) => {
    const a = lines[i];
    const maker = MAKER_FIRST.exec(b);
    const explained = maker === null ? [] : made(maker[1]);
    const told = scored(a);
    if (GOAL.test(a) && wordCount(a) <= ANNOUNCED && (GOAL_AGAIN.test(b) || (explained.length > 0 && (told.length === 0 || explained.some((g) => told.includes(g)))))) return [`${a} ${b}`];
    const first = MAKER_FIRST.exec(a);
    if (first !== null && GOAL.test(b) && wordCount(b) <= SCORED && made(first[1]).some((g) => scored(b).includes(g))) return [`${a} ${b}`];
    return [];
  });
}
