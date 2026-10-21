import type { IntelPastMaps, PastMaps } from "@epl/core";
import { pastMapsOf } from "@epl/core";
import { GRID } from "./players/analysis/heat";

// A past season's maps (`scripts/intel-past-maps.py`), one ~0.5 MB file a season. Each is a dynamic import, so the
// bundler traces it into the server build as its own chunk, loaded only when a reader picks that season.

/** Every season the script wrote, by the sister store's key (`"23-24"`); a season absent here has no maps. */
const FILES: Record<string, () => Promise<{ default: unknown }>> = {
  "21-22": () => import("../../../data/intel/past-maps/21-22.json"),
  "22-23": () => import("../../../data/intel/past-maps/22-23.json"),
  "23-24": () => import("../../../data/intel/past-maps/23-24.json"),
  "24-25": () => import("../../../data/intel/past-maps/24-25.json"),
  "25-26": () => import("../../../data/intel/past-maps/25-26.json"),
};

/** His maps in one past season, or null for a season with no file. */
export async function pastMaps(season: string | null, code: number): Promise<PastMaps | null> {
  const load = season === null ? undefined : FILES[season];
  if (load === undefined) return null;
  return pastMapsOf((await load()).default as IntelPastMaps, code, GRID);
}
