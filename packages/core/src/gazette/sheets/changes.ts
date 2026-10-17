import { startsFor, type Sheet, type SheetMan } from "./sheet";

// Who starts for a side for the first time. `history` is the side's earlier fielded sheets, oldest first; empty means
// this is its first.

/** Starters who never started for this side before; null on its first sheet, when all of them are. */
export function debuts(now: Sheet, history: readonly Sheet[]): SheetMan[] | null {
  if (history.length === 0) return null;
  return now.starters.filter((man) => !history.some((sheet) => startsFor(sheet, man.fantraxId)));
}
