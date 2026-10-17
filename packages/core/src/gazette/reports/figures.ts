import { plMatchMetrics } from "../../football/premierleague/map";
import type { RawPlMatchStats } from "../../football/premierleague/rawStats";
import type { SideFigures } from "./types";

// A side's figures for the report, from the Premier League's match stats; a metric it omits is a nought (PLATFORM_NOTES).

const METRICS = {
  shots: "total_scoring_att",
  onTarget: "ontarget_scoring_att",
} as const;

/** Null when the stats carry nothing for this side at all. */
export function sideFigures(stats: RawPlMatchStats, teamId: number): SideFigures | null {
  const metric = plMatchMetrics(stats, teamId);
  if (metric === null) return null;
  return {
    shots: metric(METRICS.shots),
    onTarget: metric(METRICS.onTarget),
  };
}
