import Link from "@/app/components/shell/Link";
import { LEAGUE_COMPETITION, londonDayAndDate, DASH, type SeasonOrder } from "@epl/core";
import type { SeasonRow } from "./teamSeason";
import { seasonResult } from "./result";
import { BLOCK_PLATE, HEAD_PLATE, HEAD_PLATE_CENTRE, INDEX_SPINE, MINOR_WORD, ROW_NAME, SMALL_WORD } from "@/app/desk";
import { yoursEdge } from "@/app/mine";
import { matchupHref } from "../routes";
import { teamHref } from "@/app/squad/routes";
import TeamName from "@/app/components/league/TeamName";
import Scoreline from "../../components/shell/Scoreline";

// One team's season as a fixture list, the gameweeks to come first and the played under one "Played" plate: a gameweek
// block, the date, the opponent in white, the competition in cyan, W/L/D, and the score in cyan (the approved picture).

/** The columns, shared by the head strip and every row so the plates sit over their figures. */
const DATE = "hidden w-28 shrink-0 lg:block";
const COMPETITION = "hidden w-40 shrink-0 lg:flex";
const RESULT = "w-10 shrink-0";
const SCORE = "w-16 shrink-0";
const GW = "w-12 shrink-0 lg:w-14";

export default function Season({
  order,
  teamId,
}: {
  /** `seasonRows` split by `seasonOrder`: the current gameweek first. */
  order: SeasonOrder<SeasonRow>;
  /** Whose season this is; every score links to his matchup. */
  teamId: string;
}) {
  // The gameweek still to finish: its rows take the accent edge.
  const current = order.toCome[0]?.round.gameweek;
  const line = (row: SeasonRow) => (
    // The opponent too: a double header pairs a team twice in one period.
    <SeasonLine
      key={`${row.round.period}-${row.tie.competition.id}-${row.tie.round ?? ""}-${row.opponent.team?.teamId ?? row.opponent.label}`}
      row={row}
      teamId={teamId}
      current={row.round.gameweek === current}
    />
  );
  return (
    // CM's visible scroll bar on a desk; a phone scrolls the page, or the list's foot sits under the rail.
    <div className="flex flex-col gap-1">
      {/* One head strip over every column, as CM's (`cm9900/24.jpg`); a phone's rows say themselves. */}
      {/* Its right padding is the row's 6px plus CM's 16px scroll bar (`.cm-scroll`), so each plate sits over its column. */}
      <div aria-hidden className={`hidden items-center gap-2 pr-[1.375rem] lg:flex ${SMALL_WORD}`}>
        <span className={`${HEAD_PLATE_CENTRE} ${GW}`}>GW</span>
        <span className={`${HEAD_PLATE} w-28 shrink-0`}>Date</span>
        <span className={`${HEAD_PLATE} min-w-0 flex-1`}>Opponent</span>
        <span className={`${HEAD_PLATE} ${COMPETITION}`}>Competition</span>
        <span className={`${HEAD_PLATE_CENTRE} ${RESULT}`}>Res</span>
        <span className={`${HEAD_PLATE_CENTRE} ${SCORE}`}>Score</span>
      </div>
      <ul className="cm-rows cm-scroll cm-scroll-y flex flex-col lg:max-h-[34rem] lg:overflow-y-auto">
        {order.toCome.map(line)}
        {order.played.length === 0 ? null : (
          <li className="pb-1 pt-3">
            <span className={`${BLOCK_PLATE} w-fit`}>Played</span>
          </li>
        )}
        {order.played.map(line)}
      </ul>
    </div>
  );
}

/** One tie: the opponent once, a cup's name on a desk column or under him on a phone, and the score. */
function SeasonLine({ row, teamId, current }: { row: SeasonRow; teamId: string; current: boolean }) {
  // A league tie is the list's default, so only a cup is named on a phone.
  const cup = row.tie.competition.id === LEAGUE_COMPETITION.id ? null : row.tie;
  return (
    <li>
      <div className={`cm-row flex min-h-9 items-center gap-2 pr-1.5 ${yoursEdge(current)}`}>
        {/* The gameweek alone in its block, so every block is one width; the date is its own column on a desk. */}
        <span className={`${INDEX_SPINE} numeric flex items-center justify-center ${GW}`}>GW{row.round.gameweek}</span>
        <span className={`${DATE} text-sm text-muted`}>
          {row.round.deadline === null ? DASH : londonDayAndDate(row.round.deadline)}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <Opponent opponent={row.opponent} gameweek={row.round.gameweek} />
          {cup === null ? null : (
            <span className={`${MINOR_WORD} truncate text-info lg:hidden`}>
              {cup.competition.name}
              {cup.round === null ? null : <span className="font-normal"> {cup.round}</span>}
            </span>
          )}
        </span>

        {/* No H/A column: a fantasy fixture has no ground. */}

        {/* The competition in cyan (Craig, 7 Oct) on a desk; a phone names a cup under the opponent and leaves a
            league row bare (21 Oct), as the club's Fixtures do. A knockout's round sits under its name. */}
        <span className={`${COMPETITION} flex-col ${SMALL_WORD} text-info lg:text-sm`}>
          <span className="truncate">{row.tie.competition.name}</span>
          {row.tie.round === null ? null : <span className="truncate font-normal">{row.tie.round}</span>}
        </span>

        <Result row={row} />

        {/* The score opens the matchup and the name opens his squad: a link cannot hold a link. */}
        <Link
          href={matchupHref(teamId, row.round.gameweek, undefined, row.opponent.team?.teamId)}
          // `cm-spine` stretches the link to the row's full height, so the plate inside it can meet the next.
          className={`cm-row cm-spine inline-flex min-h-9 items-center justify-center hover:underline ${SCORE}`}
        >
          <Score row={row} />
        </Link>
      </div>
    </li>
  );
}

/** W, L or D in its own column, `Live` while it is played; nothing before it starts. */
function Result({ row }: { row: SeasonRow }) {
  const result = seasonResult(row);
  return (
    <span className={`${RESULT} text-center font-chrome font-bold ${result === null ? "" : result.ink} ${result?.word === "Live" ? "text-2xs" : "text-sm"}`}>
      {result?.word}
    </span>
  );
}

/** The score in the reading cyan, our figure first; a faint dash for a gameweek still to come. */
function Score({ row }: { row: SeasonRow }) {
  if (!row.round.started) return <span className="numeric text-faint">{DASH}</span>;
  return (
    <span className="numeric text-base font-bold text-info lg:text-lg">
      <Scoreline home={row.pointsFor ?? DASH} rule="px-0.5 font-normal text-muted" away={row.pointsAgainst ?? DASH} />
    </span>
  );
}

function Opponent({
  opponent,
  gameweek,
}: {
  opponent: SeasonRow["opponent"];
  /** The row's gameweek, so a tap on a March fixture opens March's squad. */
  gameweek: number;
}) {
  return opponent.team === null ? (
    // Nobody drawn yet: the same name recipe, italic and faint.
    <span className={`flex min-w-0 items-center italic text-faint ${ROW_NAME}`}>
      <span className="truncate">{opponent.label}</span>
    </span>
  ) : (
    <Link
      href={teamHref(opponent.team.teamId, gameweek)}
      // `.cm-row` gives a phone 36px, the desk 28. A name is white (DESIGN §3), in a week to come as in one played.
      className={`cm-row flex min-h-9 min-w-0 items-center text-ink hover:underline ${ROW_NAME}`}
    >
      <span className="truncate">
        <TeamName teamId={opponent.team.teamId} name={opponent.label} />
      </span>
    </Link>
  );
}
