import { dayAndDateOfDay, londonDayOf, type Fixture } from "@epl/core";
import { LIVE } from "../components/shell/sections";
import { beside } from "../components/shell/gameweekStep";
import type { Step } from "../components/shell/StepHead";

// Which of the gameweek's match days Live's Scores shows (Craig, 19 Oct 2026: "a back/forward arrow for each day").

/** The London days the gameweek's matches are played on, in order; an undated match is on none. */
export function matchDays(fixtures: readonly Pick<Fixture, "kickoff">[]): string[] {
  const days = fixtures.flatMap((fixture) => londonDayOf(fixture.kickoff) ?? []);
  return [...new Set(days)].sort();
}

/** The day asked for when the gameweek plays on it, else today or the next to come, else the last; null with none. */
export function scoreDay(days: readonly string[], today: string, asked: string | undefined): string | null {
  if (asked !== undefined && days.includes(asked)) return asked;
  return days.find((day) => day >= today) ?? days.at(-1) ?? null;
}

/** The day on show, named, and the match days either side; null when no match is dated. */
export interface DayStep {
  day: string;
  title: string;
  previous: Step | null;
  next: Step | null;
}

/** A view's day and its arrows. The day it opens on keeps the view's plain address (`base`), so it has one URL. */
export function dayStep(days: readonly string[], today: string, asked: string | undefined, base = LIVE): DayStep | null {
  const day = scoreDay(days, today, asked);
  if (day === null) return null;
  const opening = scoreDay(days, today, undefined);
  const to = (at: string | null): Step | null =>
    at === null ? null : { href: at === opening ? base : `${base}${base.includes("?") ? "&" : "?"}day=${at}`, label: dayAndDateOfDay(at) };
  const side = beside(days, day);
  return { day, title: dayAndDateOfDay(day), previous: to(side.previous), next: to(side.next) };
}
