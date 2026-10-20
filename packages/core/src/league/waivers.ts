import type { WaiverSchedule } from "./types";
import { MS_PER_DAY, MS_PER_MINUTE, instantOf, wallClockInstant } from "../time";

// When the league's waiver claims next run, and how long until then. A run day is a day claims CAN resolve, not a
// promise that any are waiting. Pure: `now` is passed in.

/** The next `count` runs after `now`, as ISO instants, each placed by its own date's offset in the schedule's zone. */
export function upcomingRuns(schedule: WaiverSchedule, now: string, count: number): string[] {
  const at = instantOf(now);
  if (at === null || schedule.weekdays.length === 0) return [];

  // A day early, so a zone behind UTC still has its own today in the walk.
  const from = new Date(at - MS_PER_DAY);
  const runs: string[] = [];
  for (let day = 0; runs.length < count && day <= 7 * count + 1; day += 1) {
    const wall = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + day, schedule.hour, schedule.minute);
    // The wall clock read as UTC: its UTC weekday is the zone's.
    if (!schedule.weekdays.includes(new Date(wall).getUTCDay())) continue;
    const instant = wallClockInstant(wall, schedule.timeZone);
    if (instant > at) runs.push(new Date(instant).toISOString());
  }
  return runs;
}

/** The first of `runs` still to come at `now` (ms), with the milliseconds left; null when none is. */
export function nextRun(runs: readonly string[], now: number): { at: string; left: number } | null {
  for (const run of runs) {
    const at = instantOf(run);
    if (at !== null && at > now) return { at: run, left: at - now };
  }
  return null;
}

const MINUTES_PER_DAY = MS_PER_DAY / MS_PER_MINUTE;

/** `2d 4h`, `5h 12m`, `18h`, `12m`: time left, rounded up to the minute so the last one never reads nought. */
export function timeLeft(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MS_PER_MINUTE));
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  const hours = Math.floor((minutes % MINUTES_PER_DAY) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours === 0) return `${minutes}m`;
  return minutes % 60 === 0 ? `${hours}h` : `${hours}h ${minutes % 60}m`;
}
