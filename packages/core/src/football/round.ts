import { POSTPONED_AFTER_MINUTES } from "../config";
import { MS_PER_MINUTE } from "../time";
import type { Fixture, FixtureStatus, FootballSnapshot } from "./types";

// Where a round stands in time as a Saturday runs; `selectors.ts` answers what a snapshot contains.
// Each function answers one question, and is wrong when asked in place of another.

/** True when any match is in play: drives the live treatment, never the poll rate (that is `duringGameweek`). */
export function isMatchdayLive(snapshot: FootballSnapshot): boolean {
  return snapshot.fixtures.some((f) => f.status === "live");
}

/** From the round's first dated kickoff, or `lead` minutes before it, until its last dated match finishes.
 *  Wider than `isMatchdayLive`, since the gap between kickoffs counts; closes on `finished`, not `data_checked`.
 *  Undated fixtures are ignored at both ends, and so is one unstarted `POSTPONED_AFTER_MINUTES` past its kickoff. */
export function duringGameweek(snapshot: FootballSnapshot, at: string, lead = 0): boolean {
  const now = Date.parse(at);
  return gameweekOpened(snapshot, at, lead) && snapshot.fixtures.some((f) => countedKickoff(f, now) !== null && f.status !== "finished");
}

/** Whether the round's first dated kickoff, less `lead` minutes, has passed; it stays true after the last whistle. */
export function gameweekOpened(snapshot: FootballSnapshot, at: string, lead = 0): boolean {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return false;
  const kickoffs = snapshot.fixtures.flatMap((fixture) => countedKickoff(fixture, now) ?? []);
  return kickoffs.length > 0 && now >= Math.min(...kickoffs) - lead * MS_PER_MINUTE;
}

/** A fixture's kickoff instant when it counts in its round at `now`; null when undated, or unstarted
 *  `POSTPONED_AFTER_MINUTES` past kickoff (called off). A NaN `now` lets nothing go. */
function countedKickoff(fixture: Fixture, now: number): number | null {
  const kickoff = fixture.kickoff === null ? NaN : Date.parse(fixture.kickoff);
  if (Number.isNaN(kickoff)) return null;
  return fixture.status === "upcoming" && now - kickoff > POSTPONED_AFTER_MINUTES * MS_PER_MINUTE ? null : kickoff;
}

/** Whether any match in this gameweek has kicked off; `gameweekStatus` reads "upcoming" with nine results in. */
export function gameweekStarted(fixtures: readonly Fixture[], gameweek: number): boolean {
  return anyStarted(fixtures.filter((fixture) => fixture.gameweek === gameweek));
}

/** Whether any of these matches has kicked off; a league period asks it of the fixtures it scores. */
export function anyStarted(fixtures: readonly Fixture[]): boolean {
  return fixtures.some((fixture) => fixture.status !== "upcoming");
}

/** A gameweek's status: live while any match is, finished once all are, else upcoming (also with no fixtures).
 *  Every view that marks a winner gates on "finished" from here: a half-time lead is not a win. */
export function gameweekStatus(
  fixtures: readonly Fixture[],
  gameweek: number,
): FixtureStatus {
  return fixturesStatus(fixtures.filter((fixture) => fixture.gameweek === gameweek));
}

/** These matches' status, as `gameweekStatus` reads a gameweek's; empty is upcoming. A league period asks it of its own. */
export function fixturesStatus(fixtures: readonly Fixture[]): FixtureStatus {
  if (fixtures.length === 0) return "upcoming";
  if (fixtures.some((fixture) => fixture.status === "live")) return "live";
  return fixtures.every((fixture) => fixture.status === "finished") ? "finished" : "upcoming";
}
/** The gameweek and kickoff of the next match to start, or null; not the round in view, which is `focusGameweek`.
 *  Ordered by kickoff, never by lowest unfinished gameweek: FPL leaves a postponed fixture in its original `event`.
 *  Fixtures with no kickoff or no gameweek are ignored. */
export function nextRound(
  fixtures: readonly Fixture[],
  at: string,
): { gameweek: number; kickoff: string } | null {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return null;

  let soonest: { gameweek: number; kickoff: string; at: number } | null = null;
  for (const fixture of fixtures) {
    if (fixture.kickoff === null || fixture.gameweek === null) continue;
    const kickoff = Date.parse(fixture.kickoff);
    // Inclusive: a ball kicked at this instant is the next one; `duringGameweek` opens on the same boundary.
    if (Number.isNaN(kickoff) || kickoff < now) continue;
    if (soonest === null || kickoff < soonest.at) {
      soonest = { gameweek: fixture.gameweek, kickoff: fixture.kickoff, at: kickoff };
    }
  }

  return soonest === null ? null : { gameweek: soonest.gameweek, kickoff: soonest.kickoff };
}

/** How settled a finished round is: bonus still landing, bonus in, or signed off by FPL. */
type FinishedState = "bonus-settling" | "provisional" | "final";

/** A finished round's rung: `finished_provisional` is bonus-settling, bonus in is provisional, `data_checked` is final.
 *  Null while in play and before kickoff alike; `isMatchdayLive` tells them apart. Skips what `duringGameweek` skips. */
export function roundFinished(snapshot: FootballSnapshot, at: string): FinishedState | null {
  const now = Date.parse(at);
  let anyDated = false;
  let allFinished = true;
  let allSettled = true;

  for (const fixture of snapshot.fixtures) {
    if (countedKickoff(fixture, now) === null) continue;
    anyDated = true;
    if (fixture.status !== "finished") allFinished = false;
    if (!fixture.settled) allSettled = false;
  }

  if (!anyDated || !allFinished) return null;
  if (!allSettled) return "bonus-settling";
  return snapshot.dataChecked ? "final" : "provisional";
}

/** In play, or a rung down from the last whistle; null before kickoff and between two kickoffs alike.
 *  Pairs `isMatchdayLive` with `roundFinished`: neither alone answers both "live" and "final". */
export type RoundState = "live" | FinishedState | null;

export function roundState(snapshot: FootballSnapshot, at: string): RoundState {
  return isMatchdayLive(snapshot) ? "live" : roundFinished(snapshot, at);
}
