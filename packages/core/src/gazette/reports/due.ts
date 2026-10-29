import type { Fixture } from "../../football/types";
import { groupedBy } from "../../grouped";
import { MS_PER_HOUR, londonDayOf } from "../../time";
import { SETTLED_AFTER_KICKOFF_HOURS } from "../editorial";

// When a match-day report is due: once every match that London day is over, settled by FPL or an hour past full time
// (`SETTLED_AFTER_KICKOFF_HOURS`). One per day, keyed on the day; a day still being played files nothing and spends nothing.

interface ReportDay {
  key: string;
  slug: string;
  /** London calendar day, `2026-09-19`. */
  day: string;
}

/** Whether a match's figures have stopped moving by `now`: FPL's bonus is in, or the whistle went long enough ago. */
function over(fixture: Fixture, now: number): boolean {
  return fixture.settled || pastSettle(fixture, now);
}

/** Whether a whistled match kicked off `SETTLED_AFTER_KICKOFF_HOURS` before `now`, whatever FPL says of its bonus. */
export function pastSettle(fixture: Fixture, now: number): boolean {
  const kickoff = Date.parse(fixture.kickoff ?? "");
  return fixture.status === "finished" && now - kickoff >= SETTLED_AFTER_KICKOFF_HOURS * MS_PER_HOUR;
}

export function reportDays(fixtures: readonly Fixture[], gameweek: number, now: string): ReportDay[] {
  const at = Date.parse(now);
  const days = groupedBy(fixtures.filter((fixture) => fixture.gameweek === gameweek), (fixture) => londonDayOf(fixture.kickoff));
  return [...days]
    .flatMap(([day, matches]) => (day !== null && matches.every((f) => over(f, at)) ? [day] : []))
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({ key: `match-report:gw${gameweek}:${day}`, slug: `gw${gameweek}-prem-report-${day}`, day }));
}
