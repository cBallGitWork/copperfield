import type { MatchParts } from "../football/premierleague/playerMatch";
import { ASSISTS_FANTASY, ASSISTS_TOTAL, KEEPER_POINTS, meaningOf, type FantraxCategory } from "../league/categoryNames";
import { priceOf, type LeagueScoring } from "../league/scoring";
import { isGoalkeeper } from "./lineup";

// A player card's "Full match stats", all Opta's: the parts of a category Fantrax counts whole, then his attacking and
// his defending, priced or not. What Fantrax counts itself is its own, in the card's "This gameweek".

/** One figure on the card. */
interface StatRow {
  key: string;
  label: string;
  value: number;
}

/** A part Opta splits out of a category Fantrax counts whole. */
interface Stat {
  key: keyof MatchParts;
  label: string;
  /** The categories it is part of; the league must price one of them at his position for it to show. */
  feeds: readonly FantraxCategory[];
}

const STATS: readonly Stat[] = [
  // A won penalty is a fantasy assist, which Assists (Total) counts with the official ones.
  { key: "penaltiesWon", label: "Penalties won", feeds: [ASSISTS_TOTAL, ASSISTS_FANTASY] },
  // Keeper points count all four; a league paying saves on their own counts them itself.
  { key: "saves", label: "Saves", feeds: [KEEPER_POINTS] },
  { key: "smothers", label: "Smothers", feeds: [KEEPER_POINTS] },
  { key: "punches", label: "Punches", feeds: [KEEPER_POINTS] },
  { key: "highClaims", label: "High claims", feeds: [KEEPER_POINTS] },
];

/** The rows the league prices at any of his positions ("M/F" is two), by key; null with no scoring or no position. */
export function scoredStats(scoring: LeagueScoring | null, position: string | null): string[] | null {
  const positions = position?.split(/[^A-Z]+/).filter(Boolean) ?? [];
  if (scoring === null || positions.length === 0) return null;
  const pays = (category: FantraxCategory) =>
    Object.values(scoring.categories).some(
      (scored) =>
        meaningOf(scored, [category]) !== null &&
        positions.some((letter) => {
          const price = priceOf(scoring.rules, scored.code, letter);
          return typeof price === "number" ? price !== 0 : (price?.bands.some((band) => band.points !== 0) ?? false);
        }),
    );
  return STATS.filter((stat) => stat.feeds.some(pays)).map((stat) => stat.key);
}

/** His rows the league scores, every one when `scored` is null; none until Opta has a line for him. */
export function fullMatchStats(parts: MatchParts | null, scored: readonly string[] | null): StatRow[] {
  if (parts === null) return [];
  return STATS.filter((stat) => scored === null || scored.includes(stat.key)).map(({ key, label }) => ({
    key,
    label,
    value: parts[key],
  }));
}

/** One attacking figure; `of` is what he tried where the figure is what came off, "2/3". */
interface AttackingRow {
  key: keyof MatchParts;
  label: string;
  value: number;
  of: number | null;
}

/** Read down the left column, his shooting, then the right, his making. */
const ATTACKING: readonly { key: keyof MatchParts; label: string; made?: keyof MatchParts }[] = [
  { key: "shots", label: "Shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "bigChancesMissed", label: "Big chances missed" },
  { key: "touchesInBox", label: "Touches in the box" },
  { key: "chancesCreated", label: "Chances created" },
  { key: "bigChancesCreated", label: "Big chances created" },
  { key: "crosses", label: "Accurate crosses", made: "accurateCrosses" },
  { key: "contests", label: "Dribbles won", made: "contestsWon" },
];

/** His attacking off Opta's line, priced or not; none for a keeper or a man Opta has no line for. */
export function attackingStats(parts: MatchParts | null, position: string | null): AttackingRow[] {
  if (parts === null || isGoalkeeper(position)) return [];
  return ATTACKING.map(({ key, label, made }) =>
    made === undefined ? { key, label, value: parts[key], of: null } : { key, label, value: parts[made], of: parts[key] },
  );
}

/** Read down the left column, his winning the ball, then the right, his clearing up: DefCon's parts, every one shown. */
const DEFENSIVE: readonly { key: keyof MatchParts; label: string }[] = [
  { key: "tacklesWon", label: "Tackles won" },
  { key: "interceptions", label: "Interceptions" },
  { key: "blocks", label: "Blocks" },
  { key: "clearances", label: "Clearances" },
  { key: "recoveries", label: "Recoveries" },
  { key: "aerialsWon", label: "Aerials won" },
];

/** His defending off Opta's line, priced or not; none for a keeper or a man Opta has no line for. */
export function defensiveStats(parts: MatchParts | null, position: string | null): StatRow[] {
  if (parts === null || isGoalkeeper(position)) return [];
  return DEFENSIVE.map(({ key, label }) => ({ key, label, value: parts[key] }));
}
