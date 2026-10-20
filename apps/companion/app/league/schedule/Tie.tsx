import { LEAGUE_COMPETITION, type CompetitionTie, type TieSide, leads } from "@epl/core";
import type { ScheduleRound } from "./schedule";
import ScoreRow from "../../components/shell/ScoreRow";
import { opensOn, tieSide } from "../../components/league/tieSide";
import { LABEL } from "@/app/desk";
import { tieHref } from "../routes";

// One tie as CM's results row (`shell/ScoreRow`): a fixture to come prints its code, never 0:0, and the whole row is one
// link. Only the league's own ties open a board: the head-to-head route knows nothing of cups.

export default function Tie({
  tie,
  points,
  places,
  round,
  mine,
}: {
  tie: CompetitionTie;
  /** Each side's Fantrax total for the gameweek, by team id. */
  points: Map<string, number | null>;
  /** Each team's place in the table, for CM's blue block (`placings`). */
  places: Map<string, string>;
  round: ScheduleRound;
  mine: string | null;
}) {
  const home = scoreOf(tie.home, points);
  const away = scoreOf(tie.away, points);

  // A winner only at full time (`gameweekStatus`).
  const settled = round.status === "finished";

  // A fixture to come opens its board too (Craig, 5 Sep 2026); a tie with nobody in it yet opens nothing.
  const opens =
    tie.competition.id === LEAGUE_COMPETITION.id &&
    tie.home.team !== null &&
    tie.away.team !== null;
  const on = opensOn(tie.home.team?.teamId, tie.away.team?.teamId, mine);

  return (
    <ScoreRow
      home={tieSide(tie.home, places, mine, { lost: settled && leads(away, home) })}
      away={tieSide(tie.away, places, mine, { lost: settled && leads(home, away) })}
      score={round.started ? { home, away } : null}
      pending={<span className={LABEL}>{tie.code ?? "v"}</span>}
      marks
      href={opens && on !== undefined ? tieHref(on, round.gameweek, tie.home.team?.teamId, tie.away.team?.teamId) : undefined}
    />
  );
}

function scoreOf(side: TieSide, points: Map<string, number | null>): number | null {
  return side.team === null ? null : (points.get(side.team.teamId) ?? null);
}
