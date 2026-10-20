import {
  FANTRAX_LEAGUE_ID,
  fetchSeasonCodes,
  fetchTeamStats,
  mapPoolStats,
  mapTeamStats,
} from "@epl/core";
import type { TeamStats } from "@epl/core";
import { leagueRead } from "./leagueCache";
import { SEASON_CODE_LIFE } from "./config";

// One team's season table, read once for its two readers: two caches on one key would be two definitions of it.

/** The season code: Fantrax defaults every stat read to a projection, and one endpoint publishes it. Cached hard. */
const yearToDate = leagueRead(
  "fantrax-season-code",
  () => fetchSeasonCodes(FANTRAX_LEAGUE_ID),
  // No code is no reason to compose one: Fantrax picks, and the callers label it. Only a refusal is caught.
  (raw): string | undefined => mapPoolStats(raw).yearToDate ?? undefined,
  () => undefined,
  SEASON_CODE_LIFE,
);

/** One team's table, or nothing: a refusal (an undrafted league's `WARNING`) and an outage both
 *  mean there are no numbers to show, and both say so by not appearing. */
const readTeamStats = leagueRead("fantrax-team-stats",
  (teamId: string, season: string | undefined) => fetchTeamStats(FANTRAX_LEAGUE_ID, teamId, season),
  (raw): TeamStats => mapTeamStats(raw),
  () => null,
);

/** One squad's season table and its points by player, off one read. A season total: the endpoint ignores a period. */
export async function squadSeason(teamId: string): Promise<SquadSeason | null> {
  const stats = await readTeamStats(teamId, await yearToDate());
  if (stats === null) return null;

  return {
    stats,
    points: new Map(
      stats.groups.flatMap((group) => group.lines.map((line) => [line.fantraxId, line.points])),
    ),
  };
}

export interface SquadSeason {
  /** Fantrax's own table: the season, and a group per scoring vocabulary, keepers apart. */
  stats: TeamStats;
  /** The same lines by player; null is null, never nought. */
  points: Map<string, number | null>;
}
