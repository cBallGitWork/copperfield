import { mean, type FigureKind, type Ranked } from "@epl/core";
import { RATING_TITLE } from "../../ratings";
import { played, type MatchRow } from "./matchRows";

// The match log's columns, picked by his role as Rankings picked them (Craig, 21 Oct 2026), and the season foot
// under them: a Total row, and his place among his group where the column is ranked.

/** Which men a column is for: a keeper never fills G, A or the expected figures, an outfielder never makes a save. */
type Role = "keeper" | "outfield";

export interface MatchColumn {
  head: string;
  title: string;
  of: (row: MatchRow) => number | null;
  /** Decimal places, for the expected figures. */
  kind?: FigureKind;
  /** A rule before the column: the start of the match's account, of Fantrax's, of our mark. */
  rule?: boolean;
  /** Ours rather than recorded: cyan, and never lit as a standout. */
  derived?: boolean;
  /** Printed in the reading cyan though it sums as a count: his league points (Craig, 21 Oct 2026). */
  cyan?: boolean;
  /** Drawn for this role alone; omitted, for both. */
  role?: Role;
}

export const POINTS: MatchColumn = { head: "FPts", title: "Points", of: (r) => r.paid?.points ?? null, cyan: true };

/** The sum of some figures; null when any of them is missing. */
const sumOf = (...parts: (number | null)[]): number | null =>
  parts.some((part) => part === null) ? null : parts.reduce<number>((run, part) => run + (part ?? 0), 0);

/** A match he was not on for is no reading: every figure but his minutes dashes (zero is a stat only where he played).
 *  Heads match Rankings' (`rankings.ts`), which is how the foot finds a column's place. */
const ON: readonly MatchColumn[] = [
  { head: "G", title: "Goals", of: (r) => r.fpl.match.goals, role: "outfield" },
  { head: "A", title: "Assists", of: (r) => r.fpl.match.assists, role: "outfield" },
  { head: "xG", title: "Expected goals", of: (r) => r.fpl.match.expectedGoals, kind: "expected", role: "outfield" },
  { head: "xA", title: "Expected assists", of: (r) => r.fpl.match.expectedAssists, kind: "expected", role: "outfield" },
  { head: "CS", title: "Clean sheet", of: (r) => Number(r.fpl.match.cleanSheet) },
  { head: "Sv", title: "Saves", of: (r) => r.fpl.match.saves, role: "keeper" },
  {
    head: "Prv",
    title: "Goals prevented: expected goals conceded less goals conceded",
    of: ({ fpl: { match } }) =>
      match.expectedGoalsConceded === null || match.goalsConceded === null ? null : match.expectedGoalsConceded - match.goalsConceded,
    kind: "expected",
    role: "keeper",
  },
  {
    head: "Def",
    title: "Tackles, clearances, blocks, interceptions and recoveries",
    of: (r) => sumOf(r.fpl.match.tackles, r.fpl.match.clearancesBlocksInterceptions, r.fpl.match.recoveries),
    role: "outfield",
  },
  { head: "Sh", title: "Shots", of: (r) => r.paid?.shots ?? null, rule: true, role: "outfield" },
  { head: "SoT", title: "Shots on target", of: (r) => r.paid?.shotsOnTarget ?? null, role: "outfield" },
  // The league counts key passes for the season only, so its column is a foot under dashes.
  { head: "KP", title: "Key passes: passes that led to a team-mate's shot", of: () => null, role: "outfield" },
  { head: "FC", title: "Fouls committed", of: (r) => r.paid?.foulsCommitted ?? null },
  { head: "FS", title: "Fouls suffered", of: (r) => r.paid?.foulsSuffered ?? null },
  { head: "Off", title: "Offsides", of: (r) => r.paid?.offsides ?? null, role: "outfield" },
  { head: "Rtg", title: RATING_TITLE, of: (r) => r.mark, kind: "rating", rule: true, derived: true },
];

const COLUMNS: readonly MatchColumn[] = [
  { head: "Min", title: "Minutes played", of: (r) => r.fpl.match.minutes },
  ...ON.map((column) => ({ ...column, of: (r: MatchRow) => (played(r) ? column.of(r) : null) })),
];

/** His role's columns that some match measured or his season ranks, a stood-down column's rule passing to the next:
 *  Fantrax's keeper table has no shots or offsides at all. */
export function columnsFor(rows: readonly MatchRow[], keeper: boolean, ranked: readonly Ranked[]): MatchColumn[] {
  const role: Role = keeper ? "keeper" : "outfield";
  const heads = new Set(ranked.map((r) => r.head));
  let rule = false;
  return COLUMNS.flatMap((column) => {
    rule ||= Boolean(column.rule);
    if (column.role !== undefined && column.role !== role) return [];
    if (!heads.has(column.head) && !rows.some((row) => column.of(row) !== null)) return [];
    const drawn = { ...column, rule };
    rule = false;
    return [drawn];
  });
}

/** A column's season figure: his ranked total where Rankings counts it (the figure his place is of), his average mark,
 *  or the sum of his matches when every match he played carries the figure; null otherwise. */
export function totalOf(column: MatchColumn, rows: readonly MatchRow[], rank: Ranked | undefined): number | null {
  if (rank !== undefined) return rank.value;
  const readings = rows.filter(played).map(column.of);
  if (column.derived) return mean(readings.filter((value): value is number => value !== null));
  return readings.length === 0 ? null : sumOf(...readings);
}
