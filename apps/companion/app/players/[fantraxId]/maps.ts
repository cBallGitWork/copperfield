import { assistsOf, touchesOf } from "@epl/core";
import type { PastMaps, Shot, Touch, TouchPlayer } from "@epl/core";
import { PITCH_BOX } from "../../components/football/pitchBox";
import type { Mark } from "../../components/football/shotGeometry";

// His season on the profile's three pitches, read off the sister's shot and touch files by FPL code.

/** His shots, the shots he set up, and every touch, as points or a past season's counts by cell; empty is not drawn. */
export interface SeasonMaps {
  shots: readonly Mark[];
  chances: Shot[];
  touches: readonly Touch[] | ReadonlyMap<number, number>;
}

/** The grass kept behind the deepest mark when a map must reach into his own half, in pitch units. */
const REACH_BACK = 3;

/** Everything the files hold for him this season; a keeper keeps only his touches. */
export function seasonMaps(
  code: number,
  shots: ReadonlyMap<number, readonly Shot[]>,
  touches: ReadonlyMap<number, TouchPlayer>,
  keeper: boolean,
): SeasonMaps {
  const touched = touchesOf(touches.get(code), null);
  if (keeper) return { shots: [], chances: [], touches: touched };
  return { shots: [...(shots.get(code) ?? [])], chances: assistsOf(shots, code), touches: touched };
}

/** A past season's file for him: no chances, which it does not carry; a keeper keeps only his touches. */
export function pastSeasonMaps(past: PastMaps, keeper: boolean): SeasonMaps {
  return { shots: keeper ? [] : past.shots, chances: [], touches: past.counts };
}

/** How many touches a map holds, points or counts. */
export function touchCount(touches: SeasonMaps["touches"]): number {
  return "size" in touches ? [...touches.values()].reduce((sum, count) => sum + count, 0) : touches.length;
}

/** What became of his shots, in the order the marks are keyed, each with the tier it is drawn in. */
const OUTCOME_ROWS = [
  { outcome: "goal", label: "Goals" },
  { outcome: "save", label: "Saved" },
  { outcome: "post", label: "Post" },
  { outcome: "miss", label: "Missed" },
  { outcome: "block", label: "Blocked" },
] as const satisfies readonly { outcome: Mark["outcome"]; label: string }[];

/** His shots counted by outcome, noughts kept, and their xG summed; null xG when no shot carries one. */
export function shotBreakdown(shots: readonly Mark[]): {
  rows: { outcome: Mark["outcome"]; label: string; count: number }[];
  xg: number | null;
} {
  const rows = OUTCOME_ROWS.map((row) => ({ ...row, count: shots.filter((shot) => shot.outcome === row.outcome).length }));
  const priced = shots.flatMap((shot) => (shot.xg === null ? [] : [shot.xg]));
  return { rows, xg: priced.length === 0 ? null : priced.reduce((sum, xg) => sum + xg, 0) };
}

/** The stretch of pitch a shot map draws: the attacking half, reaching back only for a mark that started deeper. */
export function attackingSpan(points: readonly { x: number }[]): { x: number; width: number } {
  const half = PITCH_BOX.width / 2;
  const deepest = Math.min(half, ...points.map((point) => point.x - REACH_BACK));
  const x = Math.max(0, Math.floor(deepest));
  return { x, width: PITCH_BOX.width - x };
}
