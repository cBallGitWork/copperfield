import { unstable_cache } from "next/cache";
import { now } from "./clock";
import { QUIET_REVALIDATE } from "./config";
import { singleFlight } from "./singleFlight";

// FPL's reads on the football clock: the live lifetime inside a match window, one reading per quiet hour outside it.

/** A read held for the quiet hour it was asked in: the hour is in the key, so a new hour reads afresh and an hour-old
 *  reading is never served as this hour's. */
export function hourly<A extends unknown[], R>(name: string, read: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  const once = singleFlight(read);
  return (...args) => {
    const hour = String(Math.floor(now().getTime() / (QUIET_REVALIDATE * 1000)));
    return unstable_cache(once, [name, "quiet", hour], { revalidate: QUIET_REVALIDATE })(...args);
  };
}

/** A read on the football clock: `liveSeconds` while `inPlay`, else `hourly`, and a refused quiet read serves the last
 *  reading the live clock held, which only a match window fills (its refresh is refused by the endpoint's own rest). */
export function onTheClock<A extends unknown[], R>(
  name: string,
  read: (...args: A) => Promise<R>,
  liveSeconds: number,
  inPlay: () => Promise<boolean>,
): (...args: A) => Promise<R> {
  const quiet = hourly(name, read);
  const live = unstable_cache(singleFlight(read), [name], { revalidate: liveSeconds });
  return async (...args) => ((await inPlay()) ? live(...args) : quiet(...args).catch(() => live(...args)));
}
