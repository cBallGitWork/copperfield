// After a failed upstream read, the same read is refused here for `restMs`, doubling per refusal in a row to `maxRestMs`.
// A cache entry whose refresh failed stays stale, so Next asked FPL again on every page view: 26 a minute (11 Oct 2026).

/** The rest after a failure: `first` after a success, else double the last rest, never past `max`. */
export function nextRest(last: number | null, first: number, max: number): number {
  return last === null ? first : Math.min(last * 2, Math.max(first, max));
}

export function restAfterFailure<A extends unknown[], R>(
  read: (...args: A) => Promise<R>,
  restMs: number,
  { maxRestMs = restMs, clock = Date.now }: { maxRestMs?: number; clock?: () => number } = {},
): (...args: A) => Promise<R> {
  const resting = new Map<string, { until: number; rest: number; error: unknown }>();
  return async (...args) => {
    const key = JSON.stringify(args);
    const held = resting.get(key);
    if (held !== undefined && clock() < held.until) throw held.error;
    try {
      const answer = await read(...args);
      resting.delete(key);
      return answer;
    } catch (error: unknown) {
      const rest = nextRest(held?.rest ?? null, restMs, maxRestMs);
      resting.set(key, { until: clock() + rest, rest, error });
      // Once per failed ask, with the endpoint and status the provider's error names; the rest is silent.
      console.error(`${error instanceof Error ? error.message : String(error)}; not asked again for ${rest / 1000}s`);
      throw error;
    }
  };
}
