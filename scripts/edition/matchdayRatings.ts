import {
  DEFCON,
  KEEPER,
  OUTFIELD,
  POOL_PAGE_SIZE,
  RATING_WEIGHTS,
  STRENGTH_SO_FAR,
  fetchPoolStats,
  defConMost,
  fetchSeasonCodes,
  mapPoolStats,
  mapStatSheet,
  pointsFor,
  rateMatch,
  returnPoints,
  strengthBefore,
  type ClubResult,
  type PoolStatRow,
  type ScoringRules,
  type StatSheet,
} from "@epl/core";
import { SCORING_LEAGUE, STATS_LEAGUE } from "../leagues";
import { readScoring } from "../scoring";
import { FANTRAX_STAT } from "../stats/columns";
import type { Say } from "./newsroom";

// Our mark for each man who played on one London day: the scoring league's points for that day, split by its rules,
// the stats league's Opta counts for the mistakes and extras, and the opponent as the season has gone. Six reads a day,
// one after another (Fantrax throttles a burst). The match report and `npm run ratings` both read through here.

type Counts = Record<string, number | null>;

/** One day's figures from both leagues, by Fantrax id. */
interface DayFigures {
  points: Map<string, PoolStatRow>;
  /** The scoring league's own columns by short name: `G`, `AT`, `CS`, `Min`. */
  shorts: Map<string, Counts>;
  /** The stats league's Opta counts by stat key: `bigChancesMissed`, `errorsLeadingToGoal`. */
  opta: Map<string, Counts>;
}

/** Every man's line from one league for one day. */
async function dayRead(leagueId: string, day: string) {
  const code = mapPoolStats(await fetchSeasonCodes(leagueId)).byDate;
  if (code === null) throw new Error(`no per-date season from ${leagueId}`);
  const reads = [];
  for (const group of [OUTFIELD, KEEPER]) {
    const raw = await fetchPoolStats(leagueId, POOL_PAGE_SIZE, code, group, undefined, day);
    reads.push({ pool: mapPoolStats(raw), sheet: mapStatSheet(raw) });
  }
  return reads;
}

/** A sheet's counts per man, keyed by `keyOf(column)`; a column it does not name is left out. */
function countsBy(sheet: StatSheet, keyOf: (column: StatSheet["columns"][number]) => string | undefined): Map<string, Counts> {
  return new Map(
    sheet.lines.map((line) => [line.fantraxId, Object.fromEntries(sheet.columns.flatMap((c, i) => (keyOf(c) === undefined ? [] : [[keyOf(c)!, line.values[i]]])))]),
  );
}

export async function dayFigures(day: string): Promise<DayFigures> {
  const scored = await dayRead(SCORING_LEAGUE.leagueId, day);
  const stats = await dayRead(STATS_LEAGUE.leagueId, day);
  return {
    points: new Map(scored.flatMap((r) => r.pool.rows.map((row) => [row.fantraxId, row] as const))),
    shorts: new Map(scored.flatMap((r) => [...countsBy(r.sheet, (c) => c.short)])),
    opta: new Map(stats.flatMap((r) => [...countsBy(r.sheet, (c) => FANTRAX_STAT[c.stat])])),
  };
}

/** Who the scoring league says played that day, by Fantrax id. */
export const playedOn = (figures: DayFigures) => [...figures.shorts].filter(([, c]) => (c.Min ?? 0) > 0).map(([id]) => id);

/** One man's mark, or null when the league did not score him or he was too brief to rate. */
export function markOf(
  figures: DayFigures,
  rules: ScoringRules,
  id: string,
  match: { minutes: number; opponentClubId: number; kickoff: string; results: readonly ClubResult[] },
): number | null {
  const row = figures.points.get(id);
  if (row === undefined || row.points === null || row.position === null) return null;
  return rateMatch(
    {
      minutes: match.minutes,
      points: { total: row.points, ...returnPoints(figures.shorts.get(id) ?? {}, rules, row.position) },
      stats: figures.opta.get(id) ?? {},
      opponent: strengthBefore(match.results, String(match.opponentClubId), match.kickoff, STRENGTH_SO_FAR),
    },
    RATING_WEIGHTS,
  ).rating;
}

/** The day's figures and the scoring that prices them. */
interface DayReads {
  figures: DayFigures;
  rules: ScoringRules;
}

/** Both, or null when either cannot be read, and the report files without marks or free agents' points. */
export async function dayReads(day: string, say: Say): Promise<DayReads | null> {
  const rules = (await readScoring())?.rules ?? null;
  if (rules === null) return say("  ratings: the scoring league described no scoring"), null;
  try {
    return { figures: await dayFigures(day), rules };
  } catch (error) {
    say(`  ratings: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/** A mark by player code, for the report. */
export function marksFrom(reads: DayReads, opts: { results: readonly ClubResult[]; fantraxIds: ReadonlyMap<number, string>; minutesOf: (code: number) => number }) {
  return (code: number, opponentClubId: number, kickoff: string): number | null => {
    const id = opts.fantraxIds.get(code);
    return id === undefined ? null : markOf(reads.figures, reads.rules, id, { minutes: opts.minutesOf(code), opponentClubId, kickoff, results: opts.results });
  };
}

/** One man's day in the league's scoring: the pool's points, which price him at his own position, and the defensive points
 *  within them and the most a match pays them; those at `slot` instead when he was in a manager's eleven. */
export function dayPoints(reads: DayReads, id: string, slot: string | null): { points: number | null; defensive: number | null; defensiveMost: number | null } {
  const row = reads.figures.points.get(id);
  const counts = reads.figures.shorts.get(id) ?? {};
  const position = slot ?? row?.position ?? null;
  const carried = DEFCON.filter((c) => c.short in counts);
  const defensive = position === null || carried.length === 0 ? null : carried.reduce((sum, c) => sum + (pointsFor(reads.rules, c.short, position, counts[c.short] ?? 0) ?? 0), 0);
  return { points: row?.points ?? null, defensive, defensiveMost: position === null || defensive === null ? null : defConMost(reads.rules, position) };
}
