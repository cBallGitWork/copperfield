import { printedPlaces } from "@epl/core";
import type { QueryOption } from "../../components/shell/QuerySelect";

// The squad's team picker: every team in table order, led by its place; the league's own order when there is no table.

/** One option per team, top of the table first; a team the table does not name comes last, with no place. */
export function teamOptions(
  teams: readonly { teamId: string; teamName: string }[],
  table: readonly { teamId: string; rank: number }[] | null,
): QueryOption[] {
  const rank = new Map((table ?? []).map((row) => [row.teamId, row.rank]));
  const places = printedPlaces(table ?? []);
  return [...teams]
    .sort((a, b) => (rank.get(a.teamId) ?? Infinity) - (rank.get(b.teamId) ?? Infinity))
    .map(({ teamId, teamName }) => {
      const place = places.get(teamId);
      return { value: teamId, label: place === undefined ? teamName : `${place} ${teamName}` };
    });
}
