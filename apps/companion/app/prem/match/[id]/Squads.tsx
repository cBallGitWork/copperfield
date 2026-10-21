import type { Club, FootballPlayer, SquadPlayerDetail } from "@epl/core";
import { clubColoursOf, fullFootballerName, inkOn, onTheBooks, DASH } from "@epl/core";
import Board, { type BoardColumn } from "../../../components/league/Board";
import LeadFace, { LEAD_BOX } from "../../../components/league/LeadFace";
import FitnessMark from "../../../components/football/FitnessMark";
import { clubIndex } from "../../../components/football/clubIndex";
import { doubtRow } from "../../../components/football/doubtRow";
import { minutesInk } from "../../../components/football/xminsInk";
import { intelSquads } from "../../../intel";
import { NAME_SLACK, PANEL_FLUSH, PLATE_FRAME, QUIET_FIGURE, phoneShows, SMALL_CAPS } from "@/app/desk";
import { fantraxPositions, type LeagueOpinion } from "../../leagueOpinions";
import { holdersOf, type Holders } from "../../holders";
import LeagueHolder from "../../LeagueHolder";
import { MaybeCard } from "../../../components/league/PlayerCardButton";
import SideBySide from "./SideBySide";

// Both clubs' books before a ball is kicked, as a Draft row reads: the Fantrax tile in the club's colour, the name
// opening his card, his mark and wash, who holds him, his real position and his xMins for the match's gameweek.

/** Keeper to attack, in the squad export's own lines (`CB`, `FB`, `WF`), not the match log's. */
const LINES = ["GK", "CB", "FB", "DM", "CM", "AM", "WF", "CF"] as const;

export default function Squads({
  home,
  away,
  players,
  league,
  cards,
  phoneSide,
  reader,
  minutes,
}: {
  home: Club | undefined;
  away: Club | undefined;
  /** Every footballer in the snapshot; each side is filtered here. */
  players: readonly FootballPlayer[];
  league: ReadonlyMap<number, LeagueOpinion>;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  /** The one club a phone shows; a desk shows both. */
  phoneSide: "home" | "away";
  /** The reader's own team, whose men tag "Yours". */
  reader: string | null;
  /** xMins for the match's gameweek by FPL code; null drops the column. */
  minutes: ReadonlyMap<number, number | null> | null;
}) {
  const holders = holdersOf(league, reader);
  const side = (club: Club | undefined, picked: boolean) => (
    <Side club={club} players={players} holders={holders} cards={cards} minutes={minutes} phonePicked={picked} />
  );
  return (
    <SideBySide>
      {side(home, phoneSide === "home")}
      {side(away, phoneSide === "away")}
    </SideBySide>
  );
}

function Side({
  club,
  players,
  holders,
  cards,
  minutes,
  phonePicked,
}: {
  club: Club | undefined;
  players: readonly FootballPlayer[];
  holders: Holders;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  minutes: ReadonlyMap<number, number | null> | null;
  phonePicked: boolean;
}) {
  const colours = clubColoursOf(club);
  const squad =
    club === undefined
      ? []
      : players
          .filter((player) => player.clubId === club.id && onTheBooks(player))
          .sort((a, b) => depth(a) - depth(b) || a.name.localeCompare(b.name));

  return (
    <section className={`${PANEL_FLUSH} cm-index-scoped min-w-0 ${phoneShows(phonePicked)}`} style={clubIndex(club)}>
      {/* Names each book of two on a desk; under a thumb the lit club plate already does, so it is read, not drawn. */}
      <h2
        className={`${PLATE_FRAME} px-1.5 max-lg:sr-only ${SMALL_CAPS}`}
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        {club?.name ?? DASH}
      </h2>
      <Board
        caption={`${club?.name ?? "The club"}'s squad`}
        rows={squad}
        keyOf={(player) => String(player.id)}
        fixed
        rowClass={doubtRow}
        lead={{
          tile: { positions: (player) => fantraxPositions(holders.league, player.code) },
          name: {
            label: "Player",
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
        columns={columnsFor(minutes)}
      />
    </section>
  );
}

/** His real position, a dash for the men the exporter sends as null rather than take FPL's; then his xMins. */
function columnsFor(minutes: ReadonlyMap<number, number | null> | null): BoardColumn<FootballPlayer>[] {
  const position: BoardColumn<FootballPlayer> = {
    key: "position",
    head: "Pos",
    title: "Position on the pitch",
    width: "w-10 lg:w-12",
    cell: (player) => ({ value: intelSquads.get(player.code)?.position ?? DASH, className: QUIET_FIGURE }),
  };
  if (minutes === null) return [position];
  return [
    position,
    {
      key: "xmins",
      head: "xMins",
      title: "Expected minutes, this gameweek",
      width: "w-12 lg:w-16",
      cell: (player) => {
        const value = minutes.get(player.code) ?? null;
        return { value: value ?? DASH, className: `font-bold ${minutesInk(value)}` };
      },
    },
  ];
}

/** Where a man sits in the reading order; a line nobody has settled sorts last. */
function depth(player: FootballPlayer): number {
  const line = intelSquads.get(player.code)?.line ?? null;
  const at = line === null ? -1 : LINES.indexOf(line as (typeof LINES)[number]);
  return at === -1 ? LINES.length : at;
}
