import { describe, expect, it } from "vitest";
import type { Fixture } from "../../football/types";
import { reportDays } from "./due";

const game = (id: number, kickoff: string | null, settled = true, gameweek = 5): Fixture => ({
  id, code: id, gameweek, homeClubId: 1, awayClubId: 2, kickoff, homeScore: 1, awayScore: 0,
  status: settled ? "finished" : "live", settled, minutes: 90, homeDifficulty: null, awayDifficulty: null,
});
/** Whistled with FPL's bonus unconfirmed, as all six of 10 Oct 2026 still were at noon the next day. */
const whistled = (id: number, kickoff: string): Fixture => ({ ...game(id, kickoff, false, 6), status: "finished" });
const NOW = "2026-09-30T12:00:00Z";

describe("reportDays", () => {
  it("files one report per London day once every match that day has settled", () => {
    const days = reportDays([game(1, "2026-09-18T19:00:00Z"), game(2, "2026-09-19T11:30:00Z"), game(3, "2026-09-19T14:00:00Z")], 5, NOW);
    expect(days).toEqual([
      { key: "match-report:gw5:2026-09-18", slug: "gw5-prem-report-2026-09-18", day: "2026-09-18" },
      { key: "match-report:gw5:2026-09-19", slug: "gw5-prem-report-2026-09-19", day: "2026-09-19" },
    ]);
  });

  it("waits while one match that day is still being played", () => {
    expect(reportDays([game(2, "2026-09-19T11:30:00Z"), game(3, "2026-09-19T16:30:00Z", false)], 5, NOW)).toEqual([]);
  });

  it("reads the day in London: a 23:30 UTC kick-off in summer is the next day's", () => {
    expect(reportDays([game(1, "2026-09-19T23:30:00Z")], 5, NOW)[0].day).toBe("2026-09-20");
  });

  it("leaves out an undated match and another gameweek's", () => {
    expect(reportDays([game(1, null), game(2, "2026-09-19T11:30:00Z", true, 6)], 5, NOW)).toEqual([]);
  });

  it("files a day FPL has not signed off once its last match is an hour past full time", () => {
    const saturday = [whistled(51, "2026-10-10T11:30:00Z"), whistled(59, "2026-10-10T16:30:00Z")];
    expect(reportDays(saturday, 6, "2026-10-10T19:00:00Z")).toEqual([]);
    expect(reportDays(saturday, 6, "2026-10-10T19:36:00Z").map((d) => d.key)).toEqual(["match-report:gw6:2026-10-10"]);
  });

  it("never files a day with a match still being played, however late", () => {
    const day = [whistled(51, "2026-10-10T11:30:00Z"), game(59, "2026-10-10T16:30:00Z", false, 6)];
    expect(reportDays(day, 6, "2026-10-11T12:00:00Z")).toEqual([]);
  });
});
