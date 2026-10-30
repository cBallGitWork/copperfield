import { notFound, redirect } from "next/navigation";
import {
  type LeagueTeam,
  bandCategories,
  clubById,
  gameweekStarted,
  headToHeads,
  nextPairedPeriod,
  openingGameweek,
  oppositionByClub,
  roundState,
} from "@epl/core";
import MatchupBoard, { type MatchupSide } from "../../../components/league/MatchupBoard";
import Nothing from "../../../components/shell/Nothing";
import TeamSheet from "../../../components/league/TeamSheet";
import { SquadList } from "./sides";
import { teamSheet } from "../../../teamSheet";
import { widestLine } from "../../../components/league/PitchRows";
import { unplayedLists, unplayedSheet } from "./unplayed";
import { SideTab, StatsTab, sharedSides, withheldNotice, type SharedSide } from "./tabs";
import { FixturesTab, TableTab } from "./wider";
import LeagueShell from "../../Shell";
import PhotoGround from "../../../components/football/PhotoGround";
import { venueOf } from "../../../venues";
import { HEAD_TO_HEAD, versus } from "../../../titles";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../../squads";
import { leagueInfo, readCalendar } from "../../../round";
import { askedWeek, leagueWeeks } from "../../../squad/[teamId]/weeks";
import { headToHeadTitle } from "./title";
import { liveScores } from "../../../scoreboard";
import { myTeamId } from "../../../session";
import { now } from "../../../clock";
import { MATCHUPS, matchupHref } from "../../routes";
import { wholeNumber } from "../../../wholeNumber";
import { DEFAULT_SIDE_SORT, matchupTabs, matchupView, pickTie, statsHref, statsOf, tieTabs } from "./views";
import { boardCategories, boardColumns } from "./sideRows";
import { FootFrame } from "../../../components/shell/FootFrame";
import TabStrip from "../../../components/shell/TabStrip";
import ScoreboardDown from "../../ScoreboardDown";
import StatsViews from "./StatsViews";
import { roundUnderway } from "../../../football";
import { toPlayWord } from "../../../components/league/toPlay";
import RoundWord from "../../../components/league/RoundWord";
import { leagueFixturesHref } from "../../SectionNav";

// One head-to-head: the scoreline and the elevens behind it. The URL's team is the side the board opens on; the side
// Fantrax calls home decides only the ground, its venue.

export const revalidate = 30;

export const generateMetadata = headToHeadTitle;

export default async function HeadToHeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** No `gw` is the round Fantrax points at; the schedule sends one, so a played round opens on its own week. */
  searchParams: Promise<{ gw?: string; view?: string; of?: string; sort?: string; dir?: string; vs?: string }>;
}) {
  const [{ teamId }, query] = await Promise.all([params, searchParams]);
  const { gw } = query;
  const of = statsOf(query.of);
  const sort = { head: query.sort ?? DEFAULT_SIDE_SORT, descending: query.dir !== "asc" };

  // Through the calendar seam, the league's weeks only: a gameweek it does not play opens the default (#529).
  const [info, calendar] = await Promise.all([leagueInfo(), readCalendar()]);
  const round = askedWeek(leagueWeeks(calendar, info?.matchups ?? []), wholeNumber(gw));
  // The retired Matchups list 308s to Fixtures, so a round we cannot name still lands there.
  const squads = readableOr404(await getLeagueSquads(round), round === null ? MATCHUPS : leagueFixturesHref(round.gameweek));

  // Undrafted is a 404; the other two states go to Fixtures, which describes them.
  const period = squads.roundPeriod;
  if (squads.info === null || period === null) redirect(leagueFixturesHref(squads.snapshot.gameweek));

  // A round nobody has kicked off draws each side as a squad list, on the same board. `gameweekStarted`, not
  // `roundState`, which is null between two Saturday kickoffs too.
  const started = gameweekStarted(squads.snapshot.fixtures, squads.snapshot.gameweek);
  // Stats has nothing to count before a ball is kicked, so its plate waits for kickoff.
  const asked = matchupView(query.view);
  const view = started || asked !== "stats" ? asked : matchupView(undefined);

  const rostered = new Map(squads.period.teams.map((team) => [team.teamId, team]));
  const named = rostered.get(teamId);
  if (named === undefined) notFound();

  // A double header is two ties: `vs` names the one on screen, and a strip switches between them.
  const ties = headToHeads(squads.info.matchups, squads.info.teams, period, teamId);
  const pairing = pickTie(ties, query.vs);
  const heading = <>Gameweek {squads.snapshot.gameweek}</>;

  if (pairing === undefined) {
    // Asked for no round, a team between fixtures opens on its next one: before the first, every tie stood empty.
    const later = round === null ? nextPairedPeriod(squads.info.matchups, squads.info.teams, period, teamId) : undefined;
    const gameweek = later === undefined ? undefined : openingGameweek(calendar, later);
    if (gameweek !== undefined) redirect(matchupHref(teamId, gameweek, query.view));

    return (
      <LeagueShell current="matchups" title={HEAD_TO_HEAD} sub={heading}>
        <PhotoGround subject={null} />
        <Nothing title="No match this gameweek" code={`gameweek ${squads.snapshot.gameweek}`} />
      </LeagueShell>
    );
  }

  const mine = await myTeamId(squads.period.teams);
  const { scores, refused } = await liveScores(period);
  // Under way, gaps between kickoffs included: "all played" says something only then.
  const underway = roundUnderway(squads.snapshot);
  // A finished week says so under each name.
  const state = roundState(squads.snapshot, now().toISOString());
  const over = state === null || state === "live" ? null : <RoundWord state={state} />;
  // The league's own names for its categories.
  const categories = squads.info.scoringCategories;
  /** Whether a side's eleven goes on screen, asked before the fetch it decides. */
  const shows = (team: LeagueTeam) =>
    rostered.get(team.teamId) !== undefined &&
    teamDisplay(squads, team.teamId === mine).show === "lineup";

  // Each shown side's sheet as the Team tab draws it; only behind the gate, since where a man is priced says who starts.
  const drawn = new Map(
    await Promise.all(
      [pairing.team, pairing.opponent].flatMap((team) => {
        const roster = rostered.get(team.teamId);
        return roster === undefined || !shows(team) ? [] : [teamSheet(squads, roster).then((read) => [team.teamId, read] as const)];
      }),
    ),
  );
  const yours = drawn.get(pairing.team.teamId)?.live ?? null;
  const theirs = drawn.get(pairing.opponent.teamId)?.live ?? null;
  const arranged = new Map([...drawn].map(([id, read]) => [id, read.sheet]));
  // One card size for both sides, so the pitch holds still as the reader flips; a withheld side's shape would leak.
  const widest = Math.max(1, ...[...arranged.values()].map((sheet) => widestLine([...sheet.rows, { players: sheet.bench }])));
  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  const listed = started ? null : unplayedLists({ pairing, rostered, shows, arranged, clubs, opposition });

  // The league's categories either side has a count in, so both boards carry the same columns.
  const printed = boardCategories(categories);
  const columns = boardColumns(printed, arranged.values(), { ...yours?.counts, ...theirs?.counts });
  // Which of each eleven put the points on the board; a gated side arrives as `{}` and names nobody.
  const codes = new Set(Object.values(printed).map((category) => category.code));
  const bands = bandCategories(yours?.counted ?? {}, theirs?.counted ?? {}).filter((band) => codes.has(band.code));

  // Joined on the server, and only once the gate has opened his eleven: what crosses is his men's own detail.
  const side = ({ team, detail, withheld }: SharedSide): MatchupSide => {
    const sheet = drawn.get(team.teamId);
    const priced = sheet?.live ?? null;
    const score = scores.get(team.teamId);
    return {
      team,
      // Fantrax's 0 before kickoff is no score yet, so the plate keeps its dash.
      score: started ? score : undefined,
      mine: team.teamId === mine,
      line: over ?? toPlayWord(score?.toPlay, underway),
      lineup:
        listed !== null ? (
          <SquadList listed={listed.get(team.teamId)} teamId={team.teamId} />
        ) : detail === undefined ? (
          withheld
        ) : (
          <TeamSheet
            rows={detail.rows}
            bench={detail.bench}
            widest={widest}
            subs={sheet?.subs}
            autoSubs={sheet?.marks}
            breakdown={priced?.breakdown ?? {}}
            played={priced?.played}
            // This sheet's men only — a story is keyed by player, and would name a withheld eleven.
            news={sheet?.news ?? {}}
            mode="pitch"
          />
        ),
    };
  };

  const both = sharedSides({ pairing, rostered, shows, arranged, squads, mine, calendar });
  const withheld = withheldNotice(both);
  const gameweek = round?.gameweek;
  const vs = pairing === ties[0] ? undefined : pairing.opponent.teamId;
  const switcher = tieTabs(teamId, gameweek, view, ties);
  // ← on a board opened cold: this gameweek on Draft › Fixtures, where its ties are listed (review M12).
  const back = leagueFixturesHref(squads.snapshot.gameweek);
  const stat = both[of === "opponent" ? 1 : 0];
  // Before kickoff a rival's squad is public, unarranged, so Fixtures names his men as Line-ups lists them.
  const unplayedOf = (team: LeagueTeam) => {
    const side = listed?.get(team.teamId);
    return side === undefined ? undefined : unplayedSheet(side);
  };

  return (
    // A match screen: the scoreline is its header, and its strip picks one of its own views.
    <FootFrame
      // A double header's tie strip takes a row from a phone's filled pitch (`pitch.css`).
      className={switcher.length === 0 ? "" : "pitch-ties"}
      foot={
        view === "stats" ? (
          <StatsViews teams={[both[0].team, both[1].team]} current={of} teamId={teamId} gameweek={gameweek} vs={vs} />
        ) : undefined
      }
    >
      <PhotoGround photo={venueOf(pairing.home.teamId)} />
      {/* The scoreline is this screen's title bar, but its halves are buttons: the h1 is said, not drawn. */}
      <h1 className="sr-only">{versus(pairing.team.name, pairing.opponent.name)}</h1>
      {refused === null ? null : <ScoreboardDown refused={refused} />}
      {switcher.length === 0 ? null : <TabStrip label="Ties this gameweek" current={pairing.opponent.teamId} tabs={switcher} />}
      <MatchupBoard
        back={back}
        team={side(both[0])}
        opponent={side(both[1])}
        view={view}
        tabs={matchupTabs(teamId, gameweek, vs).filter((tab) => started || tab.key !== "stats")}
        body={
          view === "stats" && of !== "fantasy" ? (
            <SideTab
              side={stat}
              columns={columns}
              counts={(of === "team" ? yours : theirs)?.counts ?? {}}
              breakdown={(of === "team" ? yours : theirs)?.breakdown ?? {}}
              sort={sort}
              hrefFor={(head: string) =>
                statsHref(teamId, gameweek, of, { head, descending: head === sort.head ? !sort.descending : true }, vs)
              }
            />
          ) : view === "stats" ? (
            <StatsTab
              bands={bands}
              names={both[0].names}
              theirNames={both[1].names}
              priced={[yours !== null, theirs !== null]}
              withheld={withheld}
            />
          ) : view === "table" ? (
            <TableTab tie={[pairing.team.teamId, pairing.opponent.teamId]} mine={mine} />
          ) : view === "fixtures" ? (
            <FixturesTab
              fixtures={squads.snapshot.fixtures}
              sides={listed === null ? both : both.map((side) => ({ ...side, detail: unplayedOf(side.team) }))}
              snapshotClubs={squads.snapshot.clubs}
              withheld={listed === null ? withheld : null}
              kicked={listed === null}
            />
          ) : null
        }
      />
    </FootFrame>
  );
}
