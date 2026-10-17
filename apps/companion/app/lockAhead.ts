import { gameweekLock } from "@epl/core";
import { now } from "./clock";
import { seasonKickoffs } from "./football";
import { leagueInfo } from "./round";

// The league's lineup lock for one gameweek, read here so a football screen takes it as plain data.

/** When a gameweek's lineups lock, while that is still ahead; null once it has passed or with no league to ask. */
export async function lockAhead(gameweek: number): Promise<string | null> {
  const [info, kickoffs] = await Promise.all([leagueInfo(), seasonKickoffs()]);
  if (info === null) return null;
  const lock = gameweekLock(info.rosterPeriods, kickoffs, gameweek);
  return lock !== null && Date.parse(lock) > now().getTime() ? lock : null;
}
