import { rateRows } from "./rates";
import type { Played, RateRow } from "./rates";
import { DASH, fixed } from "@epl/core";
import PairLedger from "./PairLedger";

// What the men have done, per ninety minutes, figure · label · figure. No section head and no name row (Craig,
// 10 Sep 2026): the rate is in each label. `PairLedger`, with decimals and a direction.

export default function Figures({
  a,
  b,
  names,
  window,
}: {
  a: Played | null;
  /** Null when only one man is being looked at. */
  b: Played | null;
  names: { a: string; b: string | null };
  /** What the figures cover, for a screen reader: "this season" or "gameweeks 1 to 5". */
  window: string;
}) {
  const alone = names.b === null;
  const rows = rateRows(a, alone ? null : b);
  if (rows.length === 0) return null;

  return (
    <PairLedger
      alone={alone}
      caption={
        alone
          ? `${names.a} by what he has done, ${window}, per ninety minutes`
          : `${names.a} and ${names.b} by what each has done, ${window}, per ninety minutes`
      }
      lines={rows.map((row) => ({
        key: row.name,
        label: label(row),
        from: row.from,
        a: row.a,
        b: row.b,
        shown: { a: show(row), b: show(row, "b") },
        lowerIsBetter: LOWER_IS_BETTER.has(row.name),
      }))}
    />
  );
}

/** The measures where the lower figure is the better one: a defender wants his xGC low. */
const LOWER_IS_BETTER = new Set(["xGC"]);

/** The measure's name, carrying its rate: `xG/90`, since 0.82 could also be a season's total. */
function label(row: RateRow): string {
  return row.perNinety ? `${row.name}/90` : row.name;
}

/** A figure as printed: rates to two places whatever the value, denominators whole, absence a dash. */
function show(row: RateRow, side: "a" | "b" = "a"): string {
  const value = row[side];
  if (value === null) return DASH;
  return row.perNinety ? fixed(value, "perNinety") : String(value);
}
