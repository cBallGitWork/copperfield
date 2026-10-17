import { DASH, type SquadDetailLine } from "@epl/core";

// The line over a read-only eleven on the grass.

/** A played week's number and what the eleven scored; the side as it stands for a week still to play (null). */
export function sheetCaption(rows: readonly SquadDetailLine[], gameweek: number | null): string {
  if (gameweek === null) return "First-choice XI";
  const scores = rows.flatMap((line) => line.players.flatMap((p) => (typeof p.points === "number" ? [p.points] : [])));
  // To the hundredth, so a fractional scoring rule cannot print floating-point dust.
  const total = Math.round(scores.reduce((sum, points) => sum + points, 0) * 100) / 100;
  return `Gameweek ${gameweek} · ${scores.length === 0 ? DASH : total}`;
}
