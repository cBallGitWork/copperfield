import Link from "@/app/components/shell/Link";
import { LEAGUE_COMPETITION, leads, londonDate, DASH, type SeasonOrder } from "@epl/core";
import type { SeasonRow } from "./teamSeason";
import { MINOR_CAPS, MINOR_LABEL, ROW_NAME, SMALL_CAPS } from "@/app/desk";
import { yoursEdge } from "@/app/mine";
import { matchupHref } from "../routes";
import { teamHref } from "@/app/squad/routes";
import TeamName from "@/app/components/league/TeamName";
import Scoreline from "../../components/shell/Scoreline";

// One team's season as a fixture list, the gameweeks to come first and the played under one "Played" row:
// a gameweek block, the opponent in white, a cup in cyan, and the score on a plate at the right edge.

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
    <ul className="cm-rows cm-scroll cm-scroll-y flex flex-col lg:max-h-[34rem] lg:overflow-y-auto">
      {order.toCome.map(line)}
      {order.played.length === 0 ? null : <li className={`${MINOR_LABEL} px-1.5 pb-1 pt-3`}>Played</li>}
      {order.played.map(line)}
    </ul>
  );
}

/** One tie: the opponent once, a cup's name on a desk column or under him on a phone, and the score. */
function SeasonLine({ row, teamId, current }: { row: SeasonRow; teamId: string; current: boolean }) {
  // A league tie is the list's default, so only a cup is named on a phone.
  const cup = row.tie.competition.id === LEAGUE_COMPETITION.id ? null : row.tie;
  return (
    <li>
      <div className={`cm-row flex min-h-9 items-center gap-2 px-1.5 ${yoursEdge(current)}`}>
        {/* The gameweek always; its date only on a desk, where the opponent still has room. The floor holds the widest label
            (GW10, "GW15 Saturday 12 December") so every opponent starts on one line. */}
        <span className="cm-index numeric flex min-w-11 shrink-0 items-baseline gap-1 px-1.5 py-0.5 lg:min-w-48">
          <span>GW{row.round.gameweek}</span>
          {row.round.deadline === null ? null : (
            <span className="hidden font-normal opacity-90 lg:inline">{londonDate(row.round.deadline)}</span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <Opponent opponent={row.opponent} gameweek={row.round.gameweek} />
          {cup === null ? null : (
            <span className={`${MINOR_CAPS} truncate text-info lg:hidden`}>
              {cup.competition.name}
              {cup.round === null ? null : <span className="font-normal"> {cup.round}</span>}
            </span>
          )}
        </span>

        {/* No H/A column: a fantasy fixture has no ground. */}

        {/* The competition in cyan (Craig, 7 Oct) on a desk; a phone names a cup under the opponent and leaves a
            league row bare (21 Oct), as the club's Fixtures do. A knockout's round sits under its name. */}
        <span className={`hidden w-40 shrink-0 flex-col ${SMALL_CAPS} text-info lg:flex lg:text-sm`}>
          <span className="truncate">{row.tie.competition.name}</span>
          {row.tie.round === null ? null : <span className="truncate font-normal">{row.tie.round}</span>}
        </span>

        {/* The score opens the matchup and the name opens his squad: a link cannot hold a link. */}
        <Link
          href={matchupHref(teamId, row.round.gameweek, undefined, row.opponent.team?.teamId)}
          className="cm-row inline-flex min-h-9 shrink-0 items-center hover:underline"
        >
          <Score row={row} />
        </Link>
      </div>
    </li>
  );
}

/** The result on an index plate, or a faint dash in the plate's room for a gameweek still to come. */
function Score({ row }: { row: SeasonRow }) {
  if (!row.round.started) {
    return <span className="numeric flex h-6 w-12 shrink-0 items-center justify-center text-faint">{DASH}</span>;
  }

  // A win only at full time: a half-time lead is not one (`gameweekStatus` in core).
  const won =
    row.round.status === "finished" && leads(row.pointsFor, row.pointsAgainst);

  return (
    <span className="cm-index numeric flex h-6 w-12 shrink-0 items-center justify-center">
      {/* A win is underlined, not coloured: the plate takes the manager's colour and owns its ink. */}
      <Scoreline
        home={<span className={won ? "underline decoration-2 underline-offset-2" : ""}>{row.pointsFor ?? DASH}</span>}
        rule="px-0.5 font-normal opacity-70"
        away={<span className="opacity-80">{row.pointsAgainst ?? DASH}</span>}
      />
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
  // The gap is a class: a flex parent collapses a trailing space in the markup.
  const v = <span className="shrink-0 pr-1 text-2xs font-normal text-faint">v</span>;

  return opponent.team === null ? (
    // Nobody drawn yet: the same name recipe, italic and faint.
    <span className={`flex min-w-0 items-center italic text-faint ${ROW_NAME}`}>
      {v}
      <span className="truncate">{opponent.label}</span>
    </span>
  ) : (
    <Link
      href={teamHref(opponent.team.teamId, gameweek)}
      // `.cm-row` gives a phone 36px, the desk 28. A name is white (DESIGN §3), in a week to come as in one played.
      className={`cm-row flex min-h-9 min-w-0 items-center text-ink hover:underline ${ROW_NAME}`}
    >
      {v}
      <span className="truncate">
        <TeamName teamId={opponent.team.teamId} name={opponent.label} />
      </span>
    </Link>
  );
}
