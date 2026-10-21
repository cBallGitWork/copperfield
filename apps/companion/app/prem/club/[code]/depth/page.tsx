import { depthLines, londonMoment, squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { intelDepth, intelDepthManifest } from "../../../../intel";
import ClubShell from "../Shell";
import { leagueOpinions } from "../../../leagueOpinions";
import { clubOr404, nextAndCards } from "../club";
import DepthList from "./DepthList";
import DepthPitch from "./DepthPitch";
import BothReadings from "../../../../components/league/BothReadings";
import PitchListStrip, { pitchListOf } from "../PitchList";
import { clubHref } from "../../../routes";
import { PANEL, PITCH_CAPTION } from "@/app/desk";
import { clubTitle } from "../title";
import { weekMinutes } from "../../../../xmins";

// Who is in line for each shirt at a club: the sister repo's depth chart (Craig, 25 Sep 2026), dated by its export.

export const revalidate = 30;

export const generateMetadata = clubTitle("depth");

export default async function DepthPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const view = pitchListOf(query.view, "pitch");
  const [found, league] = await Promise.all([clubOr404(code), leagueOpinions()]);
  const { club, snapshot } = found;
  const chart = intelDepth.get(club.shortName);
  const players = new Map(squadOf(snapshot, club.id).map((player) => [player.code, player]));
  const playerOf = (code: number) => players.get(code) ?? null;
  const lines = chart === undefined ? [] : depthLines(chart);
  const empty = chart === undefined || lines.length === 0;

  // xMins for the club's next match week, not the round in view.
  const { next, cards } = nextAndCards(found, league);
  const cardOf = (code: number) => cards.get(code);
  const gameweek = next?.fixture.gameweek ?? null;
  const byCode = weekMinutes(gameweek, [...players.keys()]);
  const minutes = gameweek === null || byCode === null ? null : { gameweek, byCode };

  return (
    <ClubShell
      club={club}
      current="depth"
      empty={lines.length === 0 ? ["depth"] : []}
      foot={empty ? undefined : <PitchListStrip href={`${clubHref(club.code)}/depth`} view={view} />}
    >
      {empty ? (
        <TabEmpty>There is no pecking order for {club.name} yet.</TabEmpty>
      ) : (
        <section className={PANEL}>
          {/* Not "Depth chart", American football's term, nor "Likely XI": nobody here forecasts who starts. */}
          <p className={`cm-title ${PITCH_CAPTION}`}>
            Pecking order · {chart.formation}{" "}
            (last updated {londonMoment(intelDepthManifest.exportedAt)})
          </p>
          <BothReadings
            view={view}
            list={<DepthList lines={lines} playerOf={playerOf} cardOf={cardOf} minutes={minutes} />}
            pitch={<DepthPitch lines={lines} playerOf={playerOf} cardOf={cardOf} minutes={minutes} />}
          />
        </section>
      )}
    </ClubShell>
  );
}
