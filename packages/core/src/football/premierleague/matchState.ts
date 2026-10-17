import type { Fixture, FixtureStatus } from "../types";
import { plFixtureCode } from "./map";
import type { RawPlFixture } from "./raw";

// A match's score, clock and state off the Premier League's detail read, the read its goals and commentary come from,
// so the bar above a scoresheet cannot say 0–0 over two goals. FPL's fixture list lags it by minutes.

const STATUS: Record<string, FixtureStatus> = { U: "upcoming", L: "live", C: "finished" };

/** Where each half's clock stops counting whole minutes: added time reads 45 and 90, as FPL's `minutes` does. */
const HALF_END: Record<string, number> = { "1": 45, H: 45, "2": 90 };

function minuteOf(clock: { secs: number }, phase: string | undefined): number {
  const minute = Math.floor(clock.secs / 60);
  const end = HALF_END[phase ?? ""];
  return end === undefined ? minute : Math.min(minute, end);
}

/** `fixture` with the detail read's score, minute and state; unchanged when the read is absent or another match's. */
export function withPlState(fixture: Fixture, detail: RawPlFixture | null): Fixture {
  if (detail === null || plFixtureCode(detail) !== fixture.code) return fixture;
  const status = STATUS[detail.status];
  if (status === undefined) return fixture;
  const [home, away] = detail.teams ?? [];
  // A started match with no score on a side is the feed's gap, not a nought: keep FPL's.
  const score = (side: typeof home, fpl: number | null) => (status === "upcoming" ? null : (side?.score ?? fpl));
  return {
    ...fixture,
    status,
    homeScore: score(home, fixture.homeScore),
    awayScore: score(away, fixture.awayScore),
    minutes: detail.clock === undefined ? fixture.minutes : minuteOf(detail.clock, detail.phase),
  };
}
