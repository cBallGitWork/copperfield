import { MS_PER_DAY, londonDay, londonDayAndDate, londonDayAndTime, londonDayOf } from "@epl/core";

/** The London days a weekday names alone: a week back, "Mon" would read as today. */
const WEEKDAY_REACH = 6;

/** A story's filing as its dateline prints it: `Sun 20:07` within the week, else `Mon 5 Oct`. */
export function filedWhen(filedAt: string, now: Date): string {
  const filed = londonDayOf(filedAt);
  const days = filed === null ? null : (Date.parse(londonDay(now)) - Date.parse(filed)) / MS_PER_DAY;
  return days !== null && days <= WEEKDAY_REACH ? londonDayAndTime(filedAt) : londonDayAndDate(filedAt);
}
