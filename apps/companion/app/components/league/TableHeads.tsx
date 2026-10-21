import type { ReactNode } from "react";
import Link from "@/app/components/shell/Link";
import { HEAD_CELL, MINOR_CAPS, PLATE_FRAME, heldPlate } from "@/app/desk";

// The one head strip every table in the app prints: `HeadRow`'s minor caps, 24px bevelled plates, a centred word over
// a figure and a bare cell over a name. The column LISTS stay with their tables; the mechanics live here.

/** The head row; its cells inherit `MINOR_CAPS`, the 9px that keeps a narrow board from scrolling. */
export function HeadRow({ children }: { children: ReactNode }) {
  return <tr className={MINOR_CAPS}>{children}</tr>;
}

/** A head's or tab's word in capitals, unless a lower-case prefix runs into a capital: `xG` is not `XG`. */
export function headWord(label: ReactNode): ReactNode {
  return typeof label === "string" && /^[a-z]+[A-Z]/.test(label) ?<span className="normal-case">{label}</span> : label;
}

/** One head cell; `p-0` because the plate inside carries the padding. */
export function Head({
  width = "",
  title,
  sorted,
  children,
}: {
  width?: string;
  title?: string | undefined;
  /** Set only by a sortable table, and only on the column in force. */
  sorted?: "ascending" | "descending" | undefined;
  /** Absent on a spacer column, which holds a gap open without a plate. */
  children?: ReactNode;
}) {
  return (
    <th
      scope="col"
      title={title}
      aria-sort={sorted}
      className={`p-0 font-bold ${width}`}
    >
      {children}
    </th>
  );
}

/** A head plate's frame: `PLATE_FRAME`'s 24px, its word never wrapped. */
const FRAME = `${PLATE_FRAME} whitespace-nowrap`;

/** The bevelled plate, centred over centred figures. */
export const PLATE = `cm-bevel ${FRAME} justify-center px-1.5`;

/** `PLATE` held down: the one column a board is ordered by when its head is not a control. */
const PRESSED_PLATE = `cm-bevel-pressed ${FRAME} justify-center gap-0.5 px-1.5`;

/** `PLATE` over a name, its word at the start. */
export const PLATE_START = `cm-bevel ${FRAME} px-1.5`;

/** A head the column does not need: the word leaves the strip but stays as the header (and a
 *  sortable head's link name) for a screen reader. The plate, sized by the `<th>`, keeps its place. */
export const MUTE = "sr-only";

/** Where a sortable head's label sits: a figure's centred, a name's left. */
const JUSTIFY = { left: "justify-start", center: "justify-center" } as const;

/** A head cell the reader can order by, drawn pressed when the table is ordered by it.
 *  A link when the server orders the table (`href`), so the order can be shared; a button when a
 *  client board orders rows it already holds (`onSort`). */
export function SortHead({
  width = "",
  title,
  href,
  onSort,
  label,
  align = "center",
  sorted,
  arrow = true,
  mute = false,
  compact = false,
}: {
  width?: string;
  title?: string | undefined;
  label: string;
  align?: "left" | "center";
  /** Which way the table runs by this column, or undefined; drives the pressed plate, `aria-sort` and the arrow together. */
  sorted?: "ascending" | "descending" | undefined;
  /** Off for a head whose direction the reader cannot change. */
  arrow?: boolean;
  /** On for a column that names itself — see `MUTE`; the plate, pressed state and arrow stay. */
  mute?: boolean;
  /** Nearly unpadded under a thumb, so a narrow column is set by its figures, not its head. */
  compact?: boolean;
} & ({ href: string; onSort?: never } | { onSort: () => void; href?: never })) {
  const plate = `${FRAME} gap-0.5 ${compact ? COMPACT : "px-1.5"} ${JUSTIFY[align]} ${heldPlate(sorted !== undefined)}`;
  const face = (
    <>
      {mute ? <span className={MUTE}>{label}</span> : headWord(label)}
      {arrow && sorted !== undefined ? <SortArrow down={sorted === "descending"} /> : null}
    </>
  );
  return (
    <Head width={width} title={title} sorted={sorted}>
      {href !== undefined ? (
        // A re-sort replaces this page in history, so Back leaves the table rather than unsorting it.
        <Link href={href} replace className={plate}>
          {face}
        </Link>
      ) : (
        // `uppercase` again: a button does not inherit the row's capitals, as a link does.
        <button type="button" onClick={onSort} className={`w-full uppercase ${plate}`}>
          {face}
        </button>
      )}
    </Head>
  );
}

const COMPACT = "min-w-6 px-0.5 lg:px-1.5";

/** A `SortHead`'s `sorted`: which way the table runs by this column, or undefined when another is in force. */
export function sortedAs(here: boolean, descending: boolean): "ascending" | "descending" | undefined {
  return here ? (descending ? "descending" : "ascending") : undefined;
}

/** The order's direction beside a head's word. */
function SortArrow({ down, className = "" }: { down: boolean; className?: string }) {
  return (
    <span aria-hidden className={`text-[0.5rem] leading-none ${className}`}>
      {down ? "▼" : "▲"}
    </span>
  );
}

/** The name column's head: no plate and no visible word, but the cell keeps the strip's height. */
export function NameHead({ label }: { label: string }) {
  return (
    <Head>
      <span className={`${FRAME} px-1.5`}>
        <span className={MUTE}>{label}</span>
      </span>
    </Head>
  );
}

/** Where a head sits in its plate: a name's at the start, a figure's centred. */
const PLATE_AT = { start: PLATE_START, centre: PLATE } as const;

/** A head the reader cannot reorder by: the cell and the bevelled plate inside it, pressed with its arrow when
 *  something else (a picker, the model) orders the table by it. */
export function PlateHead({
  at = "start",
  title,
  className = "",
  sorted,
  scope = "col",
  colSpan,
  children,
}: {
  at?: keyof typeof PLATE_AT;
  title?: string | undefined;
  /** Extra classes on the cell: a width, a pin, a rule down its left. */
  className?: string;
  sorted?: "ascending" | "descending" | undefined;
  scope?: "col" | "colgroup" | "rowgroup";
  colSpan?: number;
  children: ReactNode;
}) {
  const plate = sorted === undefined ? PLATE_AT[at] : PRESSED_PLATE;
  return (
    <th scope={scope} colSpan={colSpan} title={title} aria-sort={sorted} className={`${HEAD_CELL} ${className}`}>
      <div className={plate}>
        {headWord(children)}
        {sorted === undefined ? null : <SortArrow down={sorted === "descending"} />}
      </div>
    </th>
  );
}
