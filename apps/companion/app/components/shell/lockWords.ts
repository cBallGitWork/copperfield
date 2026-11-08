import { londonDayAndTime, londonDayOf, londonTime } from "@epl/core";

// The rail's deadline plate: the lock's time alone on its own London day, its weekday too before then.

/** `locks 11:00` on the day of the lock, `locks Sat 11:00` before it; null with no lock ahead. */
export function lockWords(lock: string | null, now: string): string | null {
  if (lock === null) return null;
  return `locks ${londonDayOf(lock) === londonDayOf(now) ? londonTime(lock) : londonDayAndTime(lock)}`;
}
