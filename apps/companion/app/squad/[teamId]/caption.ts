import { DASH, type SquadDetailLine } from "@epl/core";

// The line over a read-only eleven on the grass: the week, and what the eleven scored in the purple block beside it.

/** A played week's number and the eleven's total; the side as it stands for a week still to play (gameweek null). */
export function sheetCaption(
  rows: readonly SquadDetailLine[],
  gameweek: number | null,
): { title: string; total: string | null } {
  if (gameweek === null) return { title: "First-choice XI", total: null };
  const scores = rows.flatMap((line) => line.players.flatMap((p) => (typeof p.points === "number" ? [p.points] : [])));
  // To the hundredth, so a fractional scoring rule cannot print floating-point dust.
  const total = Math.round(scores.reduce((sum, points) => sum + points, 0) * 100) / 100;
  return { title: `Gameweek ${gameweek}`, total: scores.length === 0 ? DASH : `${total} pts` };
}
