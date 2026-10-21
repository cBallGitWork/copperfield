import { availabilityOf, clubColours, fullFootballerName, setPieceOrder, squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import Section from "../../../../components/shell/Section";
import PlayerPortrait from "../../../../components/football/PlayerPortrait";
import StateBox from "../../../../components/football/StateBox";
import PlayerName from "../../../../components/shell/PlayerName";
import { doubtRow } from "../../../../components/football/doubtRow";
import { SET_PIECES, intelSetPieces } from "../../../../intel";
import { leagueOpinions } from "../../../leagueOpinions";
import { readerTeamId } from "../../../../squads";
import { Holder } from "../../../../players/BoardRow";
import { teamNamesOf } from "./holders";
import { poolHref } from "../../../poolHref";
import NameLink from "../NameLink";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";
import { INDEX_BLOCK, INDEX_WIDTH, PANEL, ROW_NAME } from "@/app/desk";
import { clubTitle } from "../title";

// Who steps up: corners, free kicks and penalties, in the order they take them.
// Replaced Next Match, which Fixtures duplicates (Craig, 3 Sep 2026).
// FPL has no set-piece data: it comes from the sister repo and covers about one man in five.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const generateMetadata = clubTitle("setPieces");

export default async function SetPiecesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [{ club, snapshot }, league, reader] = await Promise.all([clubOr404(code), leagueOpinions(), readerTeamId()]);
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
        <section className={PANEL}>
          {orders.map((order) => (
            <Section key={order.piece} title={order.label}>
              <ul className="cm-rows flex flex-col">
                {order.takers.map((taker, at) => {
                  const player = byCode.get(taker.code);
                  if (player === undefined) return null;
                  const out = availabilityOf(player).out;
                  const held = league.get(player.code);
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
                      <NameLink
                        href={poolHref(league, player.code)}
                        // The row's floor restated on the link, which `tapfit` measures; `self-stretch` lands one short.
                        className={`flex min-h-9 min-w-0 flex-1 items-center truncate text-ink ${ROW_NAME}`}
                      >
                        <PlayerName name={player.fullName} short={fullFootballerName(player)} />
                      </NameLink>
                      {/* Who holds him, bracketed as the boards print it: (FA)/(WW) free, a team's short name, (Yours). */}
                      {held === undefined ? null : (
                        <Holder held={held} teamNames={teamNames} reader={reader} className="max-w-28 shrink-0" />
                      )}
                      <StateBox player={player} />
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
