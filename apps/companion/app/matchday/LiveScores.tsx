import {
  type CompetitionTie,
  type Fixture,
  type FootballSnapshot,
  type LiveTeamScore,
  clubById,
  fixturesInOrder,
  londonDay,
  londonTime,
  onLondonDay,
} from "@epl/core";
import { leagueTable } from "../standings";
import { roundFigures, speaksForNow, takenLately } from "../football";
import { Scores } from "./Scores";
import type { ReadableSquads } from "../squads";
import { liveScores } from "../scoreboard";
import { roundTies } from "../league/fixtures/roundTies";
import { type Marks, marksFor } from "../involvement";
import { creditAssists, roundGoals, roundStreams, withRoundState } from "../commentary";
import { roundAssistKinds } from "../assistKinds";
import { wireLines } from "./wireLines";
import { roundCodes } from "./sheetCodes";
import { fixtureGoals } from "./fixtureGoals";
import { dayStep, matchDays } from "./scoreDay";
import { now } from "../clock";
import ShareButton from "./ShareButton";
import PageFailed from "../components/league/PageFailed";
import { LIVE } from "../components/shell/sections";
import { clubPlaces } from "../prem/places";
import { placings } from "../league/placings";

/** The ties as a PNG, drawn by `share.png/route.ts`. */
const SHARE_PICTURE = `${LIVE}/share.png`;

/** Live's scores view: the draft's ties over the real football, and the ties' picture; every read here is its own. */
export default async function LiveScores({
  snapshot,
  season,
  drafted,
  silent,
  mine,
  day: asked,
}: {
  snapshot: FootballSnapshot;
  /** The whole season's fixtures, which the real table is built from. */
  season: Fixture[];
  drafted: ReadableSquads | null;
  /** The league did not answer, so its ties are missing rather than none. */
  silent: boolean;
  mine: string | null;
  /** The match day the address asks for. */
  day: string | undefined;
}) {
  const period = drafted?.roundPeriod ?? null;

  // The round's goals joined to the men who own them, off one cached read.
  const sheets = roundCodes(snapshot.gameweek, snapshot.players);
  // One batch, so the first live paint waits on the slowest read and not on their sum.
  const [goals, streams, stats, kinds, codes, league, round, { scores, fetchedAt }, table] = await Promise.all([
    sheets.then((codes) => roundGoals(snapshot.gameweek, snapshot.players, codes)),
    roundStreams(snapshot.gameweek),
    // FPL's own per-man assist counts, which audit every proposal in `creditAssists`.
    roundFigures(snapshot.gameweek),
    roundAssistKinds(snapshot.gameweek),
    sheets,
    drafted === null ? Promise.resolve<Marks>({}) : marksFor(drafted, snapshot.fixtures),
    withRoundState(fixturesInOrder(snapshot), snapshot.gameweek),
    // No draft, no schedule or a silent Fantrax costs the ties and nothing else.
    period === null ? { scores: new Map<string, LiveTeamScore>(), fetchedAt: null } : liveScores(period),
    leagueTable(),
  ]);
  const lines = wireLines(creditAssists(goals, snapshot, stats, streams, kinds, codes), snapshot, league.owners, mine);

  // One match day at a time (Craig, 5 Sep 2026: today's matches), stepped through by its arrows (19 Oct 2026);
  // the whole round when no match is dated.
  const day = dayStep(matchDays(round), londonDay(now()), asked);
  const shown: readonly Fixture[] = day === null ? round : round.filter((f) => onLondonDay(f.kickoff, day.day));
  // A refresh that failed serves the last good scores: their time prints only once they are past the present tense.
  const asOf = fetchedAt != null && !takenLately(fetchedAt) ? londonTime(fetchedAt) : null;

  // Every tie this week: the league's pairings and our cups (Craig, 5 Sep 2026).
  const ties: CompetitionTie[] =
    drafted?.info != null && period !== null
      ? roundTies(drafted.info, { gameweek: snapshot.gameweek, period })
      : [];

  return (
    <>
      <Scores
        ties={ties}
        scores={scores}
        places={placings(table)}
        clubPlaces={clubPlaces(season, snapshot.clubs)}
        mine={mine}
        fixtures={shown}
        day={day}
        clubs={clubById(snapshot)}
        now={speaksForNow(snapshot)}
        gameweek={snapshot.gameweek}
        asOf={asOf}
        goals={fixtureGoals(lines, shown)}
      />
      {silent ? <PageFailed>Draft scores are not available right now.</PageFailed> : null}
      {/* The league's ties as a picture for the group (Craig, 19 Oct 2026), under the list it draws. */}
      {ties.length > 0 ? <ShareButton href={SHARE_PICTURE} name={`draft-gameweek-${snapshot.gameweek}.png`} /> : null}
    </>
  );
}
