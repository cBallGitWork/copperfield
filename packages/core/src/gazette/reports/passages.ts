import { REPORTS } from "../../config";
import { keeperAt } from "./men";
import { numeral } from "./minutes";
import { goalsBy, isDismissal, isGoal, type MatchEvent } from "./timeline";
import type { Turn } from "./turn";
import type { ReportMan, ReportMatchInput } from "./types";
import { plural } from "../../format";
import { otherSide } from "../side";

// The account's plan, made in code: the chances not taken it tells, and its paragraphs, in the order the match was played.

const CLOSE = new Set(["from close range", "from inside the six-yard box"]);
const SHOTS = new Set(["missed", "saved", "woodwork"]);
/** Told wherever they fall: what changed the score, the men on the pitch, or a goal's fate. */
const TOLD = new Set(["goal", "penalty-goal", "own-goal", "ruled-out", "penalty-missed", "penalty-saved", "sent-off", "second-yellow", "injured-off"]);
const MOST_PARAGRAPHS = 3;
const [, LINES] = REPORTS.paragraph;

/** The keeper behind a save: the other side's, on the pitch at that minute. */
export const saverOf = (match: ReportMatchInput, event: MatchEvent): ReportMan | null =>
  event.side === null ? null : keeperAt(match, otherSide(event.side), event.at);

/** The chances not taken the account tells: before the turn, and part of the story (the man scored later, the keeper who
 *  saved it has a section, or it came at 0-0 in a one-goal match). The feed rates no single shot, so a good one is
 *  from close range, or from a man whose chances added up and who did not score. */
export function chancesTold(match: ReportMatchInput, events: readonly MatchEvent[], turn: Turn, sectioned: readonly ReportMan[]): MatchEvent[] {
  const goals = events.filter(isGoal);
  const order = (e: MatchEvent) => events.indexOf(e);
  const end = turn.event === null ? events.length : order(turn.event);
  const saver = (e: MatchEvent) => (e.kind === "saved" ? saverOf(match, e) : null);
  const scoredLater = (e: MatchEvent) => goals.some((g) => g.kind !== "own-goal" && g.man?.code === e.man?.code && order(g) > order(e));
  const keeperWithSection = (e: MatchEvent) => sectioned.some((m) => m.code === saver(e)?.code);
  const lone = (e: MatchEvent) => goals.length === 1 && order(e) < order(goals[0]);
  const attached = (e: MatchEvent) => (turn.kind === "keeper" ? saver(e)?.code === turn.man?.code : scoredLater(e) || keeperWithSection(e) || lone(e));
  const close = (e: MatchEvent) => CLOSE.has(e.shot?.from ?? "");
  const good = (e: MatchEvent) => close(e) || (e.man !== null && e.man.expectedGoals >= REPORTS.missed.quality && goalsBy(goals, e.man.code) === 0);
  const chosen = events
    .slice(0, end)
    .filter((e) => SHOTS.has(e.kind) && e.man !== null && attached(e) && good(e))
    .sort((a, b) => Number(close(b)) - Number(close(a)) || (b.man?.expectedGoals ?? 0) - (a.man?.expectedGoals ?? 0))
    .slice(0, REPORTS.missed.most);
  return events.filter((e) => chosen.includes(e));
}

/** The account's paragraphs in match order, so a reader can follow who led when: a half to a paragraph, a half with one
 *  moment folded into the other, and a long one split. At most three. */
export function passages(events: readonly MatchEvent[], turn: Turn, chances: readonly MatchEvent[]): MatchEvent[][] {
  const told = events.filter((e) => TOLD.has(e.kind) || (e.kind === "substitution" && e.injury) || chances.includes(e) || e === turn.event);
  const halves = [told.filter((e) => e.half === 1), told.filter((e) => e.half !== 1)].filter((half) => half.length > 0);
  const split = (moments: MatchEvent[], count: number) => {
    const size = Math.ceil(moments.length / count);
    return Array.from({ length: count }, (_, i) => moments.slice(i * size, (i + 1) * size));
  };
  const plan = halves.some((half) => half.length < 2) ? [told].filter((all) => all.length > 0) : halves;
  const counts = plan.map((moments) => Math.ceil(moments.length / LINES));
  if (counts.reduce((sum, n) => sum + n, 0) > MOST_PARAGRAPHS) return split(told, MOST_PARAGRAPHS);
  return plan.flatMap((moments, i) => split(moments, counts[i]));
}

/** The paragraph the turn falls in, which the account gives most room; null when the match turned on no one moment. */
export const turnParagraph = (paragraphs: readonly MatchEvent[][], turn: Turn): number | null => {
  const at = paragraphs.findIndex((moments) => turn.event !== null && moments.includes(turn.event));
  return at < 0 ? null : at;
};

/** A moment as a phrase another can be measured from: "the red card", "Haaland's goal". */
export function momentNoun(event: MatchEvent): string {
  const who = event.man?.surname ?? "";
  if (isDismissal(event.kind)) return "the red card";
  if (event.kind === "own-goal") return "the own goal";
  if (isGoal(event)) return `${who}'s goal`;
  if (event.kind === "ruled-out") return `${who}'s goal ruled out`;
  if (event.kind === "penalty-missed" || event.kind === "penalty-saved") return `${who}'s penalty`;
  if (event.kind === "substitution") return `the injury to ${event.other?.surname ?? ""}`;
  if (event.kind === "injured-off") return `the injury to ${who}`;
  return `${who}'s chance`;
}

/** "three minutes after the red card": how far a moment came after the turn, or the turn after the goal before it, when
 *  close and in the same half. The desk does the sum so the writer never does. */
export function sinceTurn(event: MatchEvent, turn: Turn, events: readonly MatchEvent[]): string | null {
  const t = turn.event;
  if (t === null) return null;
  const anchor = event === t ? [...events.slice(0, events.indexOf(t))].reverse().find(isGoal) : events.indexOf(event) > events.indexOf(t) ? t : undefined;
  if (anchor === undefined || anchor.half !== event.half) return null;
  const gap = event.at - anchor.at;
  return gap >= 1 && gap <= REPORTS.burstMinutes ? `${numeral(gap)} ${plural(gap, "minute")} after ${momentNoun(anchor)}` : null;
}
