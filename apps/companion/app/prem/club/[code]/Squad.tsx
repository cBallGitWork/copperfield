import type { Club, FootballPlayer } from "@epl/core";
import BothReadings from "@/app/components/league/BothReadings";
import type { View } from "@/app/components/league/ViewToggle";
import { positionsLabel } from "../../../positions";
import Eleven from "./Eleven";
import type { ElevenLine } from "./Eleven";
import SquadTable, { type SquadMinutes } from "./SquadTable";
import type { LeagueOpinion } from "../../leagueOpinions";

// A club's squad and its predicted eleven: side by side on a desk, one at a time below `lg` (Craig, 3 Sep 2026).
// The page picks which, from the foot strip (`PitchList`).

/** Whether there is an eleven to draw, and so a Pitch | List to pick between. */
export function drawsEleven(eleven: readonly ElevenLine[], formation: string | null): boolean {
  return eleven.length > 0 && formation !== null;
}

export default function Squad({
  view,
  players,
  league,
  minutes,
  club,
  eleven,
  formation,
  against,
  updated,
}: {
  /** Which reading a phone draws; the desk draws both. */
  view: View;
  players: readonly FootballPlayer[];
  league: ReadonlyMap<number, LeagueOpinion>;
  /** One gameweek's xMins by FPL code, or null when the export does not cover the club's next week. */
  minutes: SquadMinutes | null;
  club: Club;
  /** The predicted eleven in its lines, or empty when there is no prediction —
   *  which is an ordinary state, not a fault: the export runs by hand. */
  eleven: ElevenLine[];
  formation: string | null;
  /** "v Chelsea · Sun 6 Sep", or null when there is no next match. */
  against: string | null;
  /** When Scout last updated the eleven — "Fri 4 Sept, 17:52". */
  updated: string | null;
}) {
  const list = <SquadTable players={players} league={league} minutes={minutes} />;
  // No eleven, no toggle: it would be a control with nothing to decide.
  if (!drawsEleven(eleven, formation)) return <div className="flex flex-col gap-2">{list}</div>;

  const byCode = new Map(players.map((player) => [player.code, player]));
  return (
    <BothReadings
      view={view}
      list={list}
      pitch={
        <Eleven
          lines={eleven}
          against={against}
          updated={updated}
          club={club}
          playerOf={(code) => byCode.get(code) ?? null}
          positionOf={(code) => positionsLabel(league.get(code)?.positions ?? [])}
        />
      }
    />
  );
}
