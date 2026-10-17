import { type CompetitionTie, type LeagueInfo, cupTies, leagueTies, periodPairings } from "@epl/core";

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
