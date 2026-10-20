import { type CompetitionTie, type LeagueInfo, LEAGUE_COMPETITION, cupTies, leagueTies, periodPairings } from "@epl/core";
import { yoursFirst } from "../../mine";

// Which gameweeks Draft's Fixtures has anything to show for, off the league's own pairings and our cups.

type League = Pick<LeagueInfo, "matchups" | "teams">;

/** Every tie in a gameweek: Fantrax's pairings for its period, and our cups. */
export function roundTies(league: League, round: { gameweek: number; period: number }): CompetitionTie[] {
  return [
    ...leagueTies(periodPairings(league.matchups, league.teams, round.period)),
    ...cupTies(league.teams.length, round.gameweek),
  ];
}

/** The rounds with a tie on, which are the ones the arrows step over; every round while none has one. */
export function onTheCard<R extends { gameweek: number; period: number }>(league: League, rounds: readonly R[]): R[] {
  const paired = rounds.filter((round) => roundTies(league, round).length > 0);
  return paired.length > 0 ? paired : [...rounds];
}

/** A tie as Fixtures draws it: a league tie carries the clean sheets owed to each side, by team id. */
export type FixtureTie = CompetitionTie & { owed?: ReadonlyMap<string, number | null> };

/** The reader's ties first, as the retired Matchups list had them; only the league's own ties are owed clean sheets. */
export function fixtureTies(
  ties: readonly CompetitionTie[],
  mine: string | null,
  owed: ReadonlyMap<string, number | null>,
): FixtureTie[] {
  const read = ties.map((tie) => (tie.competition.id === LEAGUE_COMPETITION.id ? { ...tie, owed } : tie));
  return yoursFirst(read, (tie) => mine !== null && (tie.home.team?.teamId === mine || tie.away.team?.teamId === mine));
}
