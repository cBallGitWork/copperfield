// After a failed upstream read, the same read is refused here without asking for `restMs`, in this process. A cache
// entry whose refresh failed stays stale, so Next asked FPL again on every page view: 26 refusals a minute (11 Oct 2026).

export function restAfterFailure<A extends unknown[], R>(
  read: (...args: A) => Promise<R>,
  restMs: number,
  clock: () => number = Date.now,
): (...args: A) => Promise<R> {
  const resting = new Map<string, { until: number; error: unknown }>();
  return async (...args) => {
    const key = JSON.stringify(args);
    const rest = resting.get(key);
    if (rest !== undefined && clock() < rest.until) throw rest.error;
    try {
      const answer = await read(...args);
      resting.delete(key);
      return answer;
    } catch (error: unknown) {
      resting.set(key, { until: clock() + restMs, error });
      // Once per failed ask, with the endpoint and status the provider's error names; the rest is silent.
      console.error(`${error instanceof Error ? error.message : String(error)}; not asked again for ${restMs / 1000}s`);
      throw error;
    }
  };
}
