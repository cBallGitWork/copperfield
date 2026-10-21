import { FULL_TIME_AFTER_KICKOFF_MINUTES } from "../../config";
import { MS_PER_MINUTE } from "../../time";
import { byKickoff } from "../selectors";
import type { RunEntry } from "./cups";

// A season's list opened on the next match: what is to come first, soonest first, then what was played, newest first.

export interface SeasonOrder<T> {
  /** Not yet over, a match in play included; the next one first. */
  toCome: T[];
  /** Over, the latest first. */
  played: T[];
}

/** Splits a season at its last finished match; `earlier` is the season's own order, oldest first. */
export function seasonOrder<T>(
  entries: readonly T[],
  isPlayed: (entry: T) => boolean,
  earlier: (a: T, b: T) => number,
): SeasonOrder<T> {
  const inOrder = [...entries].sort(earlier);
  return {
    toCome: inOrder.filter((entry) => !isPlayed(entry)),
    played: inOrder.filter(isPlayed).reverse(),
  };
}

/** A club's run split at `now`: a league match is played at FPL's full time, a cup tie at its score or once full time has passed. */
export function runOrder(entries: readonly RunEntry[], now: string): SeasonOrder<RunEntry> {
  const at = Date.parse(now);
  const played = (entry: RunEntry): boolean => {
    if (entry.kind === "league") return entry.fixture.status === "finished";
    // The export can trail a cup tie's result by days: one long past full time is over, scored or not.
    const kickoff = entry.tie.kickoff === null ? NaN : Date.parse(entry.tie.kickoff);
    return entry.tie.score !== null || at - kickoff > FULL_TIME_AFTER_KICKOFF_MINUTES * MS_PER_MINUTE;
  };
  return seasonOrder(entries, played, (a, b) => byKickoff(kickoffOf(a), kickoffOf(b)));
}

function kickoffOf(entry: RunEntry): string | null {
  return entry.kind === "league" ? entry.fixture.kickoff : entry.tie.kickoff;
}
