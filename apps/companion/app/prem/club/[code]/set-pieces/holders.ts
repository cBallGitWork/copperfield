import type { LeagueOpinion } from "../../../leagueOpinions";

/** Every holding team, id to name, from our league's view: the names a holder tag shortens. */
export function teamNamesOf(league: ReadonlyMap<number, LeagueOpinion>): Map<string, string> {
  const names = new Map<string, string>();
  for (const { ownerTeamId, owner } of league.values()) {
    if (ownerTeamId !== null && owner !== null) names.set(ownerTeamId, owner);
  }
  return names;
}
