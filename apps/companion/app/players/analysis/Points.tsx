import type { StatSeason } from "@epl/core";
import PairLedger from "./PairLedger";
import { pointsLines, type Scored } from "./pointsLines";

// The league's FPts and FP/G over the views: season to date whatever the range, and never in the football ledger.

export default function Points({
  a,
  b,
  names,
  season,
}: {
  a: Scored;
  /** Null when only one man is being looked at. */
  b: Scored | null;
  names: { a: string; b: string | null };
  season: StatSeason | null;
}) {
  // No read, or a projection, which a figure headed FPts must never carry (as `poolPoints` holds).
  if (season === null || season.projected) return null;
  const lines = pointsLines(a, b);
  if (lines.length === 0) return null;
  const who = names.b === null ? names.a : `${names.a} and ${names.b}`;

  return <PairLedger alone={b === null} caption={`${who} by fantasy points, season to date`} lines={lines} />;
}
