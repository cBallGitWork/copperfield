import { blocks, stat, type FootballPlayer, type StatKey, type StatsRow } from "@epl/core";
import type { PoolColumn } from "./columns";
import type { PoolGroup } from "./groups";

// Adv Stats' season figures (Craig, 9 Oct 2026: "shots, chances created … big chances … crosses"; 19 Oct 2026: "more
// things like xg … split into attack/defending, and a glossary"). The served league carries none, so they ride in the
// stats bag under their own keys, never as a `stat`: the stats league's counts, and the expected figures.

/** Where a figure is read from: a stats league count (or blocks, worked out of three), or an expected figure. */
type From = { count: StatKey | "blocks" } | { expected: "xg" | "xa" | "xgi" | "xgc" };

interface SeasonStat {
  /** The address bar's key. */
  key: string;
  from: From;
  label: string;
  title: string;
  /** The key's one line on what it counts, in plain words. */
  means: string;
  group: PoolGroup;
  mark?: PoolColumn["mark"];
}

/** Every figure, by plate and in the order a plate draws them, headed in the house's words. */
const SEASON_STATS: readonly SeasonStat[] = [
  { key: "xg", from: { expected: "xg" }, label: "xG", title: "Expected goals", means: "The goals his shots were worth, by how often shots like them go in.", group: "attacking" },
  { key: "xgi", from: { expected: "xgi" }, label: "xGI", title: "Expected goal involvements", means: "His expected goals and expected assists added together.", group: "attacking" },
  { key: "sh", from: { count: "shots" }, label: "Sh", title: "Shots", means: "Every attempt at goal: on target, off it or blocked.", group: "attacking" },
  { key: "sot", from: { count: "shotsOnTarget" }, label: "SoT", title: "Shots on target", means: "Shots that went in or were saved.", group: "attacking" },
  { key: "bcm", from: { count: "bigChancesMissed" }, label: "BCM", title: "Big chances missed", means: "Chances he should have scored and missed.", group: "attacking", mark: "low" },
  { key: "xa", from: { expected: "xa" }, label: "xA", title: "Expected assists", means: "What the chances he made were worth, scored or not.", group: "creating" },
  { key: "kp", from: { count: "keyPasses" }, label: "KP", title: "Key passes", means: "Passes that led to a team-mate's shot.", group: "creating" },
  { key: "bcc", from: { count: "bigChancesCreated" }, label: "BCC", title: "Big chances created", means: "Passes that left a team-mate a chance he should score.", group: "creating" },
  { key: "cr", from: { count: "crosses" }, label: "Crs", title: "Crosses", means: "Balls played in from a wide area.", group: "creating" },
  { key: "ac", from: { count: "accurateCrosses" }, label: "AC", title: "Accurate crosses", means: "Crosses that found a team-mate.", group: "creating" },
  { key: "tkl", from: { count: "tacklesWon" }, label: "Tkl", title: "Tackles won", means: "Tackles that won his side the ball.", group: "defensive" },
  { key: "int", from: { count: "interceptions" }, label: "Int", title: "Interceptions", means: "Opponents' passes he cut out.", group: "defensive" },
  { key: "blk", from: { count: "blocks" }, label: "Blk", title: "Blocks", means: "Opponents' shots he blocked.", group: "defensive" },
  { key: "clr", from: { count: "clearances" }, label: "Clr", title: "Clearances", means: "Times he put the ball away from danger.", group: "defensive" },
  { key: "rec", from: { count: "recoveries" }, label: "Rec", title: "Recoveries", means: "Loose balls he won back.", group: "defensive" },
  { key: "aw", from: { count: "aerialsWon" }, label: "AW", title: "Aerials won", means: "Headers he won against an opponent.", group: "defensive" },
  { key: "xgc", from: { expected: "xgc" }, label: "xGC", title: "Expected goals conceded", means: "Goals his side were expected to concede while he was on the pitch.", group: "defensive", mark: "low" },
];

/** The bag key of each kind of figure, and of the minutes each kind's rate divides by. */
const bagKey = (from: From) => ("count" in from ? `season ${from.count}` : `expected ${from.expected}`);
const SEASON_MINUTES = "season minutes";
const EXPECTED_MINUTES = "expected minutes";

export const SEASON_COLUMNS: PoolColumn[] = SEASON_STATS.map((entry) => ({
  key: entry.key,
  label: entry.label,
  title: entry.title,
  means: entry.means,
  group: entry.group,
  mark: entry.mark ?? "high",
  rate: true,
  // Each kind's own minutes, so a rate never divides its figures by a read a match ahead of them.
  minutes: "count" in entry.from ? SEASON_MINUTES : EXPECTED_MINUTES,
  ascending: false,
  ...("expected" in entry.from ? { places: "expected" as const } : {}),
  value: (_row, stats) => stats?.[bagKey(entry.from)] ?? null,
}));

/** The columns off the stats league's daily file, which the board's "Season to" line dates. */
export const DAILY_COLUMNS: readonly PoolColumn[] = SEASON_COLUMNS.filter((column) => column.minutes === SEASON_MINUTES);

/** His stats league season keyed for the bag; nothing for a man the file does not hold, so every cell dashes. */
export function seasonStats(row: StatsRow | undefined): Record<string, number | null> {
  if (row === undefined) return {};
  const counts = SEASON_STATS.flatMap((entry) => ("count" in entry.from ? [entry.from.count] : []));
  return {
    ...Object.fromEntries(counts.map((key) => [bagKey({ count: key }), key === "blocks" ? blocks(row) : stat(row, key)])),
    [SEASON_MINUTES]: stat(row, "minutes"),
  };
}

/** His expected figures keyed for the bag; nothing for a man who has not played, whose noughts are no reading. */
export function expectedStats(player: FootballPlayer | undefined): Record<string, number | null> {
  if (player === undefined || player.season.minutes <= 0) return {};
  const { expectedGoals: xg, expectedAssists: xa, expectedGoalsConceded: xgc, minutes } = player.season;
  const figures = { xg, xa, xgi: xg + xa, xgc };
  return {
    ...Object.fromEntries(Object.entries(figures).map(([key, value]) => [`expected ${key}`, value])),
    [EXPECTED_MINUTES]: minutes,
  };
}
