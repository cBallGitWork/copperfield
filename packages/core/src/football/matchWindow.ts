import { londonDay, MS_PER_MINUTE } from "../time";

/** Minutes either side of a London day's football that its window reaches: before the first kickoff, after the last. */
export interface MatchWindow {
  leadMinutes: number;
  tailMinutes: number;
}

/** Whether `at` falls in a match window: from `leadMinutes` before a London day's first kickoff to `tailMinutes` after
 *  its last, so the gaps between one day's kickoffs stay open. An unreadable kickoff opens nothing. */
export function inMatchWindow(kickoffs: readonly string[], at: string, window: MatchWindow): boolean {
  return secondsToWindow(kickoffs, at, window) === 0;
}

/** Seconds until a match window opens: nought inside one, null with none ahead or a clock that cannot be read. */
export function secondsToWindow(kickoffs: readonly string[], at: string, window: MatchWindow): number | null {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return null;
  let soonest: number | null = null;
  for (const { first, last } of matchDays(kickoffs)) {
    const opens = first - window.leadMinutes * MS_PER_MINUTE;
    if (now > last + window.tailMinutes * MS_PER_MINUTE) continue;
    if (now >= opens) return 0;
    soonest = soonest === null ? opens : Math.min(soonest, opens);
  }
  return soonest === null ? null : Math.ceil((soonest - now) / 1000);
}

/** Each London day's first and last kickoff. */
function matchDays(kickoffs: readonly string[]): { first: number; last: number }[] {
  const days = new Map<string, { first: number; last: number }>();
  for (const kickoff of kickoffs) {
    const time = Date.parse(kickoff);
    if (Number.isNaN(time)) continue;
    const day = londonDay(new Date(time));
    const held = days.get(day);
    days.set(day, held === undefined ? { first: time, last: time } : { first: Math.min(held.first, time), last: Math.max(held.last, time) });
  }
  return [...days.values()];
}
