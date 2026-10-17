import { ordinal, spelled, type Result, type TableRow, type TableSortKey } from "@epl/core";
import { tableHref } from "./sort";
import { clubHref } from "./routes";
import ClubLabel from "@/app/components/football/ClubLabel";
import type { StandingsColumn, StandingsLine } from "@/app/components/league/StandingsTable";
import { FORM_GAMES } from "../config";

// The Premier League table's columns, and a club's record as a line; no "yours" marks, as nobody owns a real club.

/** Every column, in order; a cut line's `colSpan` counts this list rather than a literal. For and Ag stand down
 *  under a thumb so Pts, the column the table is FOR, fits at 390; GD stays as the first tiebreak. */
export const COLUMNS: readonly StandingsColumn<TableSortKey>[] = [
  { key: "place", kind: "place", label: "Place", title: "Where the competition puts them", width: "w-8 lg:w-14" },
  { key: "name", kind: "name", label: "Club", title: undefined, width: "" },
  { key: "played", kind: "figure", label: "Pld", title: "Played", width: "w-8 lg:w-20" },
  { key: "won", kind: "figure", label: "Won", title: "Won", width: "w-8 lg:w-16" },
  { key: "drawn", kind: "figure", label: "Drn", title: "Drawn", width: "w-8 lg:w-16" },
  { key: "lost", kind: "figure", label: "Lst", title: "Lost", width: "w-8 lg:w-16" },
  { key: "for", kind: "figure", label: "For", title: "Goals scored", width: "w-9 lg:w-20", deskOnly: true },
  { key: "against", kind: "figure", label: "Ag", title: "Goals conceded", width: "w-9 lg:w-20", deskOnly: true },
  { key: "gd", kind: "swing", label: "GD", title: "Goal difference — the competition's first tiebreak", width: "w-10 lg:w-20" },
  { key: "pts", kind: "points", label: "Pts", title: "Three for a win, one for a draw", width: "w-10 lg:w-24" },
  { key: "form", kind: "form", label: "Form", title: `The last ${spelled(FORM_GAMES)} matches, oldest first`, width: "w-14 lg:w-32", deskOnly: true },
];

/** Where a head reorders the table. */
export function premSortHref(sort: TableSortKey, descending: boolean): (key: TableSortKey) => string {
  return (key) => tableHref(key, sort, descending);
}

/** One club's line: the competition's own place, which is not its position on screen once a reader sorts. */
export function clubLine(row: TableRow, place: number, form: readonly Result[]): StandingsLine {
  return {
    key: String(row.clubId),
    place: ordinal(place),
    name: <ClubLabel club={row} title={row.name} />,
    // The season-stable code, never `clubId`: a shared URL persists and FPL recycles ids.
    href: clubHref(row.code),
    values: {
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      for: row.goalsFor,
      against: row.goalsAgainst,
      gd: row.goalDifference,
      pts: row.points,
    },
    form: form.map((result) => ({ result })),
  };
}
