import { unstable_cache } from "next/cache";
import { now } from "./clock";
import { QUIET_REVALIDATE } from "./config";
import { singleFlight } from "./singleFlight";

// FPL's reads on the football clock: one held reading per read, refreshed at the live lifetime inside a match window
// and hourly outside it, so a refusal always serves the newest reading either clock took.

/** A reading and when it was taken, so one older than the quiet hour is asked again before it is drawn. */
interface Taken<R> {
  reading: R;
  takenAt: number;
}

/** A read on the football clock: `liveSeconds` while `inPlay`, else hourly, both on one key. A reading under an hour old
 *  is served while it refreshes behind; an older one waits on FPL, and is drawn only if FPL refuses. */
export function onTheClock<A extends unknown[], R>(
  name: string,
  read: (...args: A) => Promise<R>,
  liveSeconds: number,
  inPlay: () => Promise<boolean>,
): (...args: A) => Promise<R> {
  const once = singleFlight(async (...args: A): Promise<Taken<R>> => ({ reading: await read(...args), takenAt: now().getTime() }));
  const held = (seconds: number) => unstable_cache(once, [name, "taken"], { revalidate: seconds });
  const live = held(liveSeconds);
  const quiet = held(QUIET_REVALIDATE);
  return async (...args) => {
    const kept = await ((await inPlay()) ? live : quiet)(...args);
    if (now().getTime() - kept.takenAt <= QUIET_REVALIDATE * 1000) return kept.reading;
    // Joins the refresh the stale entry just started (`singleFlight`), so FPL is asked once.
    return once(...args).then((fresh) => fresh.reading, () => kept.reading);
  };
}
