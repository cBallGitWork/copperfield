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
import { SquadList, arrangeBoth } from "./sides";
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
import { liveScores, squadLivePoints } from "../../../scoreboard";
import { newsFor, readPoolNews } from "../../../poolNews";
import { myTeamId } from "../../../session";
import { MATCHUPS, matchupHref } from "../../routes";
import { wholeNumber } from "../../../wholeNumber";
import { sheetEvents } from "./events";
import { DEFAULT_SIDE_SORT, matchupTabs, matchupView, pickTie, statsHref, statsOf, tieTabs } from "./views";
import { boardCategories, boardColumns } from "./sideRows";
import { FootFrame } from "../../../components/shell/FootFrame";
import TabStrip from "../../../components/shell/TabStrip";
import { everyone, subMarks } from "./subs";
import ScoreboardDown from "../../ScoreboardDown";
import StatsViews from "./StatsViews";
import { benchOrder } from "../../../benchOrders";
import { roundUnderway } from "../../../football";
import { toPlayWord } from "../../../components/league/toPlay";
import RoundWord from "../../../components/league/RoundWord";
import { withoutFitness } from "./pastWeek";
import { leagueFixturesHref } from "../../SectionNav";
import { autoSubbed } from "../../../components/league/autoSubbed";

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
  const squads = readableOr404(await getLeagueSquads(round), MATCHUPS);

  // Undrafted is a 404; the other two states go to the board, which describes them.
  const period = squads.roundPeriod;
  if (squads.info === null || period === null) redirect(MATCHUPS);

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

  // One cached read of the whole pool's news, narrowed per sheet below.
  const [mine, stories] = await Promise.all([myTeamId(squads.period.teams), readPoolNews()]);
  const { scores, subs, refused } = await liveScores(period);
  // Under way, gaps between kickoffs included: "all played" says something only then.
  const underway = roundUnderway(squads.snapshot);
  // A finished week says so under each name, and wears none of today's fitness (review N9).
  const state = roundState(squads.snapshot);
  const over = state === null || state === "live" ? null : <RoundWord state={state} />;
  // The league's own names for its categories.
  const categories = squads.info.scoringCategories;
  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  /** Whether a side's eleven goes on screen, asked before the fetch it decides. */
  const shows = (team: LeagueTeam) =>
    rostered.get(team.teamId) !== undefined &&
    teamDisplay(squads, team.teamId === mine).show === "lineup";

  // Each man's points off the scoreboard's own live payload, priced at his slot, so an eleven adds up to its header.
  // Only for a side whose eleven shows, once a ball is kicked: where a man is priced says who is in it.
  // Fantrax's bench order for the period: fixed once a ball is kicked, still the manager's to change before.
  const benchOf = async (team: LeagueTeam) =>
    [team.teamId, shows(team) ? await benchOrder(team.teamId, period, started) : []] as const;
  const [yours, theirs, ...benched] = await Promise.all([
    started && shows(pairing.team) ? squadLivePoints(period, pairing.team.teamId, categories) : null,
    started && shows(pairing.opponent) ? squadLivePoints(period, pairing.opponent.teamId, categories) : null,
    benchOf(pairing.team),
    benchOf(pairing.opponent),
  ]);
  const benches = new Map(benched);
  const scored = new Map([
    [pairing.team.teamId, yours],
    [pairing.opponent.teamId, theirs],
  ]);

  const { arranged: sheets, widest } = arrangeBoth({ pairing, rostered, shows, scored, benches, clubs, opposition });
  // After the auto subs, so the eleven on the grass is the one the score counts.
  const made = new Map([...sheets].map(([id, sheet]) => [id, autoSubbed(over === null ? sheet : withoutFitness(sheet), subs.get(id) ?? [])]));
  const arranged = new Map([...made].map(([id, { sheet }]) => [id, sheet]));
  const listed = started ? null : unplayedLists({ pairing, rostered, shows, benches, clubs, opposition });

  // Who came on and off, which only the pitch marks.
  const events = view === "lineups" ? await sheetEvents(arranged.values(), squads.snapshot) : new Map();

  // The league's categories either side has a count in, so both boards carry the same columns.
  const printed = boardCategories(categories);
  const columns = boardColumns(printed, arranged.values(), { ...yours?.counts, ...theirs?.counts });
  // Which of each eleven put the points on the board; a gated side arrives as `{}` and names nobody.
  const codes = new Set(Object.values(printed).map((category) => category.code));
  const bands = bandCategories(yours?.counted ?? {}, theirs?.counted ?? {}).filter((band) => codes.has(band.code));

  // Joined on the server, and only once the gate has opened his eleven: what crosses is his men's own detail.
  const side = ({ team, detail, withheld }: SharedSide): MatchupSide => {
    const priced = scored.get(team.teamId) ?? null;
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
            subs={subMarks(everyone(detail), events)}
            autoSubs={made.get(team.teamId)?.marks}
            breakdown={priced?.breakdown ?? {}}
            played={priced?.played}
            // This sheet's men only — a story is keyed by player, and would name a withheld eleven.
            news={over === null ? newsFor(stories, everyone(detail).map((player) => player.rostered.slot.fantraxId)) : {}}
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
