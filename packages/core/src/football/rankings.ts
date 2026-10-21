import type { ShotLine } from "./shotLine";
import type { FootballPlayer } from "./types";
import type { FigureKind } from "../format";

// Where his season totals rank among the men he is rated against: totals, not rates, so the league table of a figure.

/** One figure and its place. `rank` is null when he has no figure; ties share a place. */
export interface Ranked {
  head: string;
  title: string;
  value: number | null;
  /** What kind of figure it is, which sets the places it prints at. */
  kind: FigureKind;
  rank: number | null;
  /** How many in the cohort have the figure at all. */
  of: number;
}

/** A man's season as FPL counts it, his line on the shot map, and the league's count of his key passes. */
export interface Tallied {
  player: FootballPlayer;
  shots: ShotLine | null;
  /** The stats league's key passes, as Adv Stats prints them; null when it holds no reading for him. */
  keyPasses: number | null;
}

interface Ranking {
  head: string;
  title: string;
  kind?: FigureKind;
  of: (man: Tallied) => number | null;
}

const s = (man: Tallied) => man.player.season;
const hasPlayed = (man: Tallied) => s(man).minutes > 0;

export const OUTFIELD_RANKINGS: readonly Ranking[] = [
  { head: "Min", title: "Minutes played", of: (m) => s(m).minutes },
  { head: "G", title: "Goals", of: (m) => s(m).goals },
  { head: "xG", title: "Expected goals", kind: "expected", of: (m) => s(m).expectedGoals },
  { head: "A", title: "Assists", of: (m) => s(m).assists },
  { head: "xA", title: "Expected assists", kind: "expected", of: (m) => s(m).expectedAssists },
  { head: "Sh", title: "Shots, off the shot map", of: (m) => m.shots?.struck ?? null },
  { head: "KP", title: "Key passes: passes that led to a team-mate's shot", of: (m) => m.keyPasses },
  { head: "Def", title: "Tackles, clearances, blocks, interceptions and recoveries", of: (m) => s(m).tackles + s(m).clearancesBlocksInterceptions + s(m).recoveries },
];

export const KEEPER_RANKINGS: readonly Ranking[] = [
  { head: "Min", title: "Minutes played", of: (m) => s(m).minutes },
  { head: "Sv", title: "Saves", of: (m) => s(m).saves },
  { head: "CS", title: "Clean sheets", of: (m) => s(m).cleanSheets },
  { head: "Prv", title: "Goals prevented: expected goals conceded less goals conceded", kind: "expected", of: (m) => s(m).expectedGoalsConceded - s(m).goalsConceded },
];

/** His place on each figure among the cohort's men who have played; none until he has played himself. Pure. */
export function rankings(man: Tallied, cohort: readonly Tallied[], list: readonly Ranking[]): Ranked[] {
  const played = cohort.filter(hasPlayed);
  const placed = hasPlayed(man);
  return list.map((ranking) => {
    const value = ranking.of(man);
    const theirs = played.map(ranking.of).filter((figure): figure is number => figure !== null);
    return {
      head: ranking.head,
      title: ranking.title,
      value,
      kind: ranking.kind ?? "count",
      rank: value === null || !placed ? null : 1 + theirs.filter((figure) => figure > value).length,
      of: theirs.length,
    };
  });
}
