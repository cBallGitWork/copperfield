import type { FootballPlayer, FootballSnapshot, MatchEvent, MatchEventKind, PlayerOwner } from "@epl/core";
import { playerByCode } from "@epl/core";

// The ownership join: each goal's men, and whether the reader holds them.
// At the app edge, not in core: the football and league layers may not import each other.

/** One event and the one or two men it names: one row per event, not per man (Craig, 5 Sep 2026). */
export interface WireLine {
  /** The event's own id: stable across polls, so a refresh does not redraw the panel. */
  key: string;
  /** FPL's fixture `code`, which match the event is in. */
  fixtureCode: number;
  minute: string;
  kind: MatchEventKind;
  /** The scorer; null when the bridge could not place him. */
  man: WireMan | null;
  /** The assister; null for an unassisted goal or a one-man event. */
  second: WireMan | null;
  /** Kick-off plus elapsed, to order ten matches against each other; null when the feed did not time it. */
  at: number | null;
}

/** A man in a line, and whether the reader holds him. */
interface WireMan {
  player: FootballPlayer;
  mine: boolean;
}

/** Event kinds whose slot 1 names a second man (the assister); every other kind names one. */
const SECOND: Partial<Record<MatchEventKind, true>> = {
  goal: true,
  "penalty-goal": true,
};

/** Each event joined to its men, newest first; an untimed line sorts last rather than into 1970. */
export function wireLines(
  events: readonly MatchEvent[],
  snapshot: FootballSnapshot,
  owners: Map<number, PlayerOwner> | undefined,
  mine: string | null,
): WireLine[] {
  const players = playerByCode(snapshot);

  /** One slot of an event, joined to the man and his holder; an empty slot and an unplaced man are both null. */
  const manAt = (event: MatchEvent, slot: number): WireMan | null => {
    const code = event.players[slot];
    if (code === undefined || code === null) return null;
    const player = players.get(code) ?? null;
    if (player === null) return null;
    const owner = owners?.get(code) ?? null;
    return { player, mine: owner !== null && owner.teamId === mine };
  };

  const lines = events.map((event) => ({
    key: String(event.id),
    fixtureCode: event.fixtureCode,
    // The feed's clock pads the minute ("09"); football prints it bare.
    minute: event.minute.replace(/^0(?=\d)/, ""),
    kind: event.kind,
    man: manAt(event, 0),
    second: SECOND[event.kind] === true ? manAt(event, 1) : null,
    at: event.absolute,
  }));
  return lines.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}
