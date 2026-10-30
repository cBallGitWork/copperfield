import {
  FANTRAX_LEAGUE_ID,
  type LeagueInfo,
  type PeriodGameweeks,
  fetchLeagueInfo,
  leagueLimits,
  mapLeagueInfo,
  openingGameweek,
  periodGameweeks,
  periodOfGameweek,
  lastLockedPeriod,
  planningPeriod,
} from "@epl/core";
import { now } from "./clock";
import { leagueCache } from "./leagueCache";
import { type Unavailable, refusedAs, unavailable } from "./refusals";
import { seasonKickoffs } from "./football";
import limits from "../../../data/leagues/roster-limits.json";

// The competition's own description of itself, and which round of it a screen is about.
// Nothing here reads a roster: `squads.ts` imports this module, never the reverse.

/** Its key is new, as "league-info" and "schedule-info" held other shapes. */
const described = leagueCache("league-described",
  (): Promise<LeagueInfo | Unavailable> => refusedAs(fetchLeagueInfo(FANTRAX_LEAGUE_ID), unavailable, mapLeagueInfo),
  unavailable,
);

/** The competition's own description of itself, its roster carrying the formation floors on record, or its refusal
 *  with the tell: one read for every reader of the served league. Floors join outside the cache, so no entry lacks them. */
export async function leagueOrRefusal(): Promise<LeagueInfo | Unavailable> {
  const info = await described();
  return "unavailable" in info ? info : { ...info, roster: leagueLimits(info.roster, limits, FANTRAX_LEAGUE_ID) };
}

/** The same, or null when Fantrax refuses: no calendar then, so squads only, never an XI we cannot prove may be shown.
 *  No cache of its own, so it nests in none. */
export async function leagueInfo(): Promise<LeagueInfo | null> {
  const info = await leagueOrRefusal();
  return "unavailable" in info ? null : info;
}

/** A round other than Fantrax's current one: the gameweek asks FPL, the period asks Fantrax. */
export interface Round {
  gameweek: number;
  period: number;
}

/** Each Fantrax period with the gameweeks it scores. Read, never assumed: a postponement is how the two come apart.
 *  Worked out from two cached reads, never cached itself: one nested inside a cache skips its own and goes live. */
export async function readCalendar(): Promise<PeriodGameweeks[]> {
  const [info, kickoffs] = await Promise.all([leagueInfo(), seasonKickoffs()]);
  return info === null ? [] : periodGameweeks(info.scoringPeriods, kickoffs);
}

/** The first round whose lineups have not locked (mid-weekend, next week's), for the squad screens.
 *  The boards and the paper want the round being played, `getLeagueSquads()`'s default.
 *  Null means "whatever Fantrax considers open". */
export async function planningRound(): Promise<Round | null> {
  const [info, kickoffs, calendar] = await Promise.all([
    leagueInfo(),
    seasonKickoffs(),
    readCalendar(),
  ]);
  if (info === null) return null;

  // `rosterPeriods`, not `scoringPeriods`: the lineup calendar says when a week locks.
  const period = planningPeriod(info.rosterPeriods, kickoffs, now().toISOString());
  if (period === null) return null;

  const gameweek = openingGameweek(calendar, period);
  return gameweek === undefined ? null : { gameweek, period };
}

/** The last round whose lineups have locked; the planning round before the season's first lock. */
export async function lastLockedRound(): Promise<Round | null> {
  const [info, kickoffs, calendar] = await Promise.all([
    leagueInfo(),
    seasonKickoffs(),
    readCalendar(),
  ]);
  if (info === null) return null;

  const period = lastLockedPeriod(info.rosterPeriods, kickoffs, now().toISOString());
  if (period === null) return planningRound();

  const gameweek = openingGameweek(calendar, period);
  return gameweek === undefined ? planningRound() : { gameweek, period };
}

export async function roundOf(gameweek: number): Promise<Round | null> {
  const found = periodOfGameweek(await readCalendar(), gameweek);
  return found === undefined ? null : { gameweek, period: found.period };
}
