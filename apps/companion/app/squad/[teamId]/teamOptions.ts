import { printedPlaces } from "@epl/core";
import type { QueryOption } from "../../components/shell/QuerySelect";

// The squad's team picker: every team in table order, led by its place; the league's own order when there is no table.

type Team = { teamId: string; teamName: string };

/** The teams in table order, top first; a team the table does not name comes last. */
function inTableOrder<T extends Team>(teams: readonly T[], table: readonly { teamId: string; rank: number }[] | null): T[] {
  const rank = new Map((table ?? []).map((row) => [row.teamId, row.rank]));
  return [...teams].sort((a, b) => (rank.get(a.teamId) ?? Infinity) - (rank.get(b.teamId) ?? Infinity));
}

/** The teams either side of `teamId` in the table, for CM's foot bar; null past the top or the bottom. */
export function tableNeighbours<T extends Team>(
  teams: readonly T[],
  table: readonly { teamId: string; rank: number }[] | null,
  teamId: string,
): { above: T | null; below: T | null } {
  const order = inTableOrder(teams, table);
  const at = order.findIndex((team) => team.teamId === teamId);
  return { above: at > 0 ? order[at - 1] : null, below: at >= 0 && at < order.length - 1 ? order[at + 1] : null };
}

/** One option per team, top of the table first; a team the table does not name comes last, with no place. */
export function teamOptions(
  teams: readonly { teamId: string; teamName: string }[],
  table: readonly { teamId: string; rank: number }[] | null,
): QueryOption[] {
  const places = printedPlaces(table ?? []);
  return inTableOrder(teams, table).map(({ teamId, teamName }) => {
      const place = places.get(teamId);
      return { value: teamId, label: place === undefined ? teamName : `${place} ${teamName}` };
    });
}
