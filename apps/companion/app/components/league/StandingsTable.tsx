import { type CSSProperties, Fragment, type ReactNode } from "react";
import { signed } from "@epl/core";
import Link from "@/app/components/shell/Link";
import Absent from "@/app/components/shell/Absent";
import ScrollBoard from "./ScrollBoard";
import { Head, HeadRow, MUTE, NameHead, PLATE, SortHead, sortedAs } from "./TableHeads";
import { CutRow, IndexCell, PointsCell } from "./TableCells";
import { yoursInk } from "@/app/mine";
import { BOARD, FIGURE, FIGURE_CELL, ROW_NAME, ROW_RULE, SORTED_CELL, TAP_ROW, TONE, standDown } from "@/app/desk";
import { FORM_GAMES } from "@/app/config";

// Every league table in the app (`cm9900/24.jpg`): the fantasy league's, the Premier League's and a cup's groups.
// The column LIST is the caller's; the heads, the index block, the figures, Pts's block and the form are drawn here.

/** What a column holds: its place, the name, a count, a goal difference, the points, or the form. */
type Kind = "place" | "name" | "figure" | "swing" | "points" | "form";

export type StandingsColumn<K extends string> = {
  /** The sort key a head links with; the name and the form are not quantities and never sort. */
  key: K | "name" | "form";
  kind: Kind;
  label: string;
  title: string | undefined;
  width: string;
  /** A column the phone does without, so the table fits at 390 without a sideways scroll. */
  deskOnly?: true;
};

/** The name cell's row: one tap target, `TAP_ROW`'s heights. */
const NAME_ROW = `${TAP_ROW} gap-2`;

/** One result in a form guide, oldest first; `title` is its gameweek and score where the caller knows them. */
export type FormMark = { result: keyof typeof TONE; title?: string };

/** One side's line: figures by column key, and the cuts drawn under it. */
export type StandingsLine = {
  key: string;
  /** His place as the table prints it (`3rd`, `=1st`). */
  place: string;
  name: ReactNode;
  href?: string;
  /** The reader's own; undefined on a table nobody owns a line of, which draws no edge. */
  mine?: boolean;
  /** An edge in a side's own colour, for the head-to-head's two teams; `mine` wins on a line that is both. */
  tint?: string | undefined;
  values: Readonly<Record<string, number>>;
  form?: readonly FormMark[];
  cuts?: readonly { label: string; tone: string }[];
};

export default function StandingsTable<K extends string>({
  columns,
  lines,
  sort,
  descending = false,
  sortHref,
}: {
  columns: readonly StandingsColumn<K>[];
  lines: readonly StandingsLine[];
  /** What the table is ordered by: a column the phone stands down still shows when it orders the table. */
  sort?: K;
  descending?: boolean;
  /** Where a head links to reorder; without one no head sorts. */
  sortHref?: (key: K) => string;
}) {
  // A head row whose only plate is the muted place would draw one empty plate; it stays for a screen reader.
  const unread = columns.every((column) => column.kind === "place" || column.kind === "name");
  return (
    <ScrollBoard>
      <table className={BOARD}>
        <thead className={unread ? "sr-only" : undefined}>
          <HeadRow>
            {columns.map((column) => (
              <ColumnHead key={column.key} column={column} sort={sort} descending={descending} sortHref={sortHref} />
            ))}
          </HeadRow>
        </thead>
        <tbody>
          {lines.map((line) => (
            <Fragment key={line.key}>
              <tr className={`${ROW_RULE} ${line.mine ? "bg-raised" : line.href === undefined ? "" : "hover:bg-surface"}`}>
                {columns.map((column) => (
                  <Cell key={column.key} column={column} line={line} sort={sort} />
                ))}
              </tr>
              {(line.cuts ?? []).map((cut) => (
                <CutRow key={cut.label} span={columns.length} label={cut.label} tone={cut.tone} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </ScrollBoard>
  );
}

/** A name as a table row prints it, cut short rather than wrapped. */
export function StandingsName({ children }: { children: ReactNode }) {
  return <span className={`min-w-0 truncate ${ROW_NAME}`}>{children}</span>;
}

/** The width class a column shows at: stood down under a thumb unless it orders the table. */
function shownAt<K extends string>(column: StandingsColumn<K>, sort: K | undefined): string {
  return standDown(column.deskOnly, column.key === sort);
}

function ColumnHead<K extends string>({
  column,
  sort,
  descending,
  sortHref,
}: {
  column: StandingsColumn<K>;
  sort: K | undefined;
  descending: boolean;
  sortHref: ((key: K) => string) | undefined;
}) {
  if (column.kind === "name") return <NameHead label={column.label} />;
  const width = `${column.width} ${shownAt(column, sort)}`;
  // The place names itself: its word leaves the plate for a screen reader.
  const mute = column.kind === "place";
  if (sortHref === undefined || column.kind === "form") {
    return (
      <Head width={width} title={column.title}>
        <span className={PLATE}>{mute ? <span className={MUTE}>{column.label}</span> : column.label}</span>
      </Head>
    );
  }
  // Every kind but the name and the form is keyed by a sort key.
  const key = column.key as K;
  return (
    <SortHead
      width={width}
      title={column.title}
      href={sortHref(key)}
      label={column.label}
      mute={mute}
      sorted={sortedAs(key === sort, descending)}
    />
  );
}

function Cell<K extends string>({
  column,
  line,
  sort,
}: {
  column: StandingsColumn<K>;
  line: StandingsLine;
  sort: K | undefined;
}) {
  const shown = `${shownAt(column, sort)} ${column.key === sort ? SORTED_CELL : ""}`;
  const value = line.values[column.key];
  switch (column.kind) {
    case "place":
      return (
        // The width rides the cell too, so an sr-only head keeps the column narrow; a `<tr>` border never paints through the index ground.
        <IndexCell wide width={column.width ?? ""} style={edge(line)}>
          {line.place}
        </IndexCell>
      );
    case "name":
      return (
        <td className="pl-2">
          {line.href === undefined ? (
            <span className={`${NAME_ROW} ${yoursInk(line.mine === true)}`}>{line.name}</span>
          ) : (
            <Link href={line.href} className={`${NAME_ROW} hover:underline ${yoursInk(line.mine === true)}`}>
              {line.name}
            </Link>
          )}
        </td>
      );
    case "points":
      return <PointsCell className={shown}>{value ?? <Absent />}</PointsCell>;
    case "swing":
      // A goal difference is a direction, so it takes the up/bad pair; nought reads quiet.
      return (
        <td className={`${FIGURE} ${value === undefined ? "" : swing(value)} ${shown}`}>
          {value === undefined ? <Absent /> : signed(value)}
        </td>
      );
    case "form":
      return (
        <td className={`${FIGURE_CELL} ${shown}`}>
          <Form run={line.form ?? []} />
        </td>
      );
    case "figure":
      return <td className={`${FIGURE} text-ink ${shown}`}>{value ?? <Absent />}</td>;
  }
}

/** The index block's edge, painted inside the cell: a collapsed table splits a border across the grid line, 2px out.
 *  The accent for yours, a side's colour for a tint, none beside them; the second shadow is `.cm-index`'s own rule. */
function edge(line: StandingsLine): CSSProperties | undefined {
  const colour = line.mine ? "var(--color-accent)" : line.tint;
  return colour === undefined ? undefined : { boxShadow: `inset 4px 0 0 ${colour}, inset -1px 0 0 var(--color-bg)` };
}

function swing(difference: number): string {
  if (difference > 0) return "text-up";
  if (difference < 0) return "text-bad";
  return "text-faint";
}

/** The last `FORM_GAMES` results, oldest first: a win green, a loss red, a draw quiet. */
function Form({ run }: { run: readonly FormMark[] }) {
  if (run.length === 0) return <Absent />;
  return (
    <span className="flex justify-center gap-0.5">
      {run.slice(-FORM_GAMES).map((mark, at) => (
        // The place: a double header is two results in one period.
        <span key={at} title={mark.title} className={`font-bold ${TONE[mark.result]}`}>
          {mark.result}
        </span>
      ))}
    </span>
  );
}
