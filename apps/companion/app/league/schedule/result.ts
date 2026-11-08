import type { SeasonRow } from "./teamSeason";

/** A tie's result word and its ink: W a gain, L a loss, D quiet, `Live` while it is played; null before it starts or
 *  where a total is missing. A win only at full time: a half-time lead is not one (`gameweekStatus` in core). */
export function seasonResult(row: SeasonRow): { word: "W" | "L" | "D" | "Live"; ink: string } | null {
  if (!row.round.started) return null;
  if (row.round.status !== "finished") return { word: "Live", ink: "text-live" };
  const { pointsFor: ours, pointsAgainst: theirs } = row;
  if (ours === null || theirs === null) return null;
  if (ours > theirs) return { word: "W", ink: "text-up" };
  if (ours < theirs) return { word: "L", ink: "text-bad" };
  return { word: "D", ink: "text-muted" };
}
