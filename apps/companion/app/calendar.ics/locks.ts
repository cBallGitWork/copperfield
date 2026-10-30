import {
  type GameweekKickoff,
  type LeaguePeriod,
  LEAGUE_TIMEZONE,
  MS_PER_MINUTE,
  firstKickoff,
  londonDayOf,
  wallClockInstant,
  openingGameweek,
  periodGameweeks,
  periodLock,
} from "@epl/core";
import type { CalendarEvent } from "./ics";

// The line-up locks still ahead, as calendar events: the same lock Mail and the Team tab print.

/** Where the feed is served. */
export const CALENDAR_FEED = "/calendar.ics";

/** Minutes before a lock its alarm sounds. */
export const LOCK_ALARM_MINUTES = 60;

/** The London hour of lock day's morning alarm. */
export const MORNING_ALARM_HOUR = 9;

/** How often a subscriber fetches again, and how long the feed is cached. */
export const FEED_REFRESH_HOURS = 3;

/** The feed's Cache-Control: a browser and the CDN both hold it for `FEED_REFRESH_HOURS`. */
export const FEED_CACHE = `public, max-age=${FEED_REFRESH_HOURS * 3600}, s-maxage=${FEED_REFRESH_HOURS * 3600}`;

/** One event per gameweek whose lock is still ahead, from the lock to the first ball, in time order. Keyed by
 *  period and league, so a moved kickoff moves its event; a blank period, with no football, has none. */
export function lockEvents(
  periods: readonly LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
  nowIso: string,
  leagueId: string,
  url: string,
): CalendarEvent[] {
  const now = Date.parse(nowIso);
  const calendar = periodGameweeks([...periods], [...kickoffs]);
  return periods
    .flatMap((period) => {
      const kickoff = firstKickoff(period, kickoffs);
      const lock = periodLock(period, kickoffs);
      const gameweek = openingGameweek(calendar, period.number);
      if (kickoff === null || lock === null || gameweek === undefined || !(Date.parse(lock) > now)) return [];
      return [{
        uid: `lock-${period.number}-${leagueId}`,
        title: `Gameweek ${gameweek} line-ups lock`,
        at: lock,
        end: kickoff,
        url,
        alarms: alarmsFor(lock),
      }];
    })
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** The hour-before alarm, then 09:00 London on lock day, in minutes before the lock; the morning one only when it
 *  falls before the hour-before one, so a lock before 10:00 has one alarm. Per lock, so a clock change is honoured. */
export function alarmsFor(lockIso: string): number[] {
  const day = londonDayOf(lockIso);
  if (day === null) return [LOCK_ALARM_MINUTES];
  const hour = String(MORNING_ALARM_HOUR).padStart(2, "0");
  const morning = wallClockInstant(Date.parse(`${day}T${hour}:00:00Z`), LEAGUE_TIMEZONE);
  const before = Math.round((Date.parse(lockIso) - morning) / MS_PER_MINUTE);
  return before > LOCK_ALARM_MINUTES ? [LOCK_ALARM_MINUTES, before] : [LOCK_ALARM_MINUTES];
}

/** The feed's two addresses: `webcal:` for a phone to subscribe, `https:` for a calendar that asks for one. */
export function feedAddresses(origin: string): { webcal: string; https: string } {
  const https = new URL(CALENDAR_FEED, origin).toString();
  return { webcal: https.replace(/^https?:/, "webcal:"), https };
}
