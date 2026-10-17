import { carries } from "@epl/core";
import type { PoolColumn } from "./columns";

// Which columns a reader is looking at, and the plates that choose between them (Opta's stat groups, Craig, 10 Sep 2026).

/** Which plate a column appears under: the pool's own groups, since core's `GroupKey` has no fantasy return. */
export type PoolGroup = "scoring" | "attacking" | "defensive" | "discipline" | "attributes";

/** The plates in the order a reader looks for them; `All` first and the default (Craig, 6 Sep 2026). */
export const POOL_GROUPS = [
  { key: "all", label: "All" },
  { key: "scoring", label: "Scoring" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
  { key: "attributes", label: "Attributes" },
] as const;

export type PoolGroupKey = (typeof POOL_GROUPS)[number]["key"];

export type PoolPlate = (typeof POOL_GROUPS)[number];

/** What the URL asked for, narrowed to a plate the board offers; anything else is the whole board. */
export function groupFor(key: string | undefined, plates: readonly PoolPlate[]): PoolGroupKey {
  return plates.find((group) => group.key === key)?.key ?? "all";
}

/** The plates a board offers over its columns: `All`, then each group it has a column under, less a lone group of
 *  counts, which would only repeat `All`. */
export function platesFor(columns: readonly PoolColumn[]): PoolPlate[] {
  const groups = new Set(columns.map((column) => column.group));
  const counts = [...groups].filter((group) => group !== undefined && group !== "attributes");
  return POOL_GROUPS.filter(
    (plate) => plate.key === "all" || (groups.has(plate.key) && (plate.key === "attributes" || counts.length > 1)),
  );
}

/** The columns one plate shows: the spine (no `group`) under every plate, the attributes off `All`, and always the
 *  column the board is sorted by, so a plate never hides the order or `aria-sort`. */
export function columnsIn(
  columns: readonly PoolColumn[],
  group: PoolGroupKey,
  sorted: string,
  scored: ReadonlySet<string>,
): readonly PoolColumn[] {
  const shown = columns.filter(
    (column) =>
      column.group === undefined ||
      column.key === sorted ||
      ((group === "all" ? column.group !== "attributes" : column.group === group) && isScored(column, scored)),
  );
  return group === "attributes" ? leadWith(shown, sorted) : shown;
}

/** Every column of a board a reader can sort by: all but the name, and no count the league's read does not carry. */
export function sortableIn(columns: readonly PoolColumn[], scored: ReadonlySet<string>): readonly PoolColumn[] {
  return columns.filter((column) => column.key !== "name" && isScored(column, scored));
}

/** A count the league's read carries, or a column that is not a count. */
function isScored(column: PoolColumn, scored: ReadonlySet<string>): boolean {
  return column.stat === undefined || carries(scored, column.stat);
}

/** The sorted column straight after the spine: twenty-five attributes run far past a phone's seven. */
function leadWith(columns: readonly PoolColumn[], sorted: string): readonly PoolColumn[] {
  const lead = columns.find((column) => column.key === sorted && column.group !== undefined);
  if (lead === undefined) return columns;
  const spine = columns.filter((column) => column.group === undefined);
  return [...spine, lead, ...columns.filter((column) => column.group !== undefined && column !== lead)];
}
