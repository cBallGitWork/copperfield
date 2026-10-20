import type { ScoreSide } from "@/app/components/shell/ScoreRow";
import { shortName } from "../../teamNames";

// A fantasy tie's two halves in `ScoreRow`'s vocabulary, for the schedule, the results and Live.

/** One seat of a tie; a seat not yet drawn has no team and no place. `lost` dims a settled loser's name; `left` is his
 *  men still to play (`toPlayWord`); `pending` the clean sheets Fantrax has not credited (`pendingByTeam`). */
export function tieSide(
  seat: { team: { teamId: string } | null; label: string },
  places: Map<string, string>,
  mine: string | null,
  { lost = false, left = null, pending = null }: { lost?: boolean; left?: string | null; pending?: number | null } = {},
): ScoreSide {
  return {
    left,
    pending,
    name: seat.label,
    short: seat.team === null ? undefined : shortName(seat.team.teamId, seat.label),
    place: seat.team === null ? null : (places.get(seat.team.teamId) ?? null),
    mine: seat.team !== null && seat.team.teamId === mine,
    lost,
  };
}

/** Which side a tie's board opens on: the reader's when he is in it, else the home side's. */
export function opensOn(home: string | undefined, away: string | undefined, mine: string | null): string | undefined {
  return mine !== null && (home === mine || away === mine) ? mine : home;
}
