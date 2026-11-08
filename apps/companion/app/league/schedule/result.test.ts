import { describe, expect, it } from "vitest";
import { LEAGUE_COMPETITION } from "@epl/core";
import { seasonResult } from "./result";
import type { SeasonRow } from "./teamSeason";

const row = (status: "upcoming" | "live" | "finished", ours: number | null, theirs: number | null): SeasonRow => ({
  round: { gameweek: 9, period: 9, deadline: null, kickoff: null, status, started: status !== "upcoming" },
  tie: { competition: LEAGUE_COMPETITION, round: null, code: null, home: { team: null, label: "a" }, away: { team: null, label: "b" } },
  pointsFor: ours,
  pointsAgainst: theirs,
  opponent: { team: null, label: "b" },
});

// The approved Fixtures picture (8 Nov 2026): W, L or D in its own column, Live while the tie is played.
describe("a tie's result", () => {
  it("is W, L or D once the gameweek is over", () => {
    expect(seasonResult(row("finished", 41, 30))).toEqual({ word: "W", ink: "text-up" });
    expect(seasonResult(row("finished", 28, 35))).toEqual({ word: "L", ink: "text-bad" });
    expect(seasonResult(row("finished", 36, 36))).toEqual({ word: "D", ink: "text-muted" });
  });

  it("is Live while it is played, however it stands", () => {
    expect(seasonResult(row("live", 37, 34))?.word).toBe("Live");
  });

  it("is nothing before it starts, or where a total is missing", () => {
    expect(seasonResult(row("upcoming", null, null))).toBeNull();
    expect(seasonResult(row("finished", 40, null))).toBeNull();
  });
});
