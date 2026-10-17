import { DASH, fixed } from "@epl/core";
import { columnFor, type PoolColumn, type RawStats } from "../columns";
import type { PoolRow } from "../pool";
import type { LedgerLine } from "./PairLedger";

// The league's own two figures for each man, read through the board's columns so Compare and the board never disagree.

/** One man as the board reads him: his pool row and his raw counts, either missing. */
export interface Scored {
  row: PoolRow | undefined;
  stats: RawStats;
}

/** The board's columns Compare leads with (Craig, 16 Oct 2026: FPts on Compare). */
const LEAD = ["fpts", "fpg"];

/** FPts then FP/G for one man or two; nothing when the pool holds neither. */
export function pointsLines(a: Scored, b: Scored | null): LedgerLine[] {
  if (a.row === undefined && b?.row === undefined) return [];
  return LEAD.flatMap((key) => {
    const column = columnFor(key);
    if (column === undefined) return [];
    const [left, right] = [figure(column, a), b === null ? null : figure(column, b)];
    return [
      {
        key: column.key,
        label: column.label,
        from: column.title,
        a: left,
        b: right,
        shown: { a: printed(column, left), b: printed(column, right) },
      },
    ];
  });
}

/** His figure under a column, or null for a man the pool does not hold. */
function figure(column: PoolColumn, man: Scored): number | null {
  if (man.row === undefined) return null;
  const value = column.value(man.row, man.stats);
  return typeof value === "number" ? value : null;
}

/** As the board's cell prints it: at the column's places where it has them, absence a dash. */
function printed(column: PoolColumn, value: number | null): string {
  if (value === null) return DASH;
  return column.places ? fixed(value, column.places) : String(value);
}
