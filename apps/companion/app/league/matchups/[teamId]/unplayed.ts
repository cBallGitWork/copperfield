import type { Club, LeagueTeam, LineupDetail, Opposition, RosteredTeam, SquadDetailLine } from "@epl/core";
import { NO_MINUTES, squadDetail, squadUnarranged } from "@epl/core";

/** One side of a round not yet played: his eleven and bench once the gate has opened them, else his squad unarranged. */
export type UnplayedSide = { sheet: LineupDetail } | { lines: SquadDetailLine[] };

/** Both sides for a round that has not been played; the gate opens your own always (squads.ts, review N6). */
export function unplayedLists({
  pairing,
  rostered,
  shows,
  arranged,
  clubs,
  opposition,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  /** Each shown side's sheet (`teamSheet`), by team id. */
  arranged: Map<string, LineupDetail>;
  clubs: Map<number, Club>;
  opposition: Map<number, Opposition[]>;
}): Map<string, UnplayedSide> {
  return new Map(
    [pairing.team, pairing.opponent].flatMap((team) => {
      const roster = rostered.get(team.teamId);
      if (roster === undefined) return [];
      const sheet = arranged.get(team.teamId);
      const side: UnplayedSide =
        shows(team) && sheet !== undefined
          ? { sheet }
          : { lines: squadDetail(squadUnarranged(roster), clubs, opposition, null, NO_MINUTES) };
      return [[team.teamId, side] as const];
    }),
  );
}

/** A side before kickoff as a sheet for Fixtures: a rival's squad is all rows, so no man reads as benched. */
export function unplayedSheet(side: UnplayedSide): LineupDetail {
  return "sheet" in side ? side.sheet : { rows: side.lines, bench: [], shape: "" };
}
