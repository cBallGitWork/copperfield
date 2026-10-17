import type { Club, LeagueTeam, LineupDetail, Opposition, RosteredTeam, SquadDetailLine } from "@epl/core";
import { NO_MINUTES, lineupDetail, squadDetail, squadUnarranged } from "@epl/core";

/** One side of a round not yet played: his eleven and bench once the gate has opened them, else his squad unarranged. */
export type UnplayedSide = { sheet: LineupDetail } | { lines: SquadDetailLine[] };

/** Both sides for a round that has not been played; the gate opens your own always (squads.ts, review N6). */
export function unplayedLists({
  pairing,
  rostered,
  shows,
  benches,
  clubs,
  opposition,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  /** Each side's bench order for the period, by team id; a side with none stands in position order. */
  benches: Map<string, readonly string[]>;
  clubs: Map<number, Club>;
  opposition: Map<number, Opposition[]>;
}): Map<string, UnplayedSide> {
  return new Map(
    [pairing.team, pairing.opponent].flatMap((team) => {
      const roster = rostered.get(team.teamId);
      if (roster === undefined) return [];
      const side: UnplayedSide = shows(team)
        ? { sheet: lineupDetail(roster, clubs, opposition, null, NO_MINUTES, benches.get(team.teamId) ?? []) }
        : { lines: squadDetail(squadUnarranged(roster), clubs, opposition, null, NO_MINUTES) };
      return [[team.teamId, side] as const];
    }),
  );
}
