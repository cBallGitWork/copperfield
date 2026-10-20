import { Fragment, type ReactNode } from "react";
import { signed } from "@epl/core";
import Link from "@/app/components/shell/Link";
import Absent from "@/app/components/shell/Absent";
import ScrollBoard from "./ScrollBoard";
import { Head, HeadRow, MUTE, NameHead, PLATE, SortHead, sortedAs } from "./TableHeads";
import { CutRow, PointsCell, TIGHT_ROW } from "./TableCells";
import { yoursEdge, yoursInk } from "@/app/mine";
import { BOARD, FIGURE, FIGURE_CELL, ROW_NAME, ROW_RULE, TONE, standDown } from "@/app/desk";
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

/** A row's height under a thumb: the tap floor, or the Draft tab's 36px (PRODUCT.md's exceptions). */
const ROWS = { tap: "cm-row flex min-h-11 items-center gap-2", tight: TIGHT_ROW } as const;

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
  rows = "tap",
}: {
  columns: readonly StandingsColumn<K>[];
  lines: readonly StandingsLine[];
  /** What the table is ordered by: a column the phone stands down still shows when it orders the table. */
  sort?: K;
  descending?: boolean;
  /** Where a head links to reorder; without one no head sorts. */
  sortHref?: (key: K) => string;
  rows?: keyof typeof ROWS;
}) {
  return (
    <ScrollBoard>
      <table className={BOARD}>
        <thead>
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
                  <Cell key={column.key} column={column} line={line} sort={sort} row={ROWS[rows]} />
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
  row,
}: {
  column: StandingsColumn<K>;
  line: StandingsLine;
  sort: K | undefined;
  /** The name cell's row class. */
  row: string;
}) {
  const shown = shownAt(column, sort);
  const value = line.values[column.key];
  switch (column.kind) {
    case "place":
      return (
        <td
          className={`cm-index numeric px-1.5 text-center ${edge(line)}`}
          // On the cell, not the row: a `<tr>` border never paints through the index ground.
          style={line.mine || line.tint === undefined ? undefined : { borderLeftColor: line.tint }}
        >
          {line.place}
        </td>
      );
    case "name":
      return (
        <td className="pl-2">
          {line.href === undefined ? (
            <span className={`${row} ${yoursInk(line.mine === true)}`}>{line.name}</span>
          ) : (
            <Link href={line.href} className={`${row} hover:underline ${yoursInk(line.mine === true)}`}>
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

/** The index block's edge: the accent for yours, a side's colour for a tint, transparent beside them, none where nobody owns a line. */
function edge(line: StandingsLine): string {
  if (line.mine === undefined && line.tint === undefined) return "";
  return line.mine || line.tint === undefined ? yoursEdge(line.mine === true) : "border-l-4";
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
