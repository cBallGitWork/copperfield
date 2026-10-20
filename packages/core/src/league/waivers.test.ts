import { describe, expect, it } from "vitest";
import { londonDayAndTime } from "../time";
import { nextRun, timeLeft, upcomingRuns } from "./waivers";
import type { WaiverSchedule } from "./types";

// The real league's run, Wed, Thu and Fri at 13:00 US Eastern, read in London.
const REAL: WaiverSchedule = { weekdays: [3, 4, 5], hour: 13, minute: 0, timeZone: "America/New_York" };

describe("upcomingRuns", () => {
  it("lists Wednesday, Thursday and Friday at 18:00 London while both clocks are on summer time", () => {
    const runs = upcomingRuns(REAL, "2026-10-19T12:00:00Z", 3);
    expect(runs).toEqual(["2026-10-21T17:00:00.000Z", "2026-10-22T17:00:00.000Z", "2026-10-23T17:00:00.000Z"]);
    expect(runs.map(londonDayAndTime)).toEqual(["Wed 18:00", "Thu 18:00", "Fri 18:00"]);
  });

  // UK clocks go back on 25 Oct, US ones on 1 Nov: for that week the run is an hour earlier in London.
  it("runs at 17:00 London in the week the two clocks disagree, and at 18:00 again after", () => {
    const gap = upcomingRuns(REAL, "2026-10-26T12:00:00Z", 3).map(londonDayAndTime);
    expect(gap).toEqual(["Wed 17:00", "Thu 17:00", "Fri 17:00"]);
    const after = upcomingRuns(REAL, "2026-11-02T12:00:00Z", 1);
    expect(after).toEqual(["2026-11-04T18:00:00.000Z"]);
    expect(after.map(londonDayAndTime)).toEqual(["Wed 18:00"]);
  });

  it("skips a run that has just gone and starts from the next", () => {
    expect(upcomingRuns(REAL, "2026-10-21T17:00:00Z", 1)).toEqual(["2026-10-22T17:00:00.000Z"]);
    expect(upcomingRuns(REAL, "2026-10-21T16:59:00Z", 1)).toEqual(["2026-10-21T17:00:00.000Z"]);
  });

  it("walks over the weekend to the next Wednesday", () => {
    expect(upcomingRuns(REAL, "2026-10-23T18:00:00Z", 1)).toEqual(["2026-10-28T17:00:00.000Z"]);
  });

  it("reads another league's days, early on a Tuesday morning US Eastern", () => {
    const rehearsal: WaiverSchedule = { weekdays: [2, 5], hour: 5, minute: 0, timeZone: "America/New_York" };
    expect(upcomingRuns(rehearsal, "2026-10-19T12:00:00Z", 2).map(londonDayAndTime)).toEqual(["Tue 10:00", "Fri 10:00"]);
  });

  it("has nothing for a clock it cannot read or a schedule with no days", () => {
    expect(upcomingRuns(REAL, "not a date", 3)).toEqual([]);
    expect(upcomingRuns({ ...REAL, weekdays: [] }, "2026-10-19T12:00:00Z", 3)).toEqual([]);
  });
});

describe("nextRun", () => {
  const runs = ["2026-10-21T17:00:00.000Z", "2026-10-22T17:00:00.000Z"];

  it("takes the first run still to come, with the time left", () => {
    const now = Date.parse("2026-10-21T11:48:00Z");
    expect(nextRun(runs, now)).toEqual({ at: runs[0], left: Date.parse(runs[0] ?? "") - now });
  });

  it("moves on once a run has passed, and has none once all have", () => {
    expect(nextRun(runs, Date.parse("2026-10-21T17:00:00Z"))?.at).toBe(runs[1]);
    expect(nextRun(runs, Date.parse("2026-10-23T00:00:00Z"))).toBeNull();
  });
});

describe("timeLeft", () => {
  it("prints days and hours, hours and minutes, or minutes", () => {
    expect(timeLeft((2 * 24 + 4) * 3_600_000 + 5 * 60_000)).toBe("2d 4h");
    expect(timeLeft(5 * 3_600_000 + 12 * 60_000)).toBe("5h 12m");
    expect(timeLeft(12 * 60_000)).toBe("12m");
  });

  it("rounds up, so the last seconds still read a minute", () => {
    expect(timeLeft(5 * 3_600_000 + 11 * 60_000 + 1)).toBe("5h 12m");
    expect(timeLeft(20_000)).toBe("1m");
    expect(timeLeft(60 * 60_000)).toBe("1h");
  });
});
