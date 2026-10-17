import { openingGameweek, ordinal, spelled, type FormGame, type PeriodGameweeks, type SortKey, type StandingsRow } from "@epl/core";
import { sortHref } from "./sort";
import TeamName from "@/app/components/league/TeamName";
import { StandingsName, type FormMark, type StandingsColumn, type StandingsLine } from "@/app/components/league/StandingsTable";
import { teamHref } from "@/app/squad/routes";
import { SCORE_RULE } from "../components/shell/Scoreline";
import { FORM_GAMES } from "../config";

// The fantasy league's table, for the page and the head-to-head: its columns, and a Fantrax standing as a line.
// A phone reads Pts after Pld and the short name, and stands Ag and Form down unless one orders the table (Craig, 6 Oct 2026).

const PTS_TITLE = "League points";

/** A football table's row (`cm9900/24.jpg`) plus form; the list is what `colSpan` counts, a hidden cell spanning zero. */
export const COLUMNS: readonly StandingsColumn<SortKey>[] = [
  { key: "rank", kind: "place", label: "Placing", title: "Points, then fantasy points scored; level on both shares the place", width: "w-8 lg:w-14" },
  { key: "name", kind: "name", label: "Team", title: undefined, width: "" },
  { key: "played", kind: "figure", label: "Pld", title: "Played", width: "w-8 lg:w-20" },
  { key: "pts", kind: "points", label: "Pts", title: PTS_TITLE, width: "w-10", copy: "phone" },
  { key: "won", kind: "figure", label: "W", title: "Won", width: "w-7 lg:w-16" },
  { key: "drawn", kind: "figure", label: "D", title: "Drawn", width: "w-7 lg:w-16" },
  { key: "lost", kind: "figure", label: "L", title: "Lost", width: "w-7 lg:w-16" },
  { key: "for", kind: "figure", label: "For", title: "Fantasy points scored", width: "w-11 lg:w-24" },
  { key: "against", kind: "figure", label: "Ag", title: "Fantasy points conceded", width: "w-11 lg:w-24", deskOnly: true },
  { key: "pts", kind: "points", label: "Pts", title: PTS_TITLE, width: "w-10 lg:w-24", copy: "desk" },
  { key: "form", kind: "form", label: "Form", title: `The last ${spelled(FORM_GAMES)} gameweeks, oldest first`, width: "w-14 lg:w-32", deskOnly: true },
];

/** Where a head reorders the table: the league page, from either board. */
export function leagueSortHref(sort: SortKey, descending: boolean): (key: SortKey) => string {
  return (key) => sortHref(key, sort, descending);
}

/** One team's line: white, the accent for yours (`cm9900/24.jpg`), and its form titled with each gameweek's score. */
export function leagueLine(
  row: StandingsRow,
  {
    places,
    mine,
    form,
    calendar,
    tint,
  }: {
    /** Places as the table prints them, `=1st` where shared (`printedPlaces`). */
    places: Map<string, string>;
    mine: string | null;
    /** Oldest first, by team, and empty for a side whose run we cannot vouch for. */
    form: Map<string, readonly FormGame[]>;
    calendar: readonly PeriodGameweeks[];
    tint?: string | undefined;
  },
): StandingsLine {
  return {
    key: row.teamId,
    place: places.get(row.teamId) ?? ordinal(row.rank),
    name: (
      <StandingsName>
        <TeamName teamId={row.teamId} name={row.teamName} />
      </StandingsName>
    ),
    href: teamHref(row.teamId),
    mine: row.teamId === mine,
    tint,
    values: {
      played: row.played,
      pts: row.points,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      for: row.pointsFor,
      against: row.pointsAgainst,
    },
    form: (form.get(row.teamId) ?? []).map((game): FormMark => ({
      result: game.result,
      title: titleOf(game, openingGameweek(calendar, game.period)),
    })),
  };
}

/** A result's title: its gameweek and score, or the score alone where the calendar cannot place its period. */
function titleOf(game: FormGame, gameweek: number | undefined): string {
  const score = `${game.pointsFor}${SCORE_RULE}${game.pointsAgainst}`;
  return gameweek === undefined ? score : `Gameweek ${gameweek} · ${score}`;
}
