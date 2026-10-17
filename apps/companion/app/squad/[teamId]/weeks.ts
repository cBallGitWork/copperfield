import { periodOfGameweek, type PeriodGameweeks } from "@epl/core";
import type { Round } from "../../round";

/** Where a week stands against the open one: locked (played or in play), the open week, or ahead of it; null when either is unknown. */
export type WeekStanding = "locked" | "open" | "ahead";

export function weekStanding(shown: Round | null, open: Round | null): WeekStanding | null {
  if (shown === null || open === null) return null;
  return shown.period < open.period ? "locked" : shown.period === open.period ? "open" : "ahead";
}

export interface GameweekOption {
  period: number;
  /** The gameweek the period is for (`own`), which is what `?gw=` names. */
  gameweek: number;
  label: string;
}

/** One option per period the league's calendar places, in period order; a period with no gameweek is skipped. */
export function gameweekOptions(calendar: readonly PeriodGameweeks[]): GameweekOption[] {
  return [...calendar]
    .sort((a, b) => a.period - b.period)
    .flatMap(({ period, gameweeks, own }) => {
      if (own === null) return [];
      const label = gameweeks.length === 1 ? `Gameweek ${own}` : `Gameweeks ${gameweeks.join(" & ")}`;
      return [{ period, gameweek: own, label }];
    });
}

/** The weeks the league plays: the periods its schedule pairs anybody in, or the whole calendar when it pairs nobody. */
export function leagueWeeks(
  calendar: readonly PeriodGameweeks[],
  matchups: readonly { period: number }[],
): PeriodGameweeks[] {
  const paired = new Set(matchups.map((matchup) => matchup.period));
  return paired.size === 0 ? [...calendar] : calendar.filter((week) => paired.has(week.period));
}

/** The round `?gw=` names among the league's weeks, or null for one it does not play, which opens the default. */
export function askedWeek(weeks: readonly PeriodGameweeks[], asked: number | null): Round | null {
  const found = asked === null ? undefined : periodOfGameweek(weeks, asked);
  return asked === null || found === undefined ? null : { gameweek: asked, period: found.period };
}

/** The picker for the week on screen, or null when the calendar cannot place it. */
export function gameweekPicker(
  calendar: readonly PeriodGameweeks[],
  shown: Round | null,
): { shown: number; options: GameweekOption[] } | null {
  const options = gameweekOptions(calendar);
  const selected = options.find((option) => option.period === shown?.period);
  return selected === undefined ? null : { shown: selected.gameweek, options };
}

/** The week a rival's squad opens on (Craig, 16 Oct 2026): the last locked while its football is still `playing`,
 *  else the next, which the gate draws as his squad until it locks. */
export function rivalWeek(locked: Round | null, next: Round | null, playing: number | null): Round | null {
  return locked !== null && locked.gameweek === playing ? locked : (next ?? locked);
}
