import { DEFCON, byPositionDepth, paidAt, wordsFor, type LeagueInfo, type LeagueScoring, type ScoringRules } from "@epl/core";
import { defConHead, defconGroups } from "./matchday/leaders";
import { positionsLabel } from "./positions";

// DefCon's counts named by who the league pays on each (Craig, 24 Oct 2026: "DC and DC+ means nothing").

/** One DefCon count's head, name and key line. */
export interface DefConWords {
  head: string;
  name: string;
  key: string;
}

/** Each DefCon count the league pays at these positions, by Fantrax code: "DefCon DEF" and "DefCon M/F", headed "DC D"
 *  and "DC MF" so a phone's column stays narrow (Craig, 24 Oct 2026). */
export function defConWords(scoring: LeagueScoring | null, positions: readonly string[]): ReadonlyMap<string, DefConWords> {
  if (scoring === null) return new Map();
  return new Map(
    defconGroups(scoring, positions).map(({ category, positions: paid }) => {
      const name = `DefCon ${positionsLabel(paid) ?? ""}`.trim();
      const counted = DEFCON.find((each) => each.short === category);
      const what = counted === undefined ? undefined : wordsFor(counted).key.split(": ")[1];
      return [category, { head: defConHead(paid), name, key: what === undefined ? name : `${name}: ${what}` }];
    }),
  );
}

/** `defConWords` off getLeagueInfo: its scoring and its roster's positions; none where its scoring is unread. */
export function leagueDefConWords(info: Pick<LeagueInfo, "scoring" | "scoringCategories" | "roster"> | null): ReadonlyMap<string, DefConWords> {
  if (!info?.scoring) return new Map();
  const positions = Object.keys(info.roster.maxActiveByPosition).sort(byPositionDepth);
  return defConWords({ rules: info.scoring, categories: info.scoringCategories }, positions);
}

/** A DefCon count's static name (`wordsFor`) mapped to the league's, for a list built off the static words. */
export function defConRenames(words: ReadonlyMap<string, DefConWords>): ReadonlyMap<string, DefConWords> {
  return new Map(DEFCON.flatMap((category) => {
    const named = words.get(category.short);
    return named === undefined ? [] : [[wordsFor(category).name, named] as const];
  }));
}

/** The DefCon counts a man is paid on at any of his positions, by Fantrax code: a defender's not the M/F count
 *  (Craig, 24 Oct 2026). Every count where the scoring is unread. */
export function ownDefCon(rules: ScoringRules | null, positions: readonly string[]): ReadonlySet<string> {
  return new Set(DEFCON.filter((category) => rules === null || paidAt(rules, [category.short], positions)).map((each) => each.short));
}
