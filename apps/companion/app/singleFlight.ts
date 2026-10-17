// One upstream read per key at a time in this process: requests that find one stale entry together refresh it once.
// Next starts a background refresh for each of them, so three viewers of a stale snapshot fetched FPL three times.

export function singleFlight<A extends unknown[], R>(read: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  const flying = new Map<string, Promise<R>>();
  const once = (...args: A) => {
    const key = JSON.stringify(args);
    const held = flying.get(key);
    if (held !== undefined) return held;
    const started = read(...args).finally(() => flying.delete(key));
    flying.set(key, started);
    return started;
  };
  // `unstable_cache` opens its key, and its error lines, with the function's source: a word, so the key parts lead.
  return Object.assign(once, { toString: () => "read" });
}
