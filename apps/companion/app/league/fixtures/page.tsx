import { seededIn } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import FantraxSilent from "../../components/shell/FantraxSilent";
import { beside, openGameweek } from "../../components/shell/gameweekStep";
import LeagueShell from "../Shell";
import Round, { EMPTY } from "../schedule/Round";
import { getSchedule, getSeasonResults, type ScheduleRound } from "../schedule/schedule";
import { liveScores, pendingByTeam } from "../../scoreboard";
import { getLeagueSquads, readable, readerTeamId } from "../../squads";
import { leagueScoring } from "../../scoring";
import { placings } from "../placings";
import ScoreboardDown from "../ScoreboardDown";
import { leagueFixturesHref } from "../SectionNav";
import { wholeNumber } from "../../wholeNumber";
import { fixtureTies, onTheCard, roundTies } from "./roundTies";
import { LEAGUE_CAPTION, titled } from "../../titles";

// One gameweek at a time, every competition on it: a played week's results, a week to come's fixtures (Craig, 13 Oct
// 2026: Schedule and Results were two rows of the same thing). `?gw=` picks it; without one, the latest under way,
// or the next once that one is done. Matchups folded in here on 20 Oct 2026 (Craig): yours first, clean sheets owed.

export const revalidate = 30;

export const metadata = titled(LEAGUE_CAPTION.fixtures);

export default async function FixturesPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const [{ gw }, read, mine] = await Promise.all([searchParams, getSchedule(), readerTeamId()]);

  if ("unavailable" in read) {
    return (
      <LeagueShell current="fixtures">
        <FantraxSilent code={read.unavailable} />
      </LeagueShell>
    );
  }

  const { info, table } = read;
  // Only the gameweeks with a tie on: the league's calendar runs from GW1, its pairings from its first period.
  const rounds = onTheCard(info, read.rounds);
  const gameweek = openGameweek(
    rounds.map((each) => ({ ...each, finished: each.status === "finished" })),
    wholeNumber(gw),
  );
  const round = rounds.find((each) => each.gameweek === gameweek);

  if (round === undefined) {
    return (
      <LeagueShell current="fixtures">
        <Nothing title="No schedule yet" code={`${info.scoringPeriods.length} scoring periods, 0 gameweeks`} />
      </LeagueShell>
    );
  }

  const [{ points, refused }, owed] = await Promise.all([roundPoints(round), cleanSheetsOwed(round)]);
  const ties = fixtureTies(roundTies(info, round), mine, owed);
  const anyOwed = [...owed.values()].some((each) => (each ?? 0) > 0);

  return (
    // The gameweek's own rows and its head, not the table's ten.
    <LeagueShell current="fixtures" rows={ties.length + 1}>
      {refused !== null ? (
        <ScoreboardDown refused={refused} />
      ) : anyOwed ? (
        <p className="px-3 text-2xs text-faint">+n: clean sheets, confirmed at full time.</p>
      ) : null}
      <Round
        round={round}
        ties={ties}
        points={points}
        places={placings(table)}
        mine={mine}
        note={seeding(round.gameweek)}
        step={{ ...beside(rounds.map((each) => each.gameweek), round.gameweek), href: leagueFixturesHref }}
      />
    </LeagueShell>
  );
}

/** Each team's points: a finished week's settled totals, a started week's live ones, none for a week to come. */
async function roundPoints(round: ScheduleRound) {
  if (round.status === "finished") {
    const results = await getSeasonResults();
    const settled = results.filter((result) => result.period === round.period);
    return { points: new Map(settled.map((result) => [result.teamId, result.points])), refused: null };
  }
  if (!round.started) return { points: EMPTY, refused: null };
  const board = await liveScores(round.period);
  return { points: new Map([...board.scores].map(([team, score]) => [team, score.points])), refused: board.refused };
}

/** The clean sheets Fantrax has not credited, by team: only for the gameweek in play, which is the squads' own. */
async function cleanSheetsOwed(round: ScheduleRound): Promise<Map<string, number | null>> {
  if (round.status === "finished" || !round.started) return new Map();
  const [squads, scoring] = await Promise.all([getLeagueSquads(), leagueScoring()]);
  const held = readable(squads);
  if (held === null || held.snapshot.gameweek !== round.gameweek) return new Map();
  const pending = pendingByTeam(held.period.teams, scoring?.rules ?? null, held.snapshot, held.display);
  return new Map([...pending].map(([team, owed]) => [team, owed.points]));
}

/** A cup seeded on this gameweek's points says so under its fixtures. */
function seeding(gameweek: number) {
  const cup = seededIn(gameweek);
  return cup === undefined ? undefined : `${cup.name} · Seeding`;
}
