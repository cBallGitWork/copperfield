import Link from "@/app/components/shell/Link";
import { DASH, fixed, toFantraxClubCode } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import Board from "../../components/league/Board";
import { LEAD_BOX } from "../../components/league/LeadFace";
import { SIDE_SHARES, standoutCuts, standoutInk, type StandoutCut } from "../../components/league/standout";
import { POOL } from "../routes";
import TabStrip from "../../components/shell/TabStrip";
import { FootFrame } from "../../components/shell/FootFrame";
import ScoutShell from "../Shell";
import ColumnKey from "../ColumnKey";
import { PRESSABLE } from "../BoardControls";
import { TEAM_COLUMNS, TEAM_GROUPS, plateHref, sortHref, type TeamColumn, type teamsView } from "./columns";
import type { TeamRow } from "./teamRows";

// The clubs as one board of football figures, every group under its head on the desk, one plate's under a thumb.
// Standouts are lit in ink.

export default function TeamBoard({
  rows,
  columns,
  grouped,
  sort,
  descending,
}: {
  rows: readonly TeamRow[];
  columns: readonly TeamColumn[];
  /** Whether each run of columns wears its group's head: the desk's whole board, not one plate. */
  grouped: boolean;
  sort: TeamColumn;
  descending: boolean;
}) {
  const cuts = new Map<string, StandoutCut>(
    columns.map((column) => [
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
        // The block held at the width the pinned Club starts beside, or a squeezed table slides Club over the first head.
        index: { label: "Place", of: (_, at) => at + 1, className: "min-w-8 lg:min-w-9" },
        name: {
          label: "Club",
          of: (row) => (
            <Link href={`${POOL}?club=${toFantraxClubCode(row.club.shortName)}`} className={`${LEAD_BOX} gap-1.5`}>
              <ClubLabel club={row.club} />
            </Link>
          ),
        },
      }}
      order={{ key: sort.key, descending, href: (key) => sortHref(columns.find((column) => column.key === key) ?? sort, sort, descending) }}
      columns={columns.map((column) => ({
        key: column.key,
        head: column.head,
        title: column.title,
        group: grouped ? TEAM_GROUPS.find((group) => group.key === column.group)?.label : undefined,
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

/** Under a thumb one plate at a time, switched from the foot with the Key at the top (DESIGN §2); the desk holds
 *  every column. The frame wraps the shell, as Adv Stats' does, so the dock spans the screen. */
export function ClubsBoards({ view, rows }: { view: ReturnType<typeof teamsView>; rows: readonly TeamRow[] }) {
  const { sort, descending } = view;
  const plates = (
    <div className="lg:hidden">
      <TabStrip
        label="Stat groups"
        tabs={TEAM_GROUPS.map((group) => ({ key: group.key, label: group.label, href: plateHref(group) }))}
        current={view.group.key}
        labels="word"
      />
    </div>
  );
  return (
    <FootFrame foot={plates}>
      <ScoutShell current="teams">
        <div className="flex justify-end lg:hidden">
          <ColumnKey entries={view.columns.map((column) => ({ label: column.head, title: column.title }))} className={`${PRESSABLE} min-w-11`} />
        </div>
        <div className="lg:hidden">
          <TeamBoard rows={rows} columns={view.columns} grouped={false} sort={sort} descending={descending} />
        </div>
        <div className="max-lg:hidden">
          <TeamBoard rows={rows} columns={TEAM_COLUMNS} grouped sort={sort} descending={descending} />
        </div>
      </ScoutShell>
    </FootFrame>
  );
}
