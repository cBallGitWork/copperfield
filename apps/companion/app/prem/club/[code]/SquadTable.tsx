import type { FootballPlayer } from "@epl/core";
import { availabilityOf, fullFootballerName, DASH } from "@epl/core";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_BOX } from "../../../components/league/LeadFace";
import StateBox from "../../../components/football/StateBox";
import { doubtRow } from "../../../components/football/doubtRow";
import { poolHref } from "../../poolHref";
import NameLink from "./NameLink";
import type { LeagueOpinion } from "../../leagueOpinions";
import { DESK_ONLY, QUIET_NOTE } from "@/app/desk";

// Every man on the club's books, ordered by the position our league files him at (Craig, 3 Sep 2026).
// The owner column is a name, never a figure: FPL's counts may not stand beside a Fantrax figure.

/** The name column takes whatever the figures leave. */
const NAME_SLACK = "w-full max-w-0";

/** The model's xMins for one gameweek, by FPL code, and the day of the export they came from. */
export interface SquadMinutes {
  gameweek: number;
  byCode: ReadonlyMap<number, number | null>;
  asOf: string;
}

export default function SquadTable({
  players,
  league,
  minutes,
}: {
  /** Already ordered by the page. This draws; it does not rank. */
  players: readonly FootballPlayer[];
  /** Our league's opinion by FPL code, empty when Fantrax would not say. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** Null drops the column. */
  minutes: SquadMinutes | null;
}) {
  // `cm-out` greys the row as a colour rule, which `desk.css` pairs with the doubt wash; a tile owns its ink.
  const shade = (player: FootballPlayer) => `${availabilityOf(player).out ? "cm-out" : ""} ${doubtRow(player)}`;
  return (
    <>
      <Board
        caption="The squad, by position"
        rows={players}
        keyOf={(player) => String(player.id)}
        rowClass={shade}
        lead={{
          tile: { positions: (player) => league.get(player.code)?.positions ?? [] },
          name: {
            label: "Player",
            // The name takes the slack and truncates, so a phone does not scroll.
            width: NAME_SLACK,
            className: (player) => `${NAME_SLACK} ${doubtRow(player)}`,
            of: (player) => (
              <NameLink href={poolHref(league, player.code)} className={LEAD_BOX}>
                <LeadFace name={fullFootballerName(player)} after={<StateBox player={player} />} />
              </NameLink>
            ),
          },
        }}
        columns={[
          {
            key: "owner",
            head: "Owner",
            title: "Owner",
            width: "w-20 lg:w-32",
            bare: true,
            // The owner, or Fantrax's own letters: "WW" on waivers, "FA" a free agent.
            cell: (player) => ({
              value: <span className="block truncate">{owner(league.get(player.code)) ?? DASH}</span>,
              className: "px-1.5 text-center text-2xs text-ink",
            }),
          },
          {
            key: "minutes",
            head: "Min",
            title: "Minutes played",
            width: "w-12 lg:w-20",
            cell: (player) => ({ value: player.season.minutes, className: "font-bold text-ink" }),
          },
          // Ours, so the derived reading's cyan beside FPL's minutes in ink.
          ...(minutes === null
            ? []
            : [
                {
                  key: "xmins",
                  head: "xMins",
                  title: `Expected minutes, gameweek ${minutes.gameweek}`,
                  width: "w-12 lg:w-20",
                  cell: (player: FootballPlayer) => ({
                    value: minutes.byCode.get(player.code) ?? DASH,
                    className: "font-bold text-info",
                  }),
                },
              ]),
          {
            key: "starts",
            head: "St",
            title: "Starts",
            width: "hidden w-9 lg:table-cell lg:w-16",
            cell: (player) => ({ value: player.season.starts, className: `${DESK_ONLY} font-bold text-ink` }),
          },
          {
            key: "goals",
            head: "G",
            title: "Goals",
            width: "hidden w-8 lg:table-cell lg:w-16",
            cell: (player) => ({ value: player.season.goals, className: `${DESK_ONLY} font-bold text-mid` }),
          },
          {
            key: "assists",
            head: "A",
            title: "Assists",
            width: "hidden w-8 lg:table-cell lg:w-16",
            cell: (player) => ({ value: player.season.assists, className: `${DESK_ONLY} font-bold text-mid` }),
          },
        ]}
      />
      {minutes === null ? null : <p className={`${QUIET_NOTE} px-1.5 py-1`}>xMins as of {minutes.asOf}</p>}
    </>
  );
}

/** Who holds him, or the state our league puts him in instead. */
function owner(opinion: LeagueOpinion | undefined): string | null {
  if (opinion === undefined) return null;
  return opinion.owner ?? (opinion.status || null);
}
