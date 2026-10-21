import type { LeagueOpinion } from "./leagueOpinions";

/** Every holding team, id to name, from our league's view: the names a holder tag shortens. */
export function teamNamesOf(league: ReadonlyMap<number, LeagueOpinion>): Map<string, string> {
  const names = new Map<string, string>();
  for (const { ownerTeamId, owner } of league.values()) {
    if (ownerTeamId !== null && owner !== null) names.set(ownerTeamId, owner);
  }
  return names;
}

/** What a Prem row needs to tag a man's holder: our league's view, its team names, and whose eyes read it. */
export interface Holders {
  league: ReadonlyMap<number, LeagueOpinion>;
  teamNames: ReadonlyMap<string, string>;
  reader: string | null;
}

export function holdersOf(league: ReadonlyMap<number, LeagueOpinion>, reader: string | null): Holders {
  return { league, teamNames: teamNamesOf(league), reader };
}
