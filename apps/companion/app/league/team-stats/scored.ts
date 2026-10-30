import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFCON,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  paidAt,
  type FantraxCategory,
  type ScoringRules,
  type StatCategory,
} from "@epl/core";

// The board's FPts columns the league pays at some position: a category priced at nought everywhere is a column of noughts.

/** Each category the board offers by its key (Fantrax's caption), as the scoring table's codes; goals against
 *  is the keeper's GA and the outfielder's GAO on one line (`mapSeasonStats`). */
const CODES: ReadonlyMap<string, readonly FantraxCategory[]> = new Map(
  [
    MINUTES, GOALS, ASSISTS_TOTAL, ASSISTS_OFFICIAL, ASSISTS_FANTASY, CLEAN_SHEETS, ...DEFCON,
    SAVES, KEEPER_POINTS, PENALTY_SAVES, YELLOW_CARDS, RED_CARDS, PENALTIES_MISSED, OWN_GOALS,
  ]
    .map((category): [string, readonly FantraxCategory[]] => [category.caption, [category]])
    .concat([[GOALS_AGAINST.caption, [GOALS_AGAINST, GOALS_AGAINST_OUTFIELD]]]),
);

/** The scoring codes behind a board category; none for one this list does not know, which is kept. */
export function codesOf(category: StatCategory): readonly string[] {
  return (CODES.get(category.key) ?? []).map((each) => each.short);
}

/** The categories the league pays at any of its positions; all of them where its scoring is unread. */
export function scoredIn(categories: readonly StatCategory[], rules: ScoringRules | null, positions: readonly string[]): StatCategory[] {
  if (rules === null) return [...categories];
  return categories.filter((category) => {
    const codes = codesOf(category);
    return codes.length === 0 || paidAt(rules, codes, positions);
  });
}
