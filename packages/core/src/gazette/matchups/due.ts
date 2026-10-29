import { londonDayOf } from "../../time";
import type { Fixture } from "../../football/types";
import { pastSettle } from "../reports/due";

// When the draft report is due: once, at the end of the gameweek, when its last match has settled and Fantrax's
// auto-subs have run (`SETTLED_AFTER_KICKOFF_HOURS`), never on FPL's bonus. No report after Saturday (Craig, 11 Oct 2026).

interface DraftReportDue {
  cutoff: "gameweek";
  key: string;
  slug: string;
  /** The London day the gameweek ends on, which names the edition: "Monday Draft Report". */
  day: string;
}

export function draftReportsDue(fixtures: readonly Fixture[], gameweek: number, now: string): DraftReportDue[] {
  const played = fixtures.filter((f) => f.gameweek === gameweek && f.kickoff !== null);
  const at = Date.parse(now);
  if (played.length === 0 || !played.every((f) => pastSettle(f, at))) return [];
  const last = played.map((f) => londonDayOf(f.kickoff) ?? "").sort().at(-1) ?? "";
  return [{ cutoff: "gameweek", key: `draft-report:gw${gameweek}:gameweek`, slug: `gw${gameweek}-draft-report`, day: last }];
}
