/** Seconds until the next poll: the live rate inside a match window, its opening if nearer than the idle rate, else idle.
 *  `liveIn` is as the server gave it; `elapsed` is the seconds since it arrived. */
export function nextPoll(
  liveIn: number | null,
  elapsed: number,
  rates: { live: number; idle: number },
): number {
  if (liveIn === null) return rates.idle;
  const remaining = liveIn - elapsed;
  if (remaining <= 0) return rates.live;
  return Math.min(remaining, rates.idle);
}

/** Seconds until a second refresh after the app opens or comes back in a match window, or null for none: a read past
 *  its lifetime answers the first with its old reading and fetches behind it. `since` is null on a cold open. */
export function settleAfter(
  liveIn: number | null,
  elapsed: number,
  since: number | null,
  rules: { lifetime: number; settle: number },
): number | null {
  if (liveIn === null || liveIn - elapsed > 0) return null;
  if (since !== null && since <= rules.lifetime) return null;
  return rules.settle;
}
