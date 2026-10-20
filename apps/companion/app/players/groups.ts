import { carries } from "@epl/core";
import type { PoolColumn } from "./columns";

// Which columns a reader is looking at, and the plates that choose between them (Opta's stat groups, Craig, 10 Sep 2026).

/** Which plate a column appears under: the pool's own groups, since core's `GroupKey` has no fantasy return. */
export type PoolGroup = "scoring" | "attacking" | "creating" | "defensive" | "discipline" | "attributes";

/** One plate: its group, its word, and the column it orders by, where it names one. */
export interface PoolPlate {
  key: PoolGroup;
  label: string;
  sort?: string;
}

/** The plates in the order a reader looks for them, the first the resting one (Craig, 19 Oct 2026: "split into
 *  attack/defending"). */
const POOL_GROUPS: readonly PoolPlate[] = [
  { key: "attacking", label: "Attack", sort: "xg" },
  { key: "creating", label: "Creating", sort: "xa" },
  { key: "defensive", label: "Defence", sort: "tkl" },
  { key: "scoring", label: "Scoring" },
  { key: "discipline", label: "Discipline" },
  { key: "attributes", label: "Attributes", sort: "acc" },
];

/** A plate's group, or `all`: a board with no plates, which draws every column (Players). */
export type PoolGroupKey = PoolGroup | "all";

/** What the URL asked for, narrowed to a plate the board offers; anything else is its first, or the whole board. */
export function groupFor(key: string | undefined, plates: readonly PoolPlate[]): PoolGroupKey {
  return (plates.find((plate) => plate.key === key) ?? plates[0])?.key ?? "all";
}

/** The column a plate orders by, where it names one. */
export function groupSort(group: PoolGroupKey): string | undefined {
  return POOL_GROUPS.find((plate) => plate.key === group)?.sort;
}

/** The plates a board offers over its columns: each group it has a column under, or none for a lone group. */
export function platesFor(columns: readonly PoolColumn[]): PoolPlate[] {
  const groups = new Set(columns.map((column) => column.group));
  const plates = POOL_GROUPS.filter((plate) => groups.has(plate.key));
  return plates.length > 1 ? plates : [];
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
