import type { ExpectedMinutes, Opposition } from "@epl/core";
import { played, type MatchRow } from "./matchRows";

// A player card's two strips, as plain data a server action can hand over: his last few matches with what our league
// paid for each, and the run to come with his xMins under each week.

/** How many of his latest matches the card's form strip shows. */
export const FORM_MATCHES = 3;

/** One recent match: who against, where, and our league's points; null points where he did not play or Fantrax's window misses it. */
export interface FormMatch {
  fixtureId: number;
  gameweek: number;
  /** The opponent's short name; null where FPL's club is not in the snapshot. */
  opponent: string | null;
  home: boolean;
  /** The opponent's FPL club code, for its ground on the ease ramp; null where FPL's club is not in the snapshot. */
  opponentCode: number | null;
  points: number | null;
}

/** One match to come: the opponent on the ease ramp, and the week's xMins under the week's first match only. */
export interface NextMatch {
  key: string;
  gameweek: number | null;
  /** Null where only the week is known: a card whose run could not be read. */
  against: { shortName: string; home: boolean; code: number } | null;
  /** The week's xMins; undefined under a double gameweek's second match, which shares the first's figure. */
  minutes?: number | null;
}

export interface CardWeeks {
  /** Oldest first; null where Fantrax's profile would not answer, so no week has a league figure. */
  form: FormMatch[] | null;
  next: NextMatch[];
  /** The day the xMins were taken. */
  asOf: string | null;
}

/** His latest `count` matches, oldest first, off his joined log (most recent first). */
export function formMatches(rows: readonly MatchRow[], count: number = FORM_MATCHES): FormMatch[] {
  return rows
    .slice(0, count)
    .reverse()
    .map((row) => {
      return {
        fixtureId: row.fpl.match.fixtureId,
        gameweek: row.fpl.match.gameweek,
        opponent: row.fpl.opponent?.shortName ?? null,
        home: row.fpl.match.home,
        opponentCode: row.fpl.opponent?.code ?? null,
        // A match he was not on is no reading, never a nought.
        points: played(row) ? (row.paid?.points ?? null) : null,
      };
    });
}

/** His next `count` matches with the week's xMins under each week's first. */
export function nextMatches(
  run: readonly Opposition[],
  minutes: ReadonlyMap<number, number | null>,
  count: number,
): NextMatch[] {
  const seen = new Set<number>();
  return run.slice(0, count).map((match) => {
    const gw = match.fixture.gameweek;
    const first = gw !== null && !seen.has(gw);
    if (gw !== null) seen.add(gw);
    return {
      key: String(match.fixture.id),
      gameweek: gw,
      against: against(match),
      ...(first ? { minutes: minutes.get(gw) ?? null } : {}),
    };
  });
}

/** The weeks a screen handed the card, with the one opponent it knows: what it shows while the run cannot be read.
 *  A week whose every match has kicked off is not "next" and is dropped (conventions UX-10). */
export function handedWeeks(weeks: readonly ExpectedMinutes[], opposition: readonly Opposition[] = []): NextMatch[] {
  return weeks.flatMap((week) => {
    const that = opposition.filter((one) => one.fixture.gameweek === week.gameweek);
    const match = that.find((one) => one.fixture.status === "upcoming");
    if (that.length > 0 && match === undefined) return [];
    return [{
      key: `gw${week.gameweek}`,
      gameweek: week.gameweek,
      against: match ? against(match) : null,
      minutes: week.minutes,
    }];
  });
}

const against = (match: Opposition): NonNullable<NextMatch["against"]> => ({
  shortName: match.club.shortName,
  home: match.home,
  code: match.club.code,
});
