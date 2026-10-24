import { DEFCON, byPositionDepth, wordsFor, type LeagueInfo, type LeagueScoring } from "@epl/core";
import { defconGroups } from "./matchday/leaders";
import { positionsLabel } from "./positions";

// DefCon's counts named by who the league pays on each (Craig, 24 Oct 2026: "DC and DC+ means nothing").

/** One DefCon count's head, name and key line. */
export interface DefConWords {
  head: string;
  name: string;
  key: string;
}

/** Each DefCon count the league pays at these positions, by Fantrax code: "DefCon DEF", "DefCon M/F". */
export function defConWords(scoring: LeagueScoring | null, positions: readonly string[]): ReadonlyMap<string, DefConWords> {
  if (scoring === null) return new Map();
  return new Map(
    defconGroups(scoring, positions).map(({ category, positions: paid }) => {
      const name = `DefCon ${positionsLabel(paid) ?? ""}`.trim();
      const counted = DEFCON.find((each) => each.short === category);
      const what = counted === undefined ? undefined : wordsFor(counted).key.split(": ")[1];
      return [category, { head: name, name, key: what === undefined ? name : `${name}: ${what}` }];
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
