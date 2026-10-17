import { LATE_GOAL_MINUTE } from "../../config";
import { bursts, higherFirst, times } from "./derived";
import { numeral } from "./minutes";
import { withClub } from "./men";
import { ahead, finalScore, isDismissal, isGoal, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";
import { plural } from "../../format";
import { SIDES, otherSide, type Side } from "../side";

// The moment a match turned on, picked in code in order of weight: the standfirst's story, and the paragraph the account
// gives most room, never a chance that came to nothing.

export type TurnKind =
  | "red card" | "comeback" | "late winner" | "burst" | "lead changed" | "hat-trick" | "only goal" | "first goal"
  | "ruled out" | "woodwork" | "keeper" | "goalless";

export interface Turn {
  kind: TurnKind;
  /** The moment the match turned on; null when it is a keeper's whole match, or nothing. */
  event: MatchEvent | null;
  /** The man the turn is about. */
  man: ReportMan | null;
  /** The turn as the desk hands it over, in plain words. */
  line: string;
}

type Score = { home: number; away: number };
const NOT_SCORED = new Set(["ruled-out", "penalty-missed", "penalty-saved"]);

export function turnOf(match: ReportMatchInput, events: readonly MatchEvent[]): Turn {
  const goals = events.filter(isGoal);
  const final = finalScore(events);
  const winner = SIDES.find((side) => ahead(final, side) > 0) ?? null;
  const club = (side: Side) => match[side].name;
  const name = (e: MatchEvent) => withClub(match, e.man);
  const turn = (kind: TurnKind, event: MatchEvent, line: string): Turn => ({ kind, event, man: event.man, line });
  const later = (e: MatchEvent) => goals.some((g) => events.indexOf(g) > events.indexOf(e));

  const red = events.find((e) => isDismissal(e.kind) && (goals.length === 0 || later(e)));
  if (red !== undefined) return turn("red card", red, `${name(red)} was sent off ${state(match, events, red)}${goals.length === 0 ? "" : ", and the score changed after it"}`);

  const back = comeback(goals, final, winner);
  if (back !== null) return turn("comeback", back.goal, `${club(back.side)} came from behind, ${name(back.goal)} levelling at ${back.goal.score?.home}-${back.goal.score?.away}`);

  if (winner !== null) {
    const decider = goals.find((g) => g.side === winner && g.score !== null && g.score[winner] === final[otherSide(winner)] + 1);
    if (decider !== undefined && decider.at >= LATE_GOAL_MINUTE) return turn("late winner", decider, `${name(decider)} scored the winner`);
    const run = decider === undefined ? undefined : bursts(goals).find((b) => b.includes(decider) && b[0].side === winner);
    if (run !== undefined) {
      const span = run[run.length - 1].at - run[0].at;
      return turn("burst", run[0], `${club(winner)} scored ${times(run.length)} in ${numeral(span)} ${plural(span, "minute")}, ${name(run[0])} first`);
    }
  }

  for (const side of SIDES) {
    const changed = goals.find((g, i) => g.side === side && ahead(g.score, side) > 0 && goals.slice(0, i).some((p) => ahead(p.score, otherSide(side)) > 0));
    if (changed !== undefined) return turn("lead changed", changed, `the lead changed hands when ${name(changed)} put ${club(side)} ahead`);
  }

  for (const man of match.men) {
    const his = goals.filter((g) => g.kind !== "own-goal" && g.man?.code === man.code);
    if (his.length >= 3) return turn("hat-trick", his[2], `${withClub(match, man)} completed his hat-trick`);
  }
  if (goals.length > 0) return turn(goals.length === 1 ? "only goal" : "first goal", goals[0], `the ${goals.length === 1 ? "only" : "first"} goal, by ${name(goals[0])}`);

  const denied = events.find((e) => NOT_SCORED.has(e.kind) && e.man !== null);
  if (denied !== undefined) return turn("ruled out", denied, `${name(denied)} ${denied.kind === "ruled-out" ? "had a goal ruled out after a video review" : "did not score from the penalty spot"} in a goalless match`);
  const post = events.find((e) => e.kind === "woodwork" && e.man !== null);
  if (post !== undefined) return turn("woodwork", post, `${name(post)} hit the woodwork in a goalless match`);
  const keeper = match.men.filter((m) => m.line === "G" && m.saves > 0).sort((a, b) => b.saves - a.saves)[0];
  if (keeper !== undefined) return { kind: "keeper", event: null, man: keeper, line: `${withClub(match, keeper)} made ${numeral(keeper.saves)} ${plural(keeper.saves, "save")} in a goalless match` };
  return { kind: "goalless", event: null, man: null, line: "a goalless match" };
}

/** The score as a moment found it: "at 0-0", or "with Brighton & Hove Albion 1-0 up". */
export function state(match: ReportMatchInput, events: readonly MatchEvent[], moment: MatchEvent): string {
  const s = [...events.slice(0, events.indexOf(moment))].reverse().find((e) => isGoal(e))?.score ?? { home: 0, away: 0 };
  const leader = SIDES.find((side) => ahead(s, side) > 0);
  return leader === undefined ? `at ${s.home}-${s.away}` : `with ${match[leader].name} ${higherFirst(s.home, s.away)} up`;
}

/** The goal that levelled it for a winner who had trailed, or for a side that came back from two down to draw. */
function comeback(goals: readonly MatchEvent[], final: Score, winner: Side | null): { goal: MatchEvent; side: Side } | null {
  const side = winner ?? SIDES.find((s) => ahead(final, s) === 0 && goals.some((g) => ahead(g.score, s) <= -2)) ?? null;
  if (side === null) return null;
  const last = goals.findLastIndex((g) => ahead(g.score, side) < 0);
  const goal = last < 0 ? undefined : goals.slice(last + 1).find((g) => g.side === side && ahead(g.score, side) === 0);
  return goal === undefined ? null : { goal, side };
}
