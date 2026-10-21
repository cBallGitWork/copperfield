import type { FootballPlayer, SquadPlayerDetail } from "@epl/core";
import { availabilityOf, fullFootballerName, DASH } from "@epl/core";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_BOX } from "../../../components/league/LeadFace";
import FitnessMark from "../../../components/football/FitnessMark";
import { doubtRow } from "../../../components/football/doubtRow";
import { minutesInk } from "../../../components/football/xminsInk";
import { MaybeCard } from "../../../components/league/PlayerCardButton";
import type { LeagueOpinion } from "../../leagueOpinions";
import { holdersOf } from "../../holders";
import LeagueHolder from "../../LeagueHolder";
import { DESK_ONLY, NAME_SLACK, QUIET_NOTE } from "@/app/desk";

// Every man on the club's books, ordered by the position our league files him at (Craig, 3 Sep 2026): his name, his
// mark and who holds him as the Data boards tag it, then his season and his xMins.

/** The model's xMins for one gameweek, by FPL code, and the day of the export they came from. */
export interface SquadMinutes {
  gameweek: number;
  byCode: ReadonlyMap<number, number | null>;
  asOf: string;
}

export default function SquadTable({
  players,
  league,
  reader,
  cards,
  minutes,
}: {
  /** Already ordered by the page. This draws; it does not rank. */
  players: readonly FootballPlayer[];
  /** Our league's opinion by FPL code, empty when Fantrax would not say. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** The reader's own team, whose men tag "Yours". */
  reader: string | null;
  /** Each man's player card by FPL code, which his name opens; none for a man our league does not list. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  /** Null drops the column. */
  minutes: SquadMinutes | null;
}) {
  // `cm-out` greys the row as a colour rule, which `desk.css` pairs with the doubt wash; a tile owns its ink.
  const shade = (player: FootballPlayer) => `${availabilityOf(player).out ? "cm-out" : ""} ${doubtRow(player)}`;
  const holders = holdersOf(league, reader);
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
              <MaybeCard player={cards.get(player.code)} className={`${LEAD_BOX} w-full`}>
                <LeadFace
                  name={fullFootballerName(player)}
                  after={
                    <>
                      <FitnessMark player={player} />
                      <LeagueHolder code={player.code} holders={holders} className="" />
                    </>
                  }
                />
              </MaybeCard>
            ),
          },
        }}
        columns={[
          {
            key: "minutes",
            head: "Min",
            title: "Minutes played",
            width: "w-12 lg:w-20",
            cell: (player) => ({ value: player.season.minutes, className: "font-bold text-ink" }),
          },
          // Ours, inked by risk (`minutesInk`) beside FPL's minutes in ink.
          ...(minutes === null
            ? []
            : [
                {
                  key: "xmins",
                  head: "xMins",
                  title: `Expected minutes, gameweek ${minutes.gameweek}`,
                  width: "w-12 lg:w-20",
                  cell: (player: FootballPlayer) => {
                    const value = minutes.byCode.get(player.code) ?? null;
                    return { value: value ?? DASH, className: `font-bold ${minutesInk(value)}` };
                  },
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
