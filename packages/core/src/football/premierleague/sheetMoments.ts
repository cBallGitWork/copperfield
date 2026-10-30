import { plPlayerCodes } from "./teamSheet";
import { BOOKING, GOAL, OWN_GOAL, PENALTY, SUBSTITUTION, bareMinute } from "./fixtureEvents";
import type { RawPlFixture, RawPlFixtureEvent } from "./raw";

// One match's timed moments off the fixture detail's `events`, for the vidiprinter: whistles, cards, changes, goals.

export type SheetMomentKind = "kick-off" | "half-time" | "second-half" | "full-time" | "goal" | "booked" | "sent-off" | "on" | "off";

export interface SheetMoment {
  /** Stable across polls: the fixture, the kind and the clock, with the man where there is one. */
  key: string;
  fixtureCode: number;
  kind: SheetMomentKind;
  /** The printed minute, `"45+4"`; never for sorting. */
  minute: string;
  /** Elapsed in this match as the feed counts it; joins a goal to the round read's, which counts the same. */
  seconds: number;
  /** Which half, 1 or 2; null where the feed sent none. `seconds` alone misorders the first half's added time. */
  half: number | null;
  /** Wall clock, epoch ms; null where the feed sent none. */
  at: number | null;
  /** FPL `code`; null for a period mark, a staff card or a man the sheet cannot place. */
  man: number | null;
  score: { home: number; away: number } | null;
}

const PERIOD_START = "PS";
const PERIOD_END = "PE";

/** Which kind an event is, or null for one the vidiprinter has no use for. */
function kindOf(event: RawPlFixtureEvent): SheetMomentKind | null {
  const first = event.phase === "1";
  if (event.type === PERIOD_START) return first ? "kick-off" : event.phase === "2" ? "second-half" : null;
  if (event.type === PERIOD_END) return first ? "half-time" : event.phase === "2" ? "full-time" : null;
  if (event.type === GOAL || event.type === OWN_GOAL || event.type === PENALTY) return "goal";
  if (event.type === BOOKING) return event.description === "R" ? "sent-off" : event.description === "Y" ? "booked" : null;
  if (event.type === SUBSTITUTION) return event.description === "OFF" ? "off" : event.description === "ON" ? "on" : null;
  return null;
}

/** Every moment of one match in the feed's order; an event with no clock is left out. */
export function sheetMoments(detail: RawPlFixture, fixtureCode: number, optaToCode: Map<string, number>): SheetMoment[] {
  const codes = plPlayerCodes(detail, optaToCode);
  return (detail.events ?? []).flatMap((event) => {
    const kind = kindOf(event);
    if (kind === null || event.clock === undefined) return [];
    const man = event.personId === undefined ? null : (codes.get(event.personId) ?? null);
    return [
      {
        key: `${fixtureCode}:${kind}:${event.clock.secs}:${event.personId ?? ""}`,
        fixtureCode,
        kind,
        minute: bareMinute(event.clock.label),
        seconds: event.clock.secs,
        half: event.phase === "1" ? 1 : event.phase === "2" ? 2 : null,
        at: event.time?.millis ?? null,
        man,
        score: event.score === undefined ? null : { home: event.score.homeScore, away: event.score.awayScore },
      },
    ];
  });
}
