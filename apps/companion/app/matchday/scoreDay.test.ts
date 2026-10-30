import { describe, expect, it } from "vitest";
import type { Fixture } from "@epl/core";
import { dayStep, matchDays, scoreDay } from "./scoreDay";

// GW7's shape: Friday night, the weekend, Monday night, and one match not yet dated.
const KICKOFFS = [
  "2026-10-16T19:00:00Z",
  "2026-10-17T14:00:00Z",
  "2026-10-17T11:30:00Z",
  "2026-10-18T13:00:00Z",
  "2026-10-19T19:00:00Z",
  null,
];
const fixtures: Pick<Fixture, "kickoff">[] = KICKOFFS.map((kickoff) => ({ kickoff }));
const DAYS = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"];

describe("matchDays", () => {
  it("lists each London day once, in order, and skips an undated match", () => {
    expect(matchDays(fixtures)).toEqual(DAYS);
  });

  it("files a late kickoff under London's day, not UTC's", () => {
    // 23:30 UTC in July is 00:30 the next morning in London.
    expect(matchDays([{ kickoff: "2026-07-04T23:30:00Z" }])).toEqual(["2026-07-05"]);
  });
});

describe("scoreDay", () => {
  it("opens on today when the gameweek plays today", () => {
    expect(scoreDay(DAYS, "2026-10-18", undefined)).toBe("2026-10-18");
  });

  it("opens on the next match day when today has none", () => {
    expect(scoreDay(["2026-10-17", "2026-10-19"], "2026-10-18", undefined)).toBe("2026-10-19");
    expect(scoreDay(DAYS, "2026-10-15", undefined)).toBe("2026-10-16");
  });

  it("opens on the last match day once they are all past", () => {
    expect(scoreDay(DAYS, "2026-10-21", undefined)).toBe("2026-10-19");
  });

  it("keeps the day asked for, and ignores one the gameweek does not play on", () => {
    expect(scoreDay(DAYS, "2026-10-18", "2026-10-16")).toBe("2026-10-16");
    expect(scoreDay(DAYS, "2026-10-18", "2026-10-20")).toBe("2026-10-18");
    expect(scoreDay(DAYS, "2026-10-18", "Saturday")).toBe("2026-10-18");
  });

  it("has no day when no match is dated", () => {
    expect(scoreDay([], "2026-10-18", "2026-10-18")).toBeNull();
  });
});

describe("dayStep", () => {
  it("names the day as a reader says it, with arrows to the days either side", () => {
    expect(dayStep(DAYS, "2026-10-18", "2026-10-17")).toEqual({
      day: "2026-10-17",
      title: "Sat 17 Oct",
      previous: { href: "/matchday?day=2026-10-16", label: "Fri 16 Oct" },
      // The day Live opens on is its plain address.
      next: { href: "/matchday", label: "Sun 18 Oct" },
    });
  });

  it("steps another view's days on that view's own address", () => {
    expect(dayStep(DAYS, "2026-10-18", "2026-10-17", "/matchday?view=vidiprinter")).toMatchObject({
      previous: { href: "/matchday?view=vidiprinter&day=2026-10-16" },
      next: { href: "/matchday?view=vidiprinter" },
    });
  });

  it("has no arrow past either end of the gameweek", () => {
    expect(dayStep(DAYS, "2026-10-18", "2026-10-16")?.previous).toBeNull();
    expect(dayStep(DAYS, "2026-10-18", "2026-10-19")?.next).toBeNull();
  });

  it("is nothing when no match is dated, so Scores shows the gameweek whole", () => {
    expect(dayStep([], "2026-10-18", undefined)).toBeNull();
  });
});
