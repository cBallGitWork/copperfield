import { FANTRAX_FXEA_BASE, ProviderError } from "@epl/core";

// After one Fantrax read times out, the league's reads fail with that timeout for a rest instead of each waiting out
// a deadline of its own: a page's dependent reads would otherwise wait one after another (45 s on `/`, 30 Oct 2026).

/** Both of Fantrax's surfaces answer from this host. */
const FANTRAX_HOST = new URL(FANTRAX_FXEA_BASE).host;

/** A deadline Fantrax let pass, by the host its `unreachable` error names; any other failure answered quickly. */
export function fantraxTimedOut(error: unknown): error is ProviderError {
  return error instanceof ProviderError && error.code === "TIMEOUT" && error.message.startsWith(`${FANTRAX_HOST} `);
}

/** Wraps reads so one Fantrax timeout fails them all at once for `restMs`; any read that answers ends the rest. */
export function restAfterTimeout(restMs: number, clock: () => number = () => Date.now()) {
  let resting: { until: number; error: ProviderError } | null = null;
  return <A extends unknown[], R>(read: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<R> => {
      if (resting !== null && clock() < resting.until) throw resting.error;
      try {
        const answer = await read(...args);
        resting = null;
        return answer;
      } catch (error: unknown) {
        if (fantraxTimedOut(error)) resting = { until: clock() + restMs, error };
        throw error;
      }
    };
}
