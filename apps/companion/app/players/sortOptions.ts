import { headedFor, type PoolColumn } from "./columns";
import { platesFor, sortableIn } from "./groups";
import type { BoardView } from "./views";
import type { QueryOption } from "../components/shell/QuerySelect";

// Sort by's menu in words: a head as the board prints it, then the column's name, under its plate where a board has them.

/** A column's name: its title up to the first colon or comma, where its gloss starts. */
function nameOf(title: string): string {
  return title.split(/[:,]/)[0].trim();
}

/** One option's words: `xG — Expected goals`, or the name alone where the head already is it. */
export function sortLabel(column: Pick<PoolColumn, "label" | "title">): string {
  const name = nameOf(column.title);
  return name.toLowerCase() === column.label.toLowerCase() ? name : `${column.label} — ${name}`;
}

/** Every column a reader can sort by, headed per 90 where the board is; Adv Stats' grouped by plate in plate order,
 *  Players' few in the board's own order, as it has no plates. */
export function sortOptions(view: BoardView, scored: ReadonlySet<string>, rated: boolean | null): QueryOption[] {
  const sortable = headedFor([...sortableIn(view.columns, scored)], rated);
  const option = (column: PoolColumn, group?: string) => ({ value: column.key, label: sortLabel(column), group });
  const plates = view.key === "pool" ? [] : platesFor(sortable);
  if (plates.length === 0) return sortable.map((column) => option(column));
  return plates.flatMap((plate) => sortable.filter((column) => column.group === plate.key).map((column) => option(column, plate.label)));
}
