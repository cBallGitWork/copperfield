import { describe, expect, it } from "vitest";
import type { Fixture } from "../../football/types";
import { draftReportsDue } from "./due";

const fixture = (kickoff: string, status: Fixture["status"] = "finished"): Fixture => ({
  id: 1, code: 1, gameweek: 6, homeClubId: 1, awayClubId: 2, kickoff, homeScore: null, awayScore: null, status, settled: false, minutes: 90, homeDifficulty: null, awayDifficulty: null,
});

// GW6 as FPL had it on 11 Oct 2026: six on Saturday, three on Sunday, Monday's at 19:00Z; none `finished` (bonus unconfirmed).
const GW6 = [
  ...["11:30", "14:00", "14:00", "14:00", "14:00", "16:30"].map((t) => fixture(`2026-10-10T${t}:00Z`)),
  ...["13:00", "13:00", "15:30"].map((t) => fixture(`2026-10-11T${t}:00Z`)),
  fixture("2026-10-12T19:00:00Z"),
];

describe("draftReportsDue", () => {
  it("files GW6's one report three hours after Monday's last kickoff, when the auto-subs have settled, and not a minute before", () => {
    expect(draftReportsDue(GW6, 6, "2026-10-12T21:59:00Z")).toEqual([]);
    expect(draftReportsDue(GW6, 6, "2026-10-12T22:00:00Z")).toEqual([
      { cutoff: "gameweek", key: "draft-report:gw6:gameweek", slug: "gw6-draft-report", day: "2026-10-12" },
    ]);
    expect(draftReportsDue(GW6, 6, "2026-10-14T18:00:00Z").map((d) => d.key)).toEqual(["draft-report:gw6:gameweek"]);
  });

  it("never waits on FPL's bonus, and files no report after Saturday", () => {
    expect(GW6.some((f) => f.settled)).toBe(false);
    expect(draftReportsDue(GW6, 6, "2026-10-11T08:00:00Z")).toEqual([]);
    expect(draftReportsDue(GW6, 6, "2026-10-12T12:00:00Z")).toEqual([]);
  });

  it("waits while a match is unplayed, and files nothing for a gameweek with no dated matches", () => {
    expect(draftReportsDue([...GW6.slice(0, 9), fixture("2026-10-12T19:00:00Z", "live")], 6, "2026-10-12T22:00:00Z")).toEqual([]);
    expect(draftReportsDue(GW6, 7, "2026-10-13T09:00:00Z")).toEqual([]);
  });
});
