import { listed } from "../../format";
import { derbyBrief } from "../../league/derbies";
import { ordinal } from "../../league/ordinal";
import { londonWeekdayLong } from "../../time";
import type { MatchupContext, NextOpponent } from "./brief";
import { blank } from "./autoSubs";
import { counted, everyMan, type SideState } from "./state";
import { aheadWords, fitnessLine, minutesLine, newLine, pts, returnCount, returnWords } from "./stories";
import type { Thread } from "./thread";
import { SIDES } from "../side";
import { possessive } from "./words";
import type { DraftMan } from "./types";
import { briefOf } from "../briefs/briefOf";
import { markWords } from "./marks";

// One match-up's block of the brief, built on the story the desk chose (`angle.ts`): the result, THE STORY and its twist,
// the cast, the returns biggest first, the automatic substitutions, the threads, the season for the close, what comes
// next and last time's story. No day, no running score and no gap: who led on a day is the fixture list's. A cast man's
// points are given once, in THE CAST; the labels are the writer's and never print.

/** A thread's facts in its beat, led by its side's name when they do not give it, or a writer gives them to the other. */
function told(ctx: MatchupContext, t: Thread): string {
  const side = SIDES.map((w) => ctx.state[w].side).find((s) => s.teamId === t.teamId)?.name;
  const facts = t.facts.join("; ");
  return `${side === undefined || facts.includes(side) ? "" : `${side}: `}${facts}`;
}
const block = (head: string, lines: readonly string[]) => (lines.length === 0 ? null : [head, ...lines].join("\n"));

function sideOf(ctx: MatchupContext, m: DraftMan): SideState | undefined {
  return SIDES.map((w) => ctx.state[w]).find((s) => [...s.side.eleven, ...s.side.bench].includes(m));
}

/** The matches he played, each with its score and our judgement of him in words, "in Brighton 3-1 Wolves, the best
 *  player on the pitch": the football a stat line lacks (a sports editor's first ask, 14 Oct 2026). */
function matchWords(m: DraftMan): string | null {
  if (m.minutes === 0) return null;
  const said = m.matches.filter((x) => x.played).map((x) => {
    const words = markWords(x.mark, x.best);
    return `in ${x.label}${words === null ? "" : `, ${words}`}`;
  });
  return said.length === 0 ? null : said.join("; ");
}

/** A cast man in one line, introduced as a paper introduces him, with his side, his points and what made them, how he
 *  came into it, and anything else about him. */
function castLine(ctx: MatchupContext, m: DraftMan): string {
  const s = sideOf(ctx, m);
  const sub = s?.subs.find((x) => x.in === m);
  // A reserve left on the bench; a starter a reserve replaces is neither.
  const bench = s !== undefined && sub === undefined && s.side.bench.includes(m);
  const replaced = s?.subs.find((x) => x.out === m && x.ahead === null);
  const points = m.minutes === 0 && m.left > 0 ? "yet to play" : m.points === null ? null : `${pts(m.points)}${m.goals + m.assists + m.cleanSheets > 0 ? `: ${returnWords(m)}` : ""}`;
  const next = m.left > 0 && m.next !== null ? `plays ${m.next.home ? "at home to" : "away to"} ${m.next.opponent} on ${londonWeekdayLong(m.next.kickoff)}` : null;
  const parts = [
    points,
    matchWords(m),
    sub === undefined ? null : sub.ahead !== null ? aheadWords(sub) : `${sub.out.name} did not play, so he ${sub.provisional ? "comes on if he plays" : "came on"}`,
    bench ? "on the bench, so his points did not count" : null,
    minutesLine(m),
    s === undefined ? null : newLine(m, s.side),
    // The club's word says he did not play; without one, the line does.
    blank(m) && m.fitness === null ? "did not play" : null,
    fitnessLine(m),
    replaced === undefined ? null : `${replaced.in.name} ${replaced.provisional ? "comes on for him if he plays" : "came on for him"}`,
    next,
  ];
  // His club and name, never a position: the slot is his manager's choice, which made De Cuyper a midfielder in GW6.
  const whose = s === undefined ? "" : `, ${sub !== undefined || bench ? "a reserve " : ""}for ${s.side.name}`;
  return `- ${m.club}'s ${m.fullName}${whose}: ${parts.filter((p) => p !== null).join("; ")}`;
}

/** Every return whose points counted, the biggest first, by name and side and without its points. */
function returnLines(ctx: MatchupContext): string[] {
  return SIDES.flatMap((w) => counted(ctx.state[w]).filter((m) => returnCount(m) > 0).map((m) => ({ w, m })))
    .sort((a, b) => (b.m.points ?? 0) - (a.m.points ?? 0))
    .map(({ w, m }) => `- ${possessive(ctx.state[w].side.name)} ${m.fullName} (${[returnWords(m), matchWords(m)].filter((x) => x !== null).join("; ")})`);
}

/** Each reserve the substitutions brought on, and the man he came on for. */
function subLines(ctx: MatchupContext): string[] {
  return SIDES.flatMap((w) => ctx.state[w].subs.filter((s) => !s.provisional).map((s) => `- ${s.in.fullName} came on for ${ctx.state[w].side.name} in place of ${s.out.name}, who did not play`));
}

/** Where each side goes next, for a last line that looks out. */
function nextLines(ctx: MatchupContext): string[] {
  // The rank is the opponent's, said so, or it reads as the side's own place.
  const line = (name: string, next: NextOpponent | null) => (next === null ? [] : [`- ${name} play ${next.name}${next.rank === null ? "" : `, who are ${ordinal(next.rank)} after this gameweek`}`]);
  return [...line(ctx.state.home.side.name, ctx.next.home), ...line(ctx.state.away.side.name, ctx.next.away)];
}

/** Each side's last story in words, so this one is told another way. */
function lastLines(ctx: MatchupContext): string[] {
  const men = everyMan(ctx.state);
  return (ctx.angle?.past ?? []).map((p) => {
    const sides = SIDES.map((w) => ctx.state[w].side).filter((s) => p.teamIds.includes(s.teamId)).map((s) => s.name);
    const cast = p.cast.flatMap((id) => men.find((m) => m.fantraxId === id)?.name ?? []);
    const kind = p.kind.replace(/-/gu, " ");
    return `- ${listed(sides, "and")}: ${/^[aeiou]/iu.test(kind) ? "an" : "a"} ${kind}${cast.length === 0 ? "" : `, told through ${listed(cast, "and")}`}`;
  });
}

export function matchupBlock(ctx: MatchupContext, n: number): string {
  const angle = ctx.angle;
  const cast = new Set(angle?.cast ?? []);
  const line = (t: Thread) => `- ${told(ctx, t)}`;
  return briefOf([
    `MATCH-UP ${n}: ${ctx.state.home.side.name} v ${ctx.state.away.side.name}${n === 1 ? ", THE LEAD" : ""}`,
    ctx.derby ? derbyBrief(ctx.derby) : null,
    `THE RESULT, printed above your words, never in them: ${ctx.state.score}.`,
    angle === null ? "THE STORY: the result alone." : `THE STORY, which your first sentence tells: ${told(ctx, angle.story)}`,
    angle?.twist == null ? null : `THE TWIST: ${told(ctx, angle.twist)}`,
    block("THE CAST, each man's points given once:", [...cast].map((m) => castLine(ctx, m))),
    block("THE RETURNS, biggest first:", returnLines(ctx)),
    block("THE AUTOMATIC SUBSTITUTIONS:", subLines(ctx)),
    block("THREADS:", (angle?.supporting ?? []).filter((t) => t.scope !== "season").map(line)),
    // The bracketed kind tells the writer which frame a fact takes; it is never printed.
    block("FORM AND THE TABLE, for the close:", ctx.form.filter((f) => !angle?.story.facts.includes(f.text)).map((f) => `- ${f.text} [${f.kind}]`)),
    block("NEXT GAMEWEEK, for a last line that looks out:", nextLines(ctx)),
    block("LAST TIME, not to be told the same way again:", lastLines(ctx)),
  ]);
}
