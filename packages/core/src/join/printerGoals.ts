import { bareMinute } from "../football/premierleague/fixtureEvents";
import type { SheetMoment } from "../football/premierleague/sheetMoments";
import type { Fixture, MatchEvent } from "../football/types";
import { MS_PER_SECOND } from "../time";
import type { PrinterLine } from "./vidiprinter";

// The vidiprinter's goals: off the round read, each with the wall clock and score it made, never one after `now`.

/** Where the second half's clock starts, in the feed's seconds. */
const SECOND_HALF_SECONDS = 45 * 60;

/** One half's span in a match's order, past any clock in seconds: the first half's added time sorts before the second. */
export const HALF = 100_000;

/** Where an event stands in its match: its half, then its clock. */
export function placeIn(half: number, seconds: number): number {
  return half * HALF + seconds;
}

/** An event's half off the feed, or off its clock where the feed names none. */
export function halfAt(half: number | null, seconds: number): number {
  return half ?? (seconds < SECOND_HALF_SECONDS ? 1 : 2);
}

/** Which half a goal the feed has not filed fell in: `"45+2"` is the first half's added time. */
function halfOf(event: MatchEvent): number {
  return event.minute.startsWith("45+") ? 1 : halfAt(null, event.seconds);
}

/** Every goal up to `now`, placed in its match. `moments` are the feed's up to `now`. */
export function goalLines(input: {
  now: number;
  goals: readonly MatchEvent[];
  moments: readonly SheetMoment[];
  fixtures: ReadonlyMap<number, Pick<Fixture, "homeClubId" | "awayClubId">>;
  clubOf: ReadonlyMap<number, number>;
}): { line: PrinterLine; place: number }[] {
  const byFixture = Map.groupBy(input.moments, (m) => m.fixtureCode);
  const filed = new Map(input.moments.filter((m) => m.kind === "goal").map((m) => [`${m.fixtureCode}:${m.seconds}`, m]));

  const placed = input.goals.map((event) => {
    const stamp = filed.get(`${event.fixtureCode}:${event.seconds}`);
    const half = stamp?.half ?? halfOf(event);
    return { event, stamp, half, place: placeIn(half, event.seconds) };
  });
  /** The side a goal counted for; an own goal counts for the other. Null for a man the snapshot cannot place. */
  const sideOf = (event: MatchEvent): "home" | "away" | null => {
    const fixture = input.fixtures.get(event.fixtureCode);
    const scorer = event.players[0] ?? null;
    const club = scorer === null ? undefined : input.clubOf.get(scorer);
    if (fixture === undefined || club === undefined) return null;
    const own = event.kind === "own-goal";
    if (club === fixture.homeClubId) return own ? "away" : "home";
    if (club === fixture.awayClubId) return own ? "home" : "away";
    return null;
  };
  /** The score once a goal stood, counted from its match's goals up to it; null when one cannot be sided. */
  const scoreAt = (fixtureCode: number, place: number): PrinterLine["score"] => {
    const sides = placed.filter((goal) => goal.event.fixtureCode === fixtureCode && goal.place <= place).map((goal) => sideOf(goal.event));
    if (sides.includes(null)) return null;
    return { home: sides.filter((side) => side === "home").length, away: sides.filter((side) => side === "away").length };
  };
  /** The feed's own clock; else its half's whistle plus the goal's clock; else, with no feed for the match, the read's. */
  const atOf = (event: MatchEvent, stamp: SheetMoment | undefined, half: number): number | null => {
    if (stamp !== undefined) return stamp.at;
    const own = byFixture.get(event.fixtureCode);
    if (own === undefined) return event.absolute;
    const whistle = own.find((m) => m.kind === (half === 1 ? "kick-off" : "second-half"))?.at ?? null;
    return whistle === null ? null : whistle + (event.seconds - (half === 1 ? 0 : SECOND_HALF_SECONDS)) * MS_PER_SECOND;
  };

  return placed.flatMap(({ event, stamp, half, place }) => {
    const at = atOf(event, stamp, half);
    if (at === null || at > input.now) return [];
    const line: PrinterLine = {
      key: `goal:${event.id}`,
      fixtureCode: event.fixtureCode,
      kind: event.kind,
      minute: bareMinute(event.minute),
      at,
      man: event.players[0] ?? null,
      // An own goal is nobody's assist: the score says which side it counted for.
      second: event.kind === "own-goal" ? null : (event.players[1] ?? null),
      score: stamp?.score ?? scoreAt(event.fixtureCode, place),
      counts: [],
    };
    return [{ line, place }];
  });
}
