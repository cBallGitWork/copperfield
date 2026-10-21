import type { Club, FootballPlayer, PlManMatch, PlTeamSheet, SquadPlayerDetail } from "@epl/core";
import { TILE_WIDTH } from "../../../components/league/PositionTile";
import { clubIndex } from "../../../components/football/clubIndex";
import { BOARD, PANEL, phoneShows } from "@/app/desk";
import type { Match } from "./match";
import SheetRow from "./SheetRow";
import SideBySide from "./SideBySide";
import { forCode, joinOf, ordered, type Join } from "./sheetJoin";
import { fantraxPositions, type LeagueOpinion } from "../../leagueOpinions";
import { holdersOf, type Holders } from "../../holders";

// Championship Manager's team sheet, `cm9900/16.jpg`, both sides at once — stacked under a thumb, paired on a desk.

interface SheetProps {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  /** Who went off hurt, by FPL code — the commentary is the only place that says so. */
  injured: ReadonlyMap<number, number>;
  /** Our league's view of each man, by FPL code: his eligibility and his Fantrax id. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** Each man's player card, by FPL code. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  /** The one club a phone shows; a desk shows both. */
  phoneSide: "home" | "away";
  /** The reader's own team, whose men tag "Yours". */
  reader: string | null;
}

export default function TeamSheet({ match, sheets, phoneSide, league, reader, ...rest }: SheetProps) {
  const join = joinOf(match);
  const shared = { join, byCode: match.byCode, holders: holdersOf(league, reader), ...rest };
  // `min-w-0` down the chain, or a nowrap plate sets a floor that overflows 390.
  return (
    <SideBySide>
      <Side club={match.home} sheet={sheets.home} phonePicked={phoneSide === "home"} {...shared} />
      <Side club={match.away} sheet={sheets.away} phonePicked={phoneSide === "away"} {...shared} />
    </SideBySide>
  );
}

function Side({
  club,
  sheet,
  events,
  join,
  byCode,
  holders,
  injured,
  cards,
  phonePicked,
}: Omit<SheetProps, "match" | "sheets" | "phoneSide" | "league" | "reader"> & {
  club: Club | undefined;
  sheet: PlTeamSheet;
  join: Join;
  byCode: ReadonlyMap<number, FootballPlayer>;
  holders: Holders;
  phonePicked: boolean;
}) {
  const rows = ordered(sheet, events);
  const bench = rows.findIndex((row) => row.bench);

  return (
    // The club's colour on every index block; `cm-index-scoped` keeps the contrast `desk.css` measured.
    <section
      className={`${PANEL} cm-index-scoped min-w-0 ${phoneShows(phonePicked)}`}
      style={clubIndex(club)}
    >
      {/* `table-fixed` so the name truncates; no head strip, as nothing on it would print (D-25), so the widths ride
          on the columns. */}
      <table className={`${BOARD} table-fixed`}>
        <caption className="sr-only">Position, card, player and holder, goals and cards</caption>
        <colgroup>
          <col className={TILE_WIDTH} />
          <col className="w-3" />
          <col />
          <col className="w-9 lg:w-16" />
        </colgroup>
        <tbody>
          {rows.map((row, at) => (
            <SheetRow
              key={`${row.man.code ?? row.man.name}-${row.man.shirt ?? at}`}
              row={row}
              player={forCode(byCode, row.man.code)}
              holders={holders}
              positions={fantraxPositions(holders.league, row.man.code)}
              join={join}
              card={forCode(cards, row.man.code)}
              hurt={row.man.code !== null && injured.has(row.man.code)}
              opensBench={at === bench}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}
