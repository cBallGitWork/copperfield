import { LATE_GOAL_MINUTE, REPORTS } from "../../config";
import { nextMatch, type NextMatch } from "./ahead";
import { derivedFacts } from "./derived";
import { bestMarked, starMan, type StarMan } from "./star";
import { keyStats, type KeyStat } from "./keyStats";
import { chancesTold, passages } from "./passages";
import { clubStandings, type ClubStanding } from "./standing";
import { pickSections } from "./sections";
import { dayStakes } from "./stakes";
import { isGoal, manCounts, matchEvents, type ManCounts, type MatchEvent } from "./timeline";
import { turnOf, type Turn } from "./turn";
import type { ReportDayInput, ReportMan, ReportMatchInput } from "./types";

// The editor's calls for a match-day, made in code: which match leads, the moment each account turns on and its paragraphs,
// who gets a section and what it means in the league, how long. The model writes prose around these.

/** A section's men, one or two on opposite sides of one head-to-head, and the stake the desk prints after the writer's words. */
export interface DeskSection {
  men: ReportMan[];
  stake: string;
}

export interface MatchDesk {
  match: ReportMatchInput;
  events: MatchEvent[];
  counts: Map<number, ManCounts>;
  standing: { home: ClubStanding | null; away: ClubStanding | null };
  facts: string[];
  /** Each club's next match, for the sidebar. */
  next: { home: NextMatch | null; away: NextMatch | null };
  /** The moment the match turned on, whose paragraph the account gives most room. Never the table, the standfirst's. */
  turn: Turn;
  /** The chances not taken the account tells. */
  chances: MatchEvent[];
  /** The account's paragraphs, each its moments, in match order. */
  paragraphs: MatchEvent[][];
  /** The account's most words. */
  budget: { account: number };
  /** The sections, weightiest first. */
  sections: DeskSection[];
  keyStats: KeyStat[];
  star: StarMan | null;
  lead: boolean;
}

const BUDGET = REPORTS.budget;
const DECISIONS = ["sent-off", "second-yellow", "ruled-out", "penalty-saved", "penalty-missed"];

/** The account's most words: length follows what happened, so a rout is never cut short and a goalless draw never padded. */
function accountWords(events: readonly MatchEvent[]): number {
  const { base, goal, decision, most } = REPORTS.account;
  return Math.min(most, base + goal * events.filter(isGoal).length + decision * events.filter((e) => DECISIONS.includes(e.kind)).length);
}

/** The day's matches, lead first and then in kick-off order, each with its calls made. */
export function deskDay(input: ReportDayInput): MatchDesk[] {
  const codes = input.matches.flatMap((m) => [m.home.code, m.away.code]);
  const standings = clubStandings(input.season, input.clubs, input.day, codes);
  const drafts = input.matches.map((match) => {
    const events = matchEvents(match);
    const standing = { home: standings.get(match.home.code) ?? null, away: standings.get(match.away.code) ?? null };
    const moved = standing.home?.moved === true || standing.away?.moved === true;
    const decided = events.some((e) => DECISIONS.includes(e.kind));
    const late = events.filter((e) => isGoal(e) && e.at >= LATE_GOAL_MINUTE).length;
    const held = match.men.reduce((sum, m) => sum + (m.holder !== null ? (m.points ?? 0) : 0), 0);
    const score = (moved ? 100 : 0) + (decided ? 40 : 0) + late * 15 + events.filter(isGoal).length * 5 + held / 10;
    return { match, events, facts: derivedFacts(match, events), standing, score };
  });
  const leadIndex = drafts.reduce((best, d, i) => (d.score > drafts[best].score ? i : best), 0);
  const rest = drafts.filter((_, i) => i !== leadIndex).sort((a, b) => (a.match.fixture.kickoff ?? "").localeCompare(b.match.fixture.kickoff ?? ""));

  // Every match's sections are chosen before any stake is written: a head-to-head is told once on the page.
  const planned = [drafts[leadIndex], ...rest].map((d, i) => {
    const dead = !d.events.some((e) => isGoal(e) || ["woodwork", ...DECISIONS].includes(e.kind));
    const size = dead ? BUDGET.dead : i === 0 ? BUDGET.lead : BUDGET.ordinary;
    return { ...d, size, picks: pickSections(d.match.men, d.events, size.sections, bestMarked(d.match)?.m ?? null) };
  });
  const stakes = dayStakes(planned.map((p) => p.picks));

  return planned.map((d, i) => {
    const { match, events, facts, size, picks } = d;
    const counts = manCounts(events, match.men);
    const next = (code: number) => nextMatch(input.season, input.clubs, code, input.day);
    const turn = turnOf(match, events);
    const chances = chancesTold(match, events, turn, picks.flatMap((p) => p.men));
    return {
      match,
      events,
      counts,
      standing: d.standing,
      facts,
      next: { home: next(match.home.code), away: next(match.away.code) },
      turn,
      chances,
      paragraphs: passages(events, turn, chances),
      budget: { account: accountWords(events) },
      sections: picks.map((p, j) => ({ men: p.men, stake: stakes[i][j] })),
      keyStats: keyStats(match, events, counts, size.stats, input.keeperRung),
      star: starMan(match, events),
      lead: i === 0,
    };
  });
}
