import { MS_PER_DAY, MS_PER_MINUTE, nextRun, ordinal, timeLeft } from "@epl/core";
import { WAIVER_BANNER_HOURS } from "../../config";

// The waiver banner's words. A run day is a day claims can resolve, so it says when the run is, never what is waiting.

/** The banner's parts: "Waivers run" `in 5h 12m` "· you're 9th". */
export interface BannerWords {
  /** `in 5h 12m`; before the window there are no words, never the run's day and time. */
  when: string;
  /** `you're 9th`, or null when the reader has no place. */
  place: string | null;
}

/** The runs in the week after `next`, which a weekday alone names without a doubt: `Thu 18:00 · Fri 18:00`. */
export function runsAfter(runs: readonly string[], next: string): string[] {
  const from = Date.parse(next);
  return runs.filter((run) => {
    const gap = Date.parse(run) - from;
    return gap > 0 && gap < MS_PER_DAY * 7;
  });
}

/** The words at `now` (ms): under `WAIVER_BANNER_HOURS` to the next run; else null. */
export function bannerWords(runs: readonly string[], now: number, place: number | null): BannerWords | null {
  const next = nextRun(runs, now);
  if (next === null || next.left > WAIVER_BANNER_HOURS * 60 * MS_PER_MINUTE) return null;
  return { when: `in ${timeLeft(next.left)}`, place: place === null ? null : `you're ${ordinal(place)}` };
}
