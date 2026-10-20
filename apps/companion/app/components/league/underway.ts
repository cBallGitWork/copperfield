import { type BreakdownLine, type Opposition, kickedOff } from "@epl/core";

/** Whether his match is on: FPL's fixture status, or Fantrax already crediting him, as FPL's read can lag or be refused. */
export function underway(
  opposition: readonly Opposition[] | undefined,
  fantrax: { breakdown: readonly BreakdownLine[]; played: number | null },
): boolean {
  return kickedOff(opposition) || fantrax.breakdown.length > 0 || (fantrax.played ?? 0) > 0;
}
