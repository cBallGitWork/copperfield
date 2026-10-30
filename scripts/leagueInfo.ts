import { FANTRAX_LEAGUE_ID, fetchLeagueInfo, leagueLimits, mapLeagueInfo, type LeagueInfo } from "@epl/core";
import limits from "../data/leagues/roster-limits.json";

/** The served league as Fantrax describes it, its roster carrying the formation floors on record. */
export async function readLeagueInfo(): Promise<LeagueInfo> {
  const info = mapLeagueInfo(await fetchLeagueInfo(FANTRAX_LEAGUE_ID));
  return { ...info, roster: leagueLimits(info.roster, limits, FANTRAX_LEAGUE_ID) };
}
