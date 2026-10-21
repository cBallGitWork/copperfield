import type { PastMaps, PastSeason, RateTotals, SeasonTotals } from "@epl/core";
import { per90 } from "../standout";
import { touchCount } from "../[fantraxId]/maps";

// What the two men have done, as rates: the attribute grid says where he ranks, this how often. This season's ledger
// is the underlying play only; one with a past season in it is what both seasons carry. Under ninety minutes a rate is a dash.

/** What a ledger reads for one man: FPL's totals, and the export's counts, which are null for a man the export never
 *  bridged (a dash) and nought for one it covers who did nothing. A past season has no starts, expected goals or
 *  defensive actions, so those are null; the four counts after `keyPasses` are read only beside a past season. */
export type Played = { [Key in keyof RateTotals]: number | null } & {
  /** His xG less his penalties' (`nonPenaltyXg`); null where his shots cannot vouch for it, and in a past season. */
  nonPenaltyExpectedGoals: number | null;
  touches: number | null;
  shots: number | null;
  keyPasses: number | null;
  goals: number | null;
  assists: number | null;
  cleanSheets: number | null;
  goalsConceded: number | null;
};

/** One measure, and how to read it off a season. */
export interface Rate {
  /** The label between the two figures. */
  name: string;
  /** What it measures, for the `title`. */
  from: string;
  /** Whether it is a count, so divided by ninety; minutes and starts are the denominators. */
  perNinety: boolean;
  of: (played: Played) => number | null;
  /** Which ledger it joins: this season's own, one with a past season on either side, or both. */
  on: "now" | "past" | "both";
}

/** The measures in the order a scout reads them: how much football, with the ball, without it. */
const RATES: readonly Rate[] = [
  { name: "Min", from: "Minutes, season total", perNinety: false, of: (s) => s.minutes, on: "both" },
  { name: "Starts", from: "Starts, season total", perNinety: false, of: (s) => s.starts, on: "now" },
  { name: "Touches", from: "Touches per 90", perNinety: true, of: (s) => s.touches, on: "both" },
  { name: "Shots", from: "Shots per 90", perNinety: true, of: (s) => s.shots, on: "both" },
  { name: "Key passes", from: "Key passes per 90", perNinety: true, of: (s) => s.keyPasses, on: "now" },
  { name: "Goals", from: "Goals per 90", perNinety: true, of: (s) => s.goals, on: "past" },
  { name: "Assists", from: "Assists per 90", perNinety: true, of: (s) => s.assists, on: "past" },
  { name: "xG", from: "Expected goals per 90", perNinety: true, of: (s) => s.expectedGoals, on: "now" },
  {
    name: "npxG",
    from: "Non-penalty expected goals per 90",
    perNinety: true,
    of: (s) => s.nonPenaltyExpectedGoals,
    on: "now",
  },
  { name: "xA", from: "Expected assists per 90", perNinety: true, of: (s) => s.expectedAssists, on: "now" },
  {
    name: "npxGI",
    from: "Non-penalty expected goals and expected assists per 90",
    perNinety: true,
    of: (s) => sum(s.nonPenaltyExpectedGoals, s.expectedAssists),
    on: "now",
  },
  { name: "Tackles", from: "Tackles per 90", perNinety: true, of: (s) => s.tackles, on: "now" },
  {
    name: "CBI",
    from: "Clearances, blocks and interceptions per 90",
    perNinety: true,
    of: (s) => s.clearancesBlocksInterceptions,
    on: "now",
  },
  { name: "Recoveries", from: "Recoveries per 90", perNinety: true, of: (s) => s.recoveries, on: "now" },
  { name: "CS", from: "Clean sheets per 90", perNinety: true, of: (s) => s.cleanSheets, on: "past" },
  { name: "Saves", from: "Saves per 90", perNinety: true, of: (s) => s.saves, on: "both" },
  {
    name: "Conceded",
    from: "Goals conceded per 90, lower is better",
    perNinety: true,
    of: (s) => s.goalsConceded,
    on: "past",
  },
  {
    name: "xGC",
    from: "Expected goals conceded per 90, lower is better",
    perNinety: true,
    of: (s) => s.expectedGoalsConceded,
    on: "now",
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

/** A ledger's measures: this season's own, or, with a past season on either side, only what both seasons carry. */
export function measuresFor(past: boolean): readonly Rate[] {
  return RATES.filter((rate) => rate.on === "both" || rate.on === (past ? "past" : "now"));
}

/** Every measure worth printing about these two, in `RATES`' order: a row neither has anything to say about (two
 *  forwards' saves) is dropped. A man with no football half is all dashes. */
export function rateRows(a: Played | null, b: Played | null, past = false): RateRow[] {
  const rows: RateRow[] = [];
  for (const rate of measuresFor(past)) {
    const left = read(rate, a);
    const right = read(rate, b);
    if (silent(left) && silent(right)) continue;
    rows.push({ name: rate.name, from: rate.from, perNinety: rate.perNinety, a: left, b: right });
  }
  return rows;
}

/** The four counts a past ledger sets against him this season; a window of gameweeks (null) carries none. */
export function seasonCounts(season: SeasonTotals | null): Pick<Played, "goals" | "assists" | "cleanSheets" | "goalsConceded"> {
  return {
    goals: season?.goals ?? null,
    assists: season?.assists ?? null,
    cleanSheets: season?.cleanSheets ?? null,
    goalsConceded: season?.goalsConceded ?? null,
  };
}

/** A completed season as the ledger reads it: its line, and the touches and shots its maps hold. A season with no map
 *  for him, or one with nothing of his in it, is no reading rather than nought. */
export function pastPlayed(season: PastSeason, maps: PastMaps | null): Played {
  const mapped = maps !== null && (maps.counts.size > 0 || maps.shots.length > 0);
  return {
    minutes: season.minutes,
    starts: null,
    expectedGoals: null,
    nonPenaltyExpectedGoals: null,
    expectedAssists: null,
    tackles: null,
    clearancesBlocksInterceptions: null,
    recoveries: null,
    saves: season.saves,
    expectedGoalsConceded: null,
    touches: mapped ? touchCount(maps.counts) : null,
    shots: mapped ? maps.shots.length : null,
    keyPasses: null,
    goals: season.goals,
    assists: season.assists,
    cleanSheets: season.cleanSheets,
    goalsConceded: season.goalsConceded,
  };
}

/** One side of one row; null for a man with no season or a rate with too little football under it. */
function read(rate: Rate, played: Played | null): number | null {
  if (played === null) return null;
  const total = rate.of(played);
  if (total === null) return null;
  return rate.perNinety ? per90(total, played.minutes) : total;
}

/** Two figures added, absent if either is. */
function sum(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : a + b;
}

/** Whether a figure has nothing to say: absent, or nought. */
function silent(value: number | null): boolean {
  return value === null || value === 0;
}
