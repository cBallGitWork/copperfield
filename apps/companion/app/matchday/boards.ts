import {
  FANTRAX_LEAGUE_ID,
  POOL_PAGE_SIZE,
  type FootballSnapshot,
  type PlayerMatchStats,
  fetchPoolStats,
  fplCodeOf,
  mapPoolStats,
} from "@epl/core";
import { LEADERS_SHOWN } from "../config";
import { seasonKickoffs } from "../football";
import { leagueRead } from "../leagueCache";
import { getLeaguePool } from "../players/pool";
import { playerHref } from "../players/routes";
import { periodPoints } from "../scoreboard";
import { leagueScoring } from "../scoring";
import { bridge } from "../squads";
import { statsLeagueGameweek } from "../statsLeague";
import { now } from "../clock";
import { type Listed, type TopBoard, defconCounts, defconGroups, defconSeats, gameweekLeaders } from "./leaders";

// The Top stats view's reads, kept out of the page: each is cached, and only this view asks for them.

/** Fantrax's points for the whole pool in one period, free agents included, as entries for the cache. */
const poolPeriodPoints = leagueRead(
  "pool-period-points",
  (period: number) => fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE, undefined, undefined, period),
  (raw) => mapPoolStats(raw).rows.flatMap((row): [string, number][] => (row.points === null ? [] : [[row.fantraxId, row.points]])),
  (): [string, number][] => [],
);

/** The gameweek's lists and the team names their brackets print; `period` is the served league's for this
 *  gameweek, null when it has none. */
export async function gameweekBoards(
  snapshot: FootballSnapshot,
  stats: readonly PlayerMatchStats[],
  period: number | null,
): Promise<{ boards: TopBoard[]; teamNames: ReadonlyMap<string, string> }> {
  const [priced, pooled, pool, scoring, kickoffs] = await Promise.all([
    period === null ? new Map<string, number>() : periodPoints(period),
    period === null ? [] : poolPeriodPoints(period),
    getLeaguePool(),
    leagueScoring(),
    seasonKickoffs(),
  ]);
  const held = "unavailable" in pool ? null : pool;
  const entries = (held?.rows ?? []).map((row) => row.entry);

  // The DefCon count at each group of positions the league counts alike, in its own pitch order; none when it counts none.
  const groups = scoring === null ? [] : defconGroups(scoring, held?.positions ?? []);
  const codes = groups.map((group) => group.category);
  const lines = codes.length === 0 ? null : await statsLeagueGameweek(codes, snapshot.gameweek, kickoffs, now());
  const defcon =
    lines === null
      ? []
      : groups.map((group) => ({ ...group, counts: defconCounts(lines, defconSeats(entries, group.positions), group.category) }));

  const listed = new Map<number, Listed>();
  for (const row of held?.rows ?? []) {
    if (row.fplCode === null) continue;
    const { player, ownerTeamId, status } = row.entry;
    listed.set(row.fplCode, { fantraxId: player.fantraxId, held: { ownerTeamId, status } });
  }

  const boards = gameweekLeaders({
    snapshot,
    stats,
    priced,
    pooled: new Map(pooled),
    defcon,
    codeOf: (fantraxId) => fplCodeOf(bridge, fantraxId),
    listed,
    hrefOf: playerHref,
    shown: LEADERS_SHOWN,
  });
  return { boards, teamNames: held?.teamNames ?? new Map() };
}
