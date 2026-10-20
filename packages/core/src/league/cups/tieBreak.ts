import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  GOALS,
  RED_CARDS,
  YELLOW_CARDS,
  firstScored,
  idsOf,
  type FantraxCategory,
} from "../categoryNames";
import { numeric } from "../fantrax/stats";
import type { LivePlayerCategory } from "../points";
import type { ScoringCategory } from "../scoring";

// A cup tie level on points, settled by Craig's order (19 Oct 2026): goals, assists, clean sheets, fewer cards, a coin toss.

/** What one side's counted men did in the tie's gameweek, by the league's own categories. */
export interface TieTally {
  goals: number;
  assists: number;
  cleanSheets: number;
  /** Yellows plus reds, each card once. */
  cards: number;
}

export type TieStep = "points" | "goals" | "assists" | "cleanSheets" | "cards" | "toss";

/** The tie-break in order, in the words the rules and the tie print. */
export const CUP_TIE_STEPS: readonly { step: Exclude<TieStep, "points">; rule: string; through: string }[] = [
  { step: "goals", rule: "More goals scored", through: "Through on goals scored" },
  { step: "assists", rule: "More assists", through: "Through on assists" },
  { step: "cleanSheets", rule: "More clean sheets", through: "Through on clean sheets" },
  { step: "cards", rule: "Fewer cards, a red counting as one, like a yellow", through: "Through on fewer cards" },
  { step: "toss", rule: "The toss of a coin", through: "Through on the toss of a coin" },
];

/** One side of a tie: its points (null until scored) and its counted men's tally. */
export interface CupTieSide {
  teamId: string;
  points: number | null;
  tally: TieTally;
}

/** Sums each counted man's `counts` (live scoring's ACTIVE rows); a category the league does not score counts nought. */
export function tieTally(
  men: readonly (readonly LivePlayerCategory[])[],
  categories: Record<string, ScoringCategory>,
): TieTally {
  const count = (wanted: readonly FantraxCategory[]) => {
    const ids = idsOf(categories, wanted);
    return men.flat().reduce((sum, row) => sum + (ids.has(row.category) ? (numeric(row.value ?? undefined) ?? 0) : 0), 0);
  };
  // AT is A plus AF, so a league scoring AT is never summed with them.
  const assists = firstScored(categories, [ASSISTS_TOTAL]) ? [ASSISTS_TOTAL] : [ASSISTS_OFFICIAL, ASSISTS_FANTASY];
  return {
    goals: count([GOALS]),
    assists: count(assists),
    cleanSheets: count([CLEAN_SHEETS]),
    cards: count([YELLOW_CARDS, RED_CARDS]),
  };
}

/** Who goes through and on which step; null until both sides are scored. */
export function decideTie(
  home: CupTieSide,
  away: CupTieSide,
  draw: { cupId: string; gameweek: number },
): { winner: string; step: TieStep } | null {
  if (home.points === null || away.points === null) return null;
  // Fantrax's points carry decimals; compared in hundredths so 0.1 + 0.2 draws with 0.3.
  const gap = Math.round(home.points * 100) - Math.round(away.points * 100);
  if (gap !== 0) return { winner: gap > 0 ? home.teamId : away.teamId, step: "points" };

  for (const { step } of CUP_TIE_STEPS) {
    if (step === "toss") break;
    const ours = home.tally[step];
    const theirs = away.tally[step];
    if (ours === theirs) continue;
    const homeAhead = step === "cards" ? ours < theirs : ours > theirs;
    return { winner: homeAhead ? home.teamId : away.teamId, step };
  }
  return { winner: coinToss(home.teamId, away.teamId, draw), step: "toss" };
}

/** A fair, repeatable coin: FNV-1a over the cup, both team ids in sorted order and the gameweek, mixed by MurmurHash3's
 *  finaliser, so every reader sees the same winner and home or away makes no difference. */
export function coinToss(a: string, b: string, draw: { cupId: string; gameweek: number }): string {
  const [low, high] = a < b ? [a, b] : [b, a];
  let hash = 0x811c9dc5;
  for (const char of `${draw.cupId}|${low}|${high}|${draw.gameweek}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
  }
  // FNV's low bit is only the characters' parity, so the finaliser spreads every bit into the top one.
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 31 === 0 ? low : high;
}

/** What the tie prints under its score: which step put the winner through; nothing when points did. */
export function throughOn(step: TieStep): string | null {
  return CUP_TIE_STEPS.find((each) => each.step === step)?.through ?? null;
}
