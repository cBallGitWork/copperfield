import {
  type CompetitionTie,
  type Fixture,
  type FootballSnapshot,
  type LiveTeamScore,
  FANTRAX_MATCHUPS_PATH,
  MS_PER_MINUTE,
  clubById,
  datedKickoffs,
  fixturesInOrder,
  leagueTies,
  nextRound,
  periodPairings,
  roundState,
  cupTies,
  londonDay,
  londonTime,
  nextDeadline,
  onLondonDay,
} from "@epl/core";
import { leagueTable } from "../standings";
import { footballNow, liveOpen, roundFigures, seasonFixtures, speaksForNow, takenLately } from "../football";
import { Scores } from "./Scores";
import RoundWord from "../components/league/RoundWord";
import PageHeader from "../components/shell/PageHeader";
import TabStrip from "../components/shell/TabStrip";
import { getLeagueSquads, readable, readerTeamId } from "../squads";
import { liveScores } from "../scoreboard";
import { marks } from "../involvement";
import { creditAssists, roundGoals, roundStreams, withRoundState } from "../commentary";
import { roundAssistKinds } from "../assistKinds";
import TopStats, { STATS_VIEW, TOP_STATS, statsHref } from "./TopStats";
import { gameweekBoards } from "./boards";
import { wireLines } from "./wireLines";
import { roundCodes } from "./sheetCodes";
import { fixtureGoals } from "./fixtureGoals";
import { dayStep, matchDays } from "./scoreDay";
import { lockAhead } from "../lockAhead";
import { now } from "../clock";
import { BetweenGameweeks } from "./Between";
import ShareButton from "./ShareButton";
import OutLink from "../components/shell/OutLink";
import { fantraxPage } from "../fantraxPages";
import Link from "@/app/components/shell/Link";
import { LIVE } from "../components/shell/sections";
import { MY_TEAM } from "../squad/routes";
import { clubPlaces } from "../prem/places";
import { placings } from "../league/placings";
import type { Metadata } from "next";
import { orDegraded } from "../refusals";
import { draftGameweek, titled } from "../titles";

/** The ties as a PNG, drawn by `share.png/route.ts`. */
const SHARE_PICTURE = `${LIVE}/share.png`;

// The live centre: your head-to-head first, the real football under it. The football half runs
// off FPL's public API alone, so it works with no Fantrax, no draft and no credential.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

/** The bar's words, off the page's own cached snapshot; the league's name alone when FPL could not be asked. */
export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await orDegraded(footballNow(), () => null);
  return snapshot === null ? {} : titled(draftGameweek(snapshot.gameweek));
}

/** The snapshot and whether there is football on; the clock is read here so a render reproduces. */
async function matchday(): Promise<{
  snapshot: FootballSnapshot;
  /** The whole season's fixtures, kept because the real table is built from them. */
  season: Fixture[];
  during: boolean;
  up: { gameweek: number; kickoff: string } | null;
}> {
  // The season, because the snapshot holds one round and cannot name the next.
  const [snapshot, season] = await Promise.all([footballNow(), seasonFixtures()]);
  return { snapshot, season, during: liveOpen(snapshot), up: nextRound(season, now().toISOString()) };
}

export default async function MatchdayPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stat?: string; day?: string }>;
}) {
  // Scores is the landing view (Craig, 21 Sep 2026); the top stats are a tap away.
  const query = await searchParams;
  const leading = query.view === STATS_VIEW;
  const { snapshot, season, during, up } = await matchday();
  const league = await marks(snapshot.fixtures);

  // The round's goals joined to the men who own them, off one cached read.
  const sheets = roundCodes(snapshot.gameweek, snapshot.players);
  const [goals, streams, stats, mine, squads, kinds, codes] = await Promise.all([
    sheets.then((codes) => roundGoals(snapshot.gameweek, snapshot.players, codes)),
    roundStreams(snapshot.gameweek),
    // FPL's own per-man assist counts, which audit every proposal in `creditAssists`.
    roundFigures(snapshot.gameweek),
    readerTeamId(),
    getLeagueSquads(),
    roundAssistKinds(snapshot.gameweek),
    sheets,
  ]);
  const scored = creditAssists(goals, snapshot, stats, streams, kinds, codes);

  const lines = wireLines(scored, snapshot, league.owners, mine);

  const realPlaces = clubPlaces(season, snapshot.clubs);

  // One match day at a time (Craig, 5 Sep 2026: today's matches), stepped through by its arrows (19 Oct 2026);
  // the whole round when no match is dated.
  const round = await withRoundState(fixturesInOrder(snapshot), snapshot.gameweek);
  const day = dayStep(matchDays(round), londonDay(now()), query.day);
  const shown: readonly Fixture[] = day === null ? round : round.filter((f) => onLondonDay(f.kickoff, day.day));

  // The draft's ties; no draft, no schedule or a silent Fantrax costs this half and nothing else.
  const drafted = readable(squads);
  const period = drafted?.roundPeriod ?? null;
  const [{ scores, fetchedAt }, table] = await Promise.all([
    period === null ? { scores: new Map<string, LiveTeamScore>(), fetchedAt: null } : liveScores(period),
    leagueTable(),
  ]);
  // A refresh that failed serves the last good scores: their time prints only once they are past the present tense.
  const asOf = fetchedAt != null && !takenLately(fetchedAt) ? londonTime(fetchedAt) : null;

  const places = placings(table);

  // The hour before the first kickoff (Craig, 8 Oct 2026: "build the hype"): the minutes to go, and the lock if ahead.
  const first = round.find((fixture) => fixture.kickoff !== null)?.kickoff ?? null;
  const toGo = during && first !== null ? Date.parse(first) - now().getTime() : 0;
  const lock = drafted?.info == null ? null : nextDeadline(drafted.info.rosterPeriods, datedKickoffs(season), now().toISOString());
  const locksAt = lock !== null && first !== null && Date.parse(lock.locksAt) < Date.parse(first) ? lock.locksAt : null;
  const buildUp = toGo > 0 ? <BuildUp ms={toGo} locksAt={locksAt} /> : null;
  const state = roundState(snapshot);
  // Between gameweeks, the coming one's lock, the time that matters before its kickoff.
  const nextLock = !during && up !== null ? await lockAhead(up.gameweek) : null;

  // Every tie this week: the league's pairings and our cups (Craig, 5 Sep 2026).
  const ties: CompetitionTie[] =
    drafted?.info != null && period !== null
      ? [
          ...leagueTies(periodPairings(drafted.info.matchups, drafted.info.teams, period)),
          ...cupTies(drafted.info.teams.length, snapshot.gameweek),
        ]
      : [];

  // The gameweek's leaders: Fantrax's live and pool reads, the stats league's DefCon counts and FPL's round.
  const top = leading ? await gameweekBoards(snapshot, stats, period) : null;

  // Between gameweeks the route still answers, saying where the football went.
  return (
    <div className="flex flex-col gap-4">
      {/* The round and its state are the page's title (Craig, 5 Sep 2026: "gameweek 3 LIVE as the
          title"); the sub line carries "Full time" or "Final", never LIVE twice. */}
      <PageHeader
        title={`${draftGameweek(snapshot.gameweek)}${state === "live" ? " LIVE" : ""}`}
        sub={buildUp ?? (state === null || state === "live" ? undefined : <RoundWord state={state} />)}
        competition
      />
      <TabStrip
        label="Which view"
        tabs={[
          { key: "scores", label: "Scores", href: LIVE },
          { key: STATS_VIEW, label: TOP_STATS, href: statsHref() },
        ]}
        current={leading ? STATS_VIEW : "scores"}
      />
      {top !== null ? (
        <TopStats boards={top.boards} stat={query.stat} teamNames={top.teamNames} reader={mine} />
      ) : during ? (
        <Scores
          ties={ties}
          scores={scores}
          places={places}
          clubPlaces={realPlaces}
          mine={mine}
          fixtures={shown}
          day={day}
          clubs={clubById(snapshot)}
          now={speaksForNow(snapshot)}
          gameweek={snapshot.gameweek}
          asOf={asOf}
          goals={fixtureGoals(lines, shown)}
        />
      ) : (
        <BetweenGameweeks snapshot={snapshot} up={up} locksAt={nextLock} />
      )}
      {/* The league's ties as a picture for the group (Craig, 19 Oct 2026), under the list it draws. */}
      {top === null && during && ties.length > 0 ? (
        <ShareButton href={SHARE_PICTURE} name={`draft-gameweek-${snapshot.gameweek}.png`} />
      ) : null}
      {/* Fantrax's Matchups for this gameweek's period; its current one when we could not read it. */}
      <OutLink href={fantraxPage(FANTRAX_MATCHUPS_PATH, period)}>
        Matchups on Fantrax
      </OutLink>
    </div>
  );
}

/** The build-up's line: whole minutes to the first kickoff, rounded up, then the lineup lock while it is ahead, as a
 *  way to his team, whose tab Live has taken on a phone. */
function BuildUp({ ms, locksAt }: { ms: number; locksAt: string | null }) {
  const kickoff = `Kick-off in ${Math.ceil(ms / MS_PER_MINUTE)} min`;
  if (locksAt === null) return kickoff;
  // One span: the sub line is a flex row, which drops the space between bare text and a link.
  return (
    <span>
      {kickoff} ·{" "}
      <Link href={MY_TEAM} className="underline">
        line-ups lock {londonTime(locksAt)}
      </Link>
    </span>
  );
}
