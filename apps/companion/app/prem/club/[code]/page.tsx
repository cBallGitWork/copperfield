import {
  clubById,
  nextFixtures,
  predictedEleven,
  squadOf,
  xiFault,
  londonDayAndDate,
  londonMoment,
  ordinal,
} from "@epl/core";
import TabEmpty from "../../../components/league/TabEmpty";
import ButtonLink from "../../../components/shell/ButtonLink";
import ClubShell from "./Shell";
import Squad, { drawsEleven } from "./Squad";
import PitchListStrip, { pitchListOf } from "./PitchList";
import { squadOrder } from "./squadOrder";
import { TABLE } from "../../PremNav";
import { clubHref } from "../../routes";
import { intelSquads } from "../../../intel";
import { predictedElevens } from "../../../predictedXi";
import { PANEL } from "@/app/desk";
import { clubOr404 } from "./club";
import { clubPlaces } from "../../places";
import { leagueOpinions } from "../../leagueOpinions";
import { readerTeamId } from "../../../squads";
import { XMINS_AS_OF, weekMinutes } from "../../../xmins";
import { clubTitle } from "./title";

// One club's squad, the screen every club name in this section links to.
// FPL's `squad_number` is null on every element, so there is no shirt number to sort by.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const generateMetadata = clubTitle("squad");

export default async function ClubSquadPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  // The list opens first: the squad is a fact and the eleven a prediction (DESIGN §9).
  const view = pitchListOf(query.view, "list");
  const [{ club, snapshot, fixtures }, league, xi, reader] = await Promise.all([
    clubOr404(code),
    leagueOpinions(),
    predictedElevens(),
    readerTeamId(),
  ]);

  const place = clubPlaces(fixtures, snapshot.clubs).get(club.id);

  // `squadOf` drops the departed and leaves the order to the caller.
  const squad = squadOf(snapshot, club.id).sort(squadOrder(league, (code) => intelSquads.get(code)?.depthTier));

  // The season's fixtures, not the round in view: a blank gameweek can put the next match weeks off.
  const [next] = nextFixtures(fixtures, clubById(snapshot), club.id, 1);
  const against =
    next === undefined
      ? null
      : `v ${next.club.shortName}` +
        (next.fixture.kickoff === null ? "" : ` · ${londonDayAndDate(next.fixture.kickoff)}`);

  // xMins for the club's next match week, not the round in view.
  const gameweek = next?.fixture.gameweek ?? null;
  const minutes = weekMinutes(gameweek, squad.map((player) => player.code));

  // Scout's latest eleven, always drawn with when it was updated (Craig, 23 Sep 2026).
  // `xiFault` refuses only a broken one: a pitch with ten men on it is the failure nobody notices.
  const predicted = xi.clubs[club.shortName];
  const eleven = xiFault(predicted) === null ? predictedEleven(predicted) : [];
  const updated = xi.fetchedAt === null ? null : londonMoment(xi.fetchedAt);
  const formation = predicted?.formation ?? null;
  const picks = squad.length > 0 && drawsEleven(eleven, formation);

  return (
    <ClubShell club={club} current="squad" foot={picks ? <PitchListStrip href={clubHref(club.code)} view={view} /> : undefined}>
      <section className={PANEL}>
        {squad.length === 0 ? (
          <TabEmpty>No squad listed.</TabEmpty>
        ) : (
          <>
            <Squad
              view={view}
              players={squad}
              league={league}
              reader={reader}
              minutes={gameweek === null || minutes === null ? null : { gameweek, byCode: minutes, asOf: XMINS_AS_OF }}
              club={club}
              eleven={eleven}
              formation={formation}
              against={against}
              updated={updated}
            />
            {/* No paragraph explaining the order (Craig, 5 Sep 2026). */}
          </>
        )}
      </section>

      {/* The club's standing as a button, as `cm9900/25.jpg`'s foot row draws it. */}
      <ButtonLink href={TABLE}>
        {place === undefined ? "Back to the table" : `${ordinal(place)} in the Premiership`}
      </ButtonLink>
    </ClubShell>
  );
}
