import { Fragment, type CSSProperties, type ReactNode } from "react";
import ScrollBoard from "./ScrollBoard";
import PositionTile, { TILE_WIDTH } from "./PositionTile";
import { HeadRow, MUTE, PlateHead, SortHead, sortedAs } from "./TableHeads";
import { IndexCell } from "./TableCells";
import {
  BOARD,
  BOARD_FIT,
  FIGURE_CELL,
  FIGURE_CELL_TIGHT,
  HEAD_CELL,
  INDEX_WIDTH,
  PINNED_BESIDE_INDEX,
  PINNED_BESIDE_TILE,
  PINNED_NAME,
  PINNED_TILE,
  READ_ROW,
  ROW_HEAD_CELL,
  ROW_RULE,
  SMALL_CAPS,
  SORTED_CELL,
} from "@/app/desk";

// The one stats board: a pinned lead (a position tile or an index block, then a name) and a column per figure, every
// head on `PLATE`, sortable by link or by tap, on the opaque surface inside `ScrollBoard`.

/** What one cell prints, and any classes it adds: an ink, a weight. */
export interface BoardFigure {
  value: ReactNode;
  className?: string;
  title?: string;
}

export interface BoardColumn<Row> {
  key: string;
  head: string;
  title?: string;
  /** On the head; the cells under it take the same. */
  width?: string;
  /** A word column, left as a name is, rather than a centred figure. */
  left?: boolean;
  /** A rule down its left: the first of a group, or a change of source. */
  rule?: boolean;
  /** The plate over a run of columns, when the board groups its heads. */
  group?: string;
  /** The cell carries its own ground and padding (a fixture on the ease ramp). */
  bare?: boolean;
  cell: (row: Row) => BoardFigure;
}

/** Which column the board runs by, and how a head changes it: a link the server orders by, a tap the client does, or
 *  neither when something else (a picker, the model) sets the order and the head is pressed only. */
type BoardOrder = { key: string | null; descending: boolean } & (
  | { href: (key: string) => string; onSort?: never }
  | { onSort: (key: string) => void; href?: never }
  | { href?: never; onSort?: never }
);

/** What leads each row: his Fantrax position on a tile (shown under a thumb, or carried by the name there) or a word
 *  in CM's index block; then the name. */
interface BoardLead<Row> {
  tile?: { positions: (row: Row) => readonly string[]; free?: (row: Row) => boolean; deskOnly?: boolean };
  /** `wide`: a season or a date, wider than the block, so the lead scrolls with the board rather than pinning. */
  index?: { label: string; of: (row: Row, at: number) => ReactNode; className?: string; wide?: boolean };
  /** `line`: under a thumb the name takes a line of its own over the figures, held still while they scroll
   *  (Fantrax's two-line row, Craig 16 Oct 2026); the pinned name cell is then the desk's alone. */
  name?: {
    label: string;
    of: (row: Row) => ReactNode;
    className?: (row: Row) => string;
    width?: string;
    line?: (row: Row) => ReactNode;
  };
}

/** The tile on the desk alone, where the name carries the position under a thumb. */
const DESK_TILE = `hidden lg:table-cell ${PINNED_TILE}`;

/** The tile of a man nobody holds, green where a held man's is blue (DESIGN §3, `--color-index-free`). */
const FREE_TILE = "[--cm-index:var(--color-index-free)]";

const RULE = "border-l border-line";

/** A row lit under the pointer or a tap (`.cm-hl`), its name line and figures as one (Craig, 24 Oct 2026). */
const LIT_ROW = `${ROW_RULE} cm-hl`;

/** A row's name line under a thumb: no rule under it, so the line and its figures read as one row. */
const NAME_LINE = "h-5 lg:hidden border-b-0";

/** The name line's face, as wide as the scroller (`@container` on it) and held at its left edge while the board
 *  scrolls under it; 20px tall, so the 36px link inside (`players/Cell`) hangs over the figures and the pair is one target. */
const LINE_FACE = "sticky left-0 h-5 w-[100cqw]";

/** The figures under a name line: 16px on a tight leading, so the pair is a tap row's 36 under a thumb. */
const UNDER_LINE = "max-lg:h-4 max-lg:leading-4 lg:h-7";

export default function Board<Row>({
  columns,
  rows,
  keyOf,
  lead,
  order,
  compact = false,
  fixed = false,
  fit = false,
  caption,
  rowClass,
  rowAttrs,
  tail,
  className = "",
  style,
}: {
  columns: readonly BoardColumn<Row>[];
  rows: readonly Row[];
  keyOf: (row: Row, at: number) => string;
  lead: BoardLead<Row>;
  order?: BoardOrder;
  /** Two dozen columns: tighter figures and heads under a thumb. */
  compact?: boolean;
  /** `table-fixed`: each figure holds its width and the name gives. */
  fixed?: boolean;
  /** Sized to its figures on a desk rather than filling the panel: a short table of a few columns. */
  fit?: boolean;
  caption?: string;
  rowClass?: (row: Row) => string;
  rowAttrs?: Readonly<Record<string, string>>;
  /** Rows under a plate of their own after the board's: a bench not counted. */
  tail?: { label: string; rows: readonly Row[] };
  /** On the scroller: an index scope, a manager's colours. */
  className?: string;
  style?: CSSProperties;
}) {
  const pins = pinsFor(lead);
  const line = lead.name?.line;
  const groups = groupsOf(columns);
  const ruled = groups === null ? columns : columns.map((column, at) => ({ ...column, rule: column.rule === true || column.group !== columns[at - 1]?.group }));
  const span = columns.length + (lead.tile || lead.index ? 1 : 0) + (lead.name ? 1 : 0);
  const figures = (entry: Row, at: number) => (
    <tr tabIndex={-1} className={`${LIT_ROW} ${line === undefined ? READ_ROW : UNDER_LINE} ${rowClass?.(entry) ?? ""}`} {...rowAttrs}>
      {lead.tile ? (
        <PositionTile
          positions={lead.tile.positions(entry)}
          cell
          className={`${pins.first} ${lead.tile.free?.(entry) ? FREE_TILE : ""}`}
        />
      ) : null}
      {lead.index ? <IndexCell wide={lead.index.wide} className={`${pins.first} whitespace-nowrap ${lead.index.className ?? ""}`}>{lead.index.of(entry, at)}</IndexCell> : null}
      {lead.name ? (
        <th scope="row" className={`${ROW_HEAD_CELL} ${pins.name} ${lead.name.className?.(entry) ?? ""}`}>
          {lead.name.of(entry)}
        </th>
      ) : null}
      {ruled.map((column) => {
        const figure = column.cell(entry);
        const base = column.bare ? "" : `${compact ? FIGURE_CELL_TIGHT : FIGURE_CELL} ${column.left ? "text-left" : ""}`;
        return (
          <td
            key={column.key}
            title={figure.title}
            className={`${base} ${column.rule ? RULE : ""} ${column.key === order?.key ? SORTED_CELL : ""} ${figure.className ?? ""}`}
          >
            {figure.value}
          </td>
        );
      })}
    </tr>
  );
  const row = (entry: Row, at: number) => (
    <Fragment key={keyOf(entry, at)}>
      {line === undefined ? null : (
        <tr tabIndex={-1} className={`${LIT_ROW} cm-hl-line ${rowClass?.(entry) ?? ""} ${NAME_LINE}`} {...rowAttrs}>
          <th scope="row" colSpan={columns.length} className={ROW_HEAD_CELL}>
            <div className={LINE_FACE}>{line(entry)}</div>
          </th>
        </tr>
      )}
      {figures(entry, at)}
    </Fragment>
  );

  return (
    <ScrollBoard className={`bg-surface ${line === undefined ? "" : "max-lg:@container"} ${className}`} style={style}>
      <table className={`${fit ? BOARD_FIT : BOARD} whitespace-nowrap ${fixed ? "table-fixed" : ""}`}>
        {caption === undefined ? null : <caption className="sr-only">{caption}</caption>}
        <thead>
          {groups === null ? null : (
            <HeadRow>
              <th colSpan={span - columns.length} className={`${HEAD_CELL} ${PINNED_TILE} bg-surface ${line === undefined ? "" : "max-lg:hidden"}`} />
              {groups.map((entry) => (
                <PlateHead key={entry.group} at="centre" scope="colgroup" colSpan={entry.span} className={RULE}>
                  {entry.group}
                </PlateHead>
              ))}
            </HeadRow>
          )}
          <HeadRow>
            <LeadHead lead={lead} pins={pins} />
            {ruled.map((column) => (
              <ColumnHead key={column.key} column={column} order={order} compact={compact} />
            ))}
          </HeadRow>
        </thead>
        <tbody>
          {rows.map(row)}
          {tail === undefined || tail.rows.length === 0 ? null : (
            <>
              <tr>
                <PlateHead scope="rowgroup" colSpan={span} className={SMALL_CAPS}>
                  {tail.label}
                </PlateHead>
              </tr>
              {tail.rows.map(row)}
            </>
          )}
        </tbody>
      </table>
    </ScrollBoard>
  );
}

/** Where the lead's two cells stick: the first at the edge, the name where the first ends; a name on its own line
 *  under a thumb is no cell there at all. */
function pinsFor<Row>(lead: BoardLead<Row>): { first: string; name: string } {
  const pins = pinned(lead);
  return lead.name?.line === undefined ? pins : { ...pins, name: `${pins.name} max-lg:hidden` };
}

function pinned<Row>(lead: BoardLead<Row>): { first: string; name: string } {
  if (lead.tile) {
    return lead.tile.deskOnly
      ? { first: DESK_TILE, name: `${PINNED_NAME} left-0 lg:left-14` }
      : { first: PINNED_TILE, name: PINNED_BESIDE_TILE };
  }
  if (lead.index) return lead.index.wide ? { first: "", name: "" } : { first: PINNED_TILE, name: PINNED_BESIDE_INDEX };
  return { first: "", name: `${PINNED_NAME} left-0` };
}

/** The lead's heads: bare, as CM heads only its figures, the word kept for a screen reader. */
function LeadHead<Row>({ lead, pins }: { lead: BoardLead<Row>; pins: { first: string; name: string } }) {
  const first = lead.tile
    ? { label: "Position", width: TILE_WIDTH }
    : lead.index
      ? { label: lead.index.label, width: INDEX_WIDTH }
      : null;
  return (
    <>
      {first === null ? null : (
        <th scope="col" className={`${HEAD_CELL} ${pins.first} ${first.width} bg-surface`}>
          <span className={MUTE}>{first.label}</span>
        </th>
      )}
      {lead.name ? (
        <th scope="col" className={`${HEAD_CELL} ${pins.name} ${lead.name.width ?? ""}`}>
          <span className={MUTE}>{lead.name.label}</span>
        </th>
      ) : null}
    </>
  );
}

function ColumnHead<Row>({ column, order, compact }: { column: BoardColumn<Row>; order: BoardOrder | undefined; compact: boolean }) {
  const sorted = order === undefined ? undefined : sortedAs(order.key === column.key, order.descending);
  const width = `${column.width ?? ""} ${column.rule ? RULE : ""}`;
  const align = column.left ? "left" : "center";
  const shared = { width, title: column.title, label: column.head, sorted, compact, align } as const;
  if (order?.href) return <SortHead {...shared} href={order.href(column.key)} />;
  if (order?.onSort) {
    const onSort = order.onSort;
    return <SortHead {...shared} onSort={() => onSort(column.key)} />;
  }
  return (
    <PlateHead at={column.left ? "start" : "centre"} title={column.title} className={width} sorted={sorted}>
      {column.head}
    </PlateHead>
  );
}

/** Each run of columns under one group's plate, or null for a board that does not group its heads. */
function groupsOf<Row>(columns: readonly BoardColumn<Row>[]): { group: string; span: number }[] | null {
  if (!columns.some((column) => column.group !== undefined)) return null;
  const groups: { group: string; span: number }[] = [];
  for (const column of columns) {
    const last = groups.at(-1);
    if (last !== undefined && last.group === column.group) last.span += 1;
    else groups.push({ group: column.group ?? "", span: 1 });
  }
  return groups;
}
