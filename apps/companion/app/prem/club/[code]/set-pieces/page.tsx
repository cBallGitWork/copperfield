import { availabilityOf, clubColours, fullFootballerName, setPieceOrder, squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import Section from "../../../../components/shell/Section";
import PlayerPortrait from "../../../../components/football/PlayerPortrait";
import FitnessMark from "../../../../components/football/FitnessMark";
import PlayerName from "../../../../components/shell/PlayerName";
import { doubtRow } from "../../../../components/football/doubtRow";
import { SET_PIECES, intelSetPieces } from "../../../../intel";
import { leagueOpinions } from "../../../leagueOpinions";
import { readerTeamId } from "../../../../squads";
import TakerName from "./TakerName";
import { teamNamesOf } from "../../../holders";
import ClubShell from "../Shell";
import { clubOr404, nextAndCards } from "../club";
import { INDEX_BLOCK, INDEX_WIDTH, PANEL_FLUSH } from "@/app/desk";
import { clubTitle } from "../title";

// Who steps up: corners, free kicks and penalties, in the order they take them.
// Replaced Next Match, which Fixtures duplicates (Craig, 3 Sep 2026).
// FPL has no set-piece data: it comes from the sister repo and covers about one man in five.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const generateMetadata = clubTitle("setPieces");

export default async function SetPiecesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [found, league, reader] = await Promise.all([clubOr404(code), leagueOpinions(), readerTeamId()]);
  const { club, snapshot } = found;
  const { cards } = nextAndCards(found, league);
  const colours = clubColours(club.shortName);
  const teamNames = teamNamesOf(league);

  const byCode = new Map(squadOf(snapshot, club.id).map((p) => [p.code, p]));
  // Departed takers drop before numbering, so the order still counts from 1.
  const orders = setPieceOrder(intelSetPieces.clubs[club.shortName], SET_PIECES)
    .map((order) => ({ ...order, takers: order.takers.filter((taker) => byCode.has(taker.code)) }))
    .filter((order) => order.takers.length > 0);

  return (
    <ClubShell
      club={club}
      current="setPieces"
      empty={orders.length === 0 ? ["setPieces"] : []}
    >
      {orders.length === 0 ? (
        <TabEmpty>Nobody at {club.name} has been ranked for a set piece yet.</TabEmpty>
      ) : (
        <section className={PANEL_FLUSH}>
          {orders.map((order) => (
            <Section key={order.piece} title={order.label}>
              <ul className="cm-rows flex flex-col">
                {order.takers.map((taker, at) => {
                  const player = byCode.get(taker.code);
                  if (player === undefined) return null;
                  const out = availabilityOf(player).out;
                  return (
                    <li key={taker.code} className={`flex min-h-9 items-center gap-2 pr-2 ${out ? "cm-out" : ""} ${doubtRow(player)}`}>
                      {/* The rank in CM's index block, in the club's colour (`ClubShell` scopes it). */}
                      <span className={`${INDEX_BLOCK} numeric ${INDEX_WIDTH}`}>
                        {at + 1}
                      </span>
                      <PlayerPortrait
                        player={{ code: player.code, name: player.name }}
                        colours={colours}
                      />
                      <TakerName
                        card={cards.get(player.code)}
                        held={league.get(player.code)}
                        teamNames={teamNames}
                        reader={reader}
                        mark={<FitnessMark player={player} />}
                      >
                        <PlayerName name={player.fullName} short={fullFootballerName(player)} />
                      </TakerName>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}
        </section>
      )}
    </ClubShell>
  );
}
