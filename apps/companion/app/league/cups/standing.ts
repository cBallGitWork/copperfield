import { CUPS, cupDraw, type Cup, type CupDecided, type CupsDecided, type LeagueTeam, type PeriodResult, type ScoredStage } from "@epl/core";
import { getSchedule, getSeasonResults, type ScheduleRound } from "../schedule/schedule";
import { cupSeeds } from "../../cupSeeds";

// Each cup as it stands, off the schedule and the season's totals: the bracket draws it, and Live and Fixtures name
// a later round's sides from it once the round before is settled (Craig, 8 Nov 2026: "update the cup brackets").

/** One cup's draw with its scores and winners: a tie's score is its two teams' totals for the gameweek. */
export function cupStanding(
  cup: Cup,
  teams: readonly LeagueTeam[],
  rounds: readonly ScheduleRound[],
  results: readonly PeriodResult[],
): ScoredStage[] {
  // Keyed by Fantrax's period, which the round carries, never by gameweek: a postponement parts the two.
  const totals = new Map(results.map((row) => [`${row.period}:${row.teamId}`, row.points]));
  const round = (gameweek: number) => rounds.find((each) => each.gameweek === gameweek);
  return cupDraw(
    cup,
    teams.length,
    cupSeeds(teams)[cup.id] ?? [],
    (gameweek, teamId) => {
      const at = round(gameweek);
      return at === undefined ? null : (totals.get(`${at.period}:${teamId}`) ?? null);
    },
    { started: (gameweek) => round(gameweek)?.started ?? false, finished: (gameweek) => round(gameweek)?.status === "finished" },
  );
}

/** The ties a draw has settled, by code. */
export function settled(stages: readonly ScoredStage[]): CupDecided {
  const decided = new Map<string, { winner: LeagueTeam; loser: LeagueTeam }>();
  for (const fixture of stages.flatMap((stage) => stage.fixtures)) {
    const { code, score, homeTeam, awayTeam } = fixture;
    if (code === null || score?.through === undefined || homeTeam === undefined || awayTeam === undefined) continue;
    decided.set(code, score.through === "home" ? { winner: homeTeam, loser: awayTeam } : { winner: awayTeam, loser: homeTeam });
  }
  return decided;
}

/** Every cup's settled ties, for a view that lists one gameweek's ties; none when the schedule cannot be read. */
export async function cupsDecided(): Promise<CupsDecided> {
  const [read, results] = await Promise.all([getSchedule(), getSeasonResults()]);
  if ("unavailable" in read) return {};
  return Object.fromEntries(CUPS.map((cup) => [cup.id, settled(cupStanding(cup, read.info.teams, read.rounds, results))]));
}
