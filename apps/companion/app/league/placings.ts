import { printedPlaces, type StandingsRow } from "@epl/core";
import type { Unavailable } from "../refusals";

/** Each team's place in the table as CM's blue block prints it (`3rd`, `=1st`), by team id: none when the table
 *  could not be read. */
export function placings(table: readonly StandingsRow[] | Unavailable): Map<string, string> {
  return "unavailable" in table ? new Map() : printedPlaces(table);
}

/** A team's cut lines as the table rules them: dashed in the league's red, never the accent (DESIGN §9). */
export function cutRules(lines: readonly { label: string }[]): { label: string; tone: string }[] {
  return lines.map((line) => ({ label: line.label, tone: "border-league/80" }));
}
