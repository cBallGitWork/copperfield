import { LATE_GOAL_MINUTE, REPORTS } from "../../config";
import { minutesLeft, numeral } from "./minutes";
import { ahead, finalScore, isGoal, type MatchEvent } from "./timeline";
import type { ReportMatchInput } from "./types";
import { plural } from "../../format";
import { SIDES, otherSide, type Side } from "../side";

// Facts worked out from the timeline so the writer never does sums: a lead, a burst, a late winner. The figures are the
// key-stats box's, never the account's.

const { burstMinutes: BURST } = REPORTS;

export const higherFirst = (a: number, b: number) => `${Math.max(a, b)}-${Math.min(a, b)}`;

/** A goal's minute as a report says it: "with 11 minutes left", or its first phrase (the 90th has none left). */
function when(event: MatchEvent): string {
  const left = minutesLeft(event.minute);
  return left !== null && left > 0 && event.at >= 60 ? `with ${numeral(left)} ${plural(left, "minute")} left` : (event.phrases[0] ?? "");
}

/** "once", "twice", "three times". */
export const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${numeral(n)} times`);

/** Runs of goals by one side close together, in one half: first-half added time runs into the second half's clock. */
export function bursts(goals: readonly MatchEvent[]): MatchEvent[][] {
  const runs: MatchEvent[][] = [];
  for (let i = 0; i < goals.length; ) {
    const a = goals[i];
    let j = i;
    while (j + 1 < goals.length && a.side !== null && goals[j + 1].side === a.side && goals[j + 1].half === a.half && goals[j + 1].at > goals[j].at && goals[j + 1].at - a.at <= BURST) j++;
    if (j > i) runs.push(goals.slice(i, j + 1));
    i = j + 1;
  }
  return runs;
}

export function derivedFacts(match: ReportMatchInput, events: readonly MatchEvent[]): string[] {
  const name = (side: Side) => match[side].name;
  const goals = events.filter(isGoal);
  const final = finalScore(events);
  const facts: string[] = [];

  // The biggest lead each side held, when the final margin was smaller.
  for (const side of SIDES) {
    let best: MatchEvent | null = null;
    for (const goal of goals) if (ahead(goal.score, side) > (best === null ? 0 : ahead(best.score, side))) best = goal;
    const most = best === null ? 0 : ahead(best.score, side);
    if (best?.score && most >= 2 && ahead(final, side) < most) facts.push(`${name(side)} were ${higherFirst(best.score.home, best.score.away)} up ${when(best)}`);
  }

  for (const run of bursts(goals)) {
    const span = run[run.length - 1].at - run[0].at;
    if (run[0].side !== null) facts.push(`${name(run[0].side)} scored ${times(run.length)} in ${numeral(span)} ${plural(span, "minute")}`);
  }

  // Who came from behind, and a late winner.
  for (const side of SIDES) {
    if (goals.some((g) => ahead(g.score, side) < 0) && ahead(final, side) >= 0) facts.push(`${name(side)} came from behind`);
  }
  const winner: Side | null = final.home > final.away ? "home" : final.away > final.home ? "away" : null;
  if (winner !== null) {
    const decider = goals.find((g) => g.side === winner && (g.score?.[winner] ?? 0) === final[otherSide(winner)] + 1);
    if (decider !== undefined && decider.at >= LATE_GOAL_MINUTE) facts.push(`the winner came ${when(decider)}`);
  }

  // The first goal a side let in, if it came late.
  for (const side of SIDES) {
    const first = goals.find((g) => g.side === otherSide(side));
    const late = first?.phrases.find((phrase) => phrase.endsWith("from time")) ?? first?.phrases[0];
    if (first !== undefined && first.at >= LATE_GOAL_MINUTE && late !== undefined) facts.push(`${name(side)}'s clean sheet went ${late}`);
  }

  return facts;
}
