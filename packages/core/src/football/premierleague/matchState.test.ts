import { describe, expect, it } from "vitest";
import type { Fixture } from "../types";
import type { RawPlFixture } from "./raw";
import { withPlState } from "./matchState";

// AVL v BRE, 10 Oct 2026 at 15:13: FPL's list said 0–0 at 6′ while the detail read had both goals of 1–1 at 13′.

const FPL: Fixture = {
  id: 52,
  code: 2562052,
  gameweek: 6,
  homeClubId: 2,
  awayClubId: 4,
  kickoff: "2026-10-10T14:00:00Z",
  homeScore: 0,
  awayScore: 0,
  status: "live",
  settled: false,
  minutes: 6,
  homeDifficulty: 3,
  awayDifficulty: 3,
};

const detail = (fill: Partial<RawPlFixture> = {}): RawPlFixture =>
  ({
    id: 128974,
    status: "L",
    phase: "1",
    altIds: { opta: "g2562052" },
    clock: { secs: 780, label: "13'00" },
    teams: [
      { team: { id: 2 }, score: 1 },
      { team: { id: 130 }, score: 1 },
    ],
    ...fill,
  }) as unknown as RawPlFixture;

describe("withPlState", () => {
  it("takes the score and minute from the read the goals come from", () => {
    expect(withPlState(FPL, detail())).toMatchObject({ homeScore: 1, awayScore: 1, minutes: 13, status: "live" });
  });

  // CRY v NFO, 11 Oct at 45+6: the clock's 3,060 seconds read "Live 51′" in the first half.
  it("holds the minute at 45 and 90 through added time, as FPL does", () => {
    expect(withPlState(FPL, detail({ clock: { secs: 3060, label: "45+6'00" } })).minutes).toBe(45);
    expect(withPlState(FPL, detail({ phase: "2", clock: { secs: 5700, label: "90+5'00" } })).minutes).toBe(90);
    expect(withPlState(FPL, detail({ phase: "2", clock: { secs: 3600, label: "60'00" } })).minutes).toBe(60);
  });

  it("leaves FPL's fixture alone without a read, or with another match's", () => {
    expect(withPlState(FPL, null)).toBe(FPL);
    expect(withPlState(FPL, detail({ altIds: { opta: "g1" } }))).toBe(FPL);
  });

  it("calls a match over at their whistle, before FPL's list does", () => {
    expect(withPlState(FPL, detail({ status: "C", phase: "F" })).status).toBe("finished");
  });

  it("gives an unstarted match no score, as FPL does", () => {
    const upcoming = withPlState({ ...FPL, status: "upcoming", homeScore: null, awayScore: null }, detail({ status: "U", phase: "0" }));
    expect(upcoming).toMatchObject({ status: "upcoming", homeScore: null, awayScore: null });
  });

  it("keeps FPL's score on a side the feed left blank, never a nought", () => {
    const blank = detail({ teams: [{ team: { id: 2 }, score: null }, { team: { id: 130 }, score: 1 }] } as Partial<RawPlFixture>);
    expect(withPlState(FPL, blank)).toMatchObject({ homeScore: 0, awayScore: 1 });
  });
});
