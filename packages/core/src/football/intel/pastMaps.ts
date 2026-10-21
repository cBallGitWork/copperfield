import type { Shot } from "./shots";
import { onPitch } from "./onPitch";

// A past season's touches and shots by FPL code (`scripts/intel-past-maps.py`), one file a season; untrusted, parsed.

/** A grid of cells across and down; a cell's index is `row * cols + col`. */
export interface HeatGrid {
  cols: number;
  rows: number;
}

/** One season's file as written: touches pre-binned, shots as `[x, y, xg, outcome]`, both keyed on the code. */
export interface IntelPastMaps {
  manifest: { season: string; grid: HeatGrid };
  touches: Record<string, { matches: number; cells: number[] }>;
  shots: Record<string, unknown[]>;
}

/** A shot as a mark: where it was struck, 0–100 his own goal to the one he attacks, the chance and what became of it. */
export type PastShot = Pick<Shot, "x" | "y" | "xg" | "outcome">;

/** One man's season: touch counts by cell on the caller's grid, and his shots. */
export interface PastMaps {
  counts: Map<number, number>;
  shots: PastShot[];
}

const OUTCOMES: ReadonlySet<string> = new Set<Shot["outcome"]>(["goal", "save", "miss", "block", "post"]);

/** His season in the file, read on the caller's grid; a file on another grid draws no touches, a corrupt row nothing. */
export function pastMapsOf(file: IntelPastMaps | null, code: number, grid: HeatGrid): PastMaps {
  const key = String(code);
  const sameGrid = file?.manifest?.grid?.cols === grid.cols && file.manifest.grid.rows === grid.rows;
  return {
    counts: cellCounts(sameGrid ? file.touches?.[key]?.cells : undefined, grid.cols * grid.rows),
    shots: (Array.isArray(file?.shots?.[key]) ? file.shots[key] : []).flatMap((row) => pastShot(row) ?? []),
  };
}

/** Flat `[cell, count, …]` pairs as a map; an odd length lost a number, so every pair after it is wrong. */
function cellCounts(flat: unknown, size: number): Map<number, number> {
  const counts = new Map<number, number>();
  if (!Array.isArray(flat) || flat.length % 2 !== 0) return counts;
  for (let n = 0; n < flat.length; n += 2) {
    const [cell, count] = [flat[n], flat[n + 1]];
    // Refused per pair: one stray cell must not cost the season's others.
    if (!Number.isInteger(cell) || cell < 0 || cell >= size || !Number.isInteger(count) || count <= 0) continue;
    counts.set(cell, (counts.get(cell) ?? 0) + count);
  }
  return counts;
}

function pastShot(row: unknown): PastShot | null {
  if (!Array.isArray(row) || row.length !== 4) return null;
  const [x, y, xg, outcome] = row;
  if (!onPitch(x) || !onPitch(y) || typeof outcome !== "string" || !OUTCOMES.has(outcome)) return null;
  const chance = typeof xg === "number" && Number.isFinite(xg) && xg >= 0 && xg <= 1 ? xg : null;
  return { x, y, xg: chance, outcome: outcome as Shot["outcome"] };
}
