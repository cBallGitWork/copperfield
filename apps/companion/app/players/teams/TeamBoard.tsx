import Link from "@/app/components/shell/Link";
import { DASH, fixed, toFantraxClubCode } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import Board from "../../components/league/Board";
import { LEAD_BOX } from "../../components/league/LeadFace";
import { SIDE_SHARES, standoutCuts, standoutInk, type StandoutCut } from "../../components/league/standout";
import { POOL, TEAMS } from "../routes";
import { TEAM_COLUMNS, type TeamColumn } from "./columns";
import type { TeamRow } from "./teamRows";

// The clubs as one board of football figures in labelled groups: CM's densest board (`cm9900/21.jpg`) sets its
// heads in groups the same way. Standouts are lit in ink.

export default function TeamBoard({
  rows,
  sort,
  descending,
}: {
  rows: readonly TeamRow[];
  sort: TeamColumn;
  descending: boolean;
}) {
  const cuts = new Map<string, StandoutCut>(
    TEAM_COLUMNS.map((column) => [
      column.key,
      standoutCuts(rows.map(column.of), SIDE_SHARES, { of: rows.length }),
    ]),
  );

  return (
    <Board
      caption={`The clubs, ordered by ${sort.title.toLowerCase()}`}
      rows={rows}
      keyOf={(row) => String(row.club.code)}
      lead={{
        index: { label: "Place", of: (_, at) => at + 1 },
        name: {
          label: "Club",
          of: (row) => (
            <Link href={`${POOL}?club=${toFantraxClubCode(row.club.shortName)}`} className={`${LEAD_BOX} gap-1.5`}>
              <ClubLabel club={row.club} />
            </Link>
          ),
        },
      }}
      order={{ key: sort.key, descending, href: (key) => teamsHref(TEAM_COLUMNS.find((column) => column.key === key) ?? sort, sort, descending) }}
      columns={TEAM_COLUMNS.map((column) => ({
        key: column.key,
        head: column.head,
        title: column.title,
        group: column.group,
        width: "w-12 lg:w-10",
        cell: (row: TeamRow) => {
          const value = column.of(row);
          return value === null
            ? { value: DASH, className: "text-faint" }
            : { value: fixed(value, column.kind ?? "count"), className: standoutInk(value, cuts.get(column.key), column.rank) };
        },
      }))}
    />
  );
}

/** A head's link: a column not sorted starts in its own direction; the sorted one reverses. */
function teamsHref(column: TeamColumn, sort: TeamColumn, descending: boolean): string {
  const next = column.key === sort.key ? !descending : column.rank === "high";
  if (column.key === TEAM_COLUMNS[0].key && next) return TEAMS;
  return `${TEAMS}?sort=${column.key}${next ? "&dir=desc" : "&dir=asc"}`;
}
