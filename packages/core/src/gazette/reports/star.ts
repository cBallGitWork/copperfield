import { played } from "./men";
import { assistsBy, goalsBy, isGoal, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";
import { tally } from "../counted";

// The Star man: the best mark of everyone who played, held or not, as a paper names one under its ratings. Ties go to the
// man with more league points, then more minutes. None when nobody was rated.

export interface StarMan {
  name: string;
  club: string;
  holder: string | null;
  mark: number;
  /** "3 goals"; empty when he did neither. */
  did: string;
}

/** "2 goals, 1 assist"; empty when he did neither. */
const didOf = (goals: readonly MatchEvent[], code: number) => tally([[goalsBy(goals, code), "goal"], [assistsBy(goals, code), "assist"]]);

/** His club as the sidebar names it: the short name, else the full one. */
const sidebarClub = (match: ReportMatchInput, m: ReportMan) => match[m.side].shorts[0] ?? match[m.side].name;

/** The best-marked man who played, and his mark; null when nobody was rated. */
export function bestMarked(match: ReportMatchInput): { m: ReportMan; mark: number } | null {
  const rated = match.men.flatMap((m) => {
    const mark = match.marks.get(m.code);
    return played(m) && mark != null ? [{ m, mark }] : [];
  });
  rated.sort((a, b) => b.mark - a.mark || (b.m.points ?? 0) - (a.m.points ?? 0) || b.m.minutes - a.m.minutes);
  return rated[0] ?? null;
}

export function starMan(match: ReportMatchInput, events: readonly MatchEvent[]): StarMan | null {
  const best = bestMarked(match);
  if (best === null) return null;
  return {
    name: best.m.surname,
    club: sidebarClub(match, best.m),
    holder: best.m.holder?.team ?? null,
    mark: best.mark,
    did: didOf(events.filter(isGoal), best.m.code),
  };
}
