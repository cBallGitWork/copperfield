import { type IntelProjections, projectionIntel } from "./projections";

// The sister model's expected minutes (xMins) per man per gameweek, off its projections export. Only the minutes.

/** One gameweek's xMins, summed over his club's fixtures that week, so a blank week is a reading of nought. */
export interface ExpectedMinutes {
  gameweek: number;
  /** Whole minutes; null where the model has no reading for the week. */
  minutes: number | null;
  /** The London day the model's export was taken, for a screen to print once; the app sets it, core never does. */
  asOf?: string;
}

/** Each man's xMins by FPL code, every gameweek the export covers, in gameweek order. */
export function minutesIntel(file: IntelProjections | null): Map<number, ExpectedMinutes[]> {
  const byCode = new Map<number, ExpectedMinutes[]>();
  for (const [code, player] of projectionIntel(file)) {
    const weeks = [...player.gameweeks]
      .sort((a, b) => a.gw - b.gw)
      .map((week) => ({ gameweek: week.gw, minutes: week.minutes === null ? null : Math.round(week.minutes) }));
    byCode.set(code, weeks);
  }
  return byCode;
}

/** `count` gameweeks from `from` on, each null where the export has no reading: a fixed run, so columns line up. */
export function minutesAhead(
  weeks: readonly ExpectedMinutes[] | undefined,
  from: number,
  count: number,
): ExpectedMinutes[] {
  return Array.from({ length: count }, (_, at) => {
    const gameweek = from + at;
    return { gameweek, minutes: weeks?.find((week) => week.gameweek === gameweek)?.minutes ?? null };
  });
}
