import type { RateTotals } from "@epl/core";
import { per90 } from "../standout";

// What the two men have done, as rates: the attribute grid says where he ranks, this how often. The underlying play
// only, never the goals, assists and clean sheets the league counts. Under ninety minutes a rate is a dash.

/** What a ledger reads for one man over the window: FPL's totals, and the export's counts, which are null for a
 *  man the export never bridged (a dash) and nought for one it covers who did nothing. */
export type Played = RateTotals & { touches: number | null; shots: number | null; keyPasses: number | null };

/** One measure, and how to read it off a season. */
export interface Rate {
  /** The label between the two figures. */
  name: string;
  /** What it measures, for the `title`. */
  from: string;
  /** Whether it is a count, so divided by ninety; minutes and starts are the denominators. */
  perNinety: boolean;
  of: (played: Played) => number | null;
}

/** The measures in the order a scout reads them: how much football, with the ball, without it. */
const RATES: readonly Rate[] = [
  { name: "Min", from: "Minutes, season total", perNinety: false, of: (s) => s.minutes },
  { name: "Starts", from: "Starts, season total", perNinety: false, of: (s) => s.starts },
  { name: "Touches", from: "Touches per 90", perNinety: true, of: (s) => s.touches },
  { name: "Shots", from: "Shots per 90", perNinety: true, of: (s) => s.shots },
  { name: "Key passes", from: "Key passes per 90", perNinety: true, of: (s) => s.keyPasses },
  { name: "xG", from: "Expected goals per 90", perNinety: true, of: (s) => s.expectedGoals },
  { name: "xA", from: "Expected assists per 90", perNinety: true, of: (s) => s.expectedAssists },
  { name: "Tackles", from: "Tackles per 90", perNinety: true, of: (s) => s.tackles },
  {
    name: "CBI",
    from: "Clearances, blocks and interceptions per 90",
    perNinety: true,
    of: (s) => s.clearancesBlocksInterceptions,
  },
  { name: "Recoveries", from: "Recoveries per 90", perNinety: true, of: (s) => s.recoveries },
  { name: "Saves", from: "Saves per 90", perNinety: true, of: (s) => s.saves },
  {
    name: "xGC",
    from: "Expected goals conceded per 90, lower is better",
    perNinety: true,
    of: (s) => s.expectedGoalsConceded,
  },
];

/** One measure as both of them have it. */
export interface RateRow {
  name: string;
  from: string;
  /** Whether the two figures are rates, which decides how they print: a rate on a whole number is still a rate. */
  perNinety: boolean;
  a: number | null;
  b: number | null;
}

/** Every measure worth printing about these two, in `RATES`' order: a row neither has anything to say about (two
 *  forwards' saves) is dropped. A man with no football half is all dashes. */
export function rateRows(a: Played | null, b: Played | null): RateRow[] {
  const rows: RateRow[] = [];
  for (const rate of RATES) {
    const left = read(rate, a);
    const right = read(rate, b);
    if (silent(left) && silent(right)) continue;
    rows.push({ name: rate.name, from: rate.from, perNinety: rate.perNinety, a: left, b: right });
  }
  return rows;
}

/** One side of one row; null for a man with no season or a rate with too little football under it. */
function read(rate: Rate, played: Played | null): number | null {
  if (played === null) return null;
  const total = rate.of(played);
  if (total === null) return null;
  return rate.perNinety ? per90(total, played.minutes) : total;
}

/** Whether a figure has nothing to say: absent, or nought. */
function silent(value: number | null): boolean {
  return value === null || value === 0;
}
