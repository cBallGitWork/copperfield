import type { PastSeason } from "@epl/core";
import Section from "../../components/shell/Section";
import Board from "../../components/league/Board";
import { ROW_NAME } from "@/app/desk";
import { seasonKey, thousands } from "@epl/core";
import Absent from "@/app/components/shell/Absent";

// CM's appearances table at season scale (`cm9900/11.jpg`). Only figures FPL kept every season back to 2014/15: one it
// did not collect that year arrives as a nought.

export default function PastSeasons({
  seasons,
  current,
  clubs,
}: {
  seasons: readonly PastSeason[];
  /** This season, as the first row (Craig, 4 Sep 2026); null for a man with no minutes this season. */
  current?: PastSeason | null;
  /** The club he was at, by the sister store's season key (`"25-26"`); a season it lacks prints a dash. */
  clubs: ReadonlyMap<string, string>;
}) {
  if (seasons.length === 0 && !current) {
    // A debutant: a heading over no rows would claim something failed to load.
    return null;
  }

  const rows = current ? [current, ...seasons] : seasons;

  return (
    // No provenance line (Craig, 4 Sep 2026).
    <Section title={rows.length === 1 ? `Season · ${rows[0].season}` : "Seasons"}>
      <Board
        rows={rows}
        keyOf={(season) => season.season}
        lead={{
          index: { label: "Season", of: (season) => season.season, wide: true },
          name: {
            label: "Club",
            of: (season) => (
              <span className={`cm-row flex items-center px-1.5 ${ROW_NAME}`}>
                {clubs.get(seasonKey(season.season) ?? "") ?? <Absent />}
              </span>
            ),
          },
        }}
        columns={COLUMNS.map((column) => ({
          key: column.head,
          head: column.head,
          title: column.title,
          cell: (season: PastSeason) => ({ value: column.of(season), className: "font-bold" }),
        }))}
      />
    </Section>
  );
}

interface Column {
  head: string;
  title: string;
  of: (season: PastSeason) => number | string;
}

const COLUMNS: readonly Column[] = [
  {
    head: "Min",
    title: "Minutes played",
    of: (s) => thousands(s.minutes),
  },
  { head: "Gls", title: "Goals", of: (s) => s.goals },
  { head: "Ast", title: "Assists", of: (s) => s.assists },
  { head: "CS", title: "Clean sheets", of: (s) => s.cleanSheets },
  {
    head: "Con",
    title: "Goals conceded while he was on",
    of: (s) => s.goalsConceded,
  },
  { head: "Sv", title: "Saves", of: (s) => s.saves },
  { head: "Yel", title: "Yellow cards", of: (s) => s.yellowCards },
  { head: "Red", title: "Red cards", of: (s) => s.redCards },
];
