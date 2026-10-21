import { describe, expect, it } from "vitest";
import type { Fixture } from "../types";
import type { CupTie, RunEntry } from "./cups";
import { runOrder, seasonOrder } from "./seasonOrder";

const NOW = "2026-10-21T12:00:00Z";

const league = (id: number, kickoff: string | null, status: Fixture["status"]): RunEntry => ({
  kind: "league",
  fixture: {
    id, code: id, gameweek: id, homeClubId: 1, awayClubId: 2, kickoff, homeScore: null, awayScore: null,
    status, settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null,
  },
});

const cup = (kickoff: string | null, score: CupTie["score"]): RunEntry => ({
  kind: "cup",
  tie: { competition: "champions_league", kickoff, home: true, neutral: false, opponentCode: null, opponentName: "PSG", score },
});

const label = (entry: RunEntry) => (entry.kind === "league" ? `L${entry.fixture.id}` : `C${entry.tie.kickoff?.slice(5, 10) ?? "?"}`);

describe("runOrder", () => {
  it("opens on the next match, then lists the played newest first", () => {
    const run = [
      league(1, "2026-08-23T14:00:00Z", "finished"),
      league(3, "2026-10-25T14:00:00Z", "upcoming"),
      league(2, "2026-10-04T14:00:00Z", "finished"),
      league(4, "2026-11-01T14:00:00Z", "upcoming"),
    ];
    const { toCome, played } = runOrder(run, NOW);
    expect(toCome.map(label)).toEqual(["L3", "L4"]);
    expect(played.map(label)).toEqual(["L2", "L1"]);
  });

  it("counts a match in play as to come, at the top", () => {
    const { toCome, played } = runOrder([league(5, "2026-10-21T11:30:00Z", "live"), league(6, "2026-10-25T14:00:00Z", "upcoming")], NOW);
    expect(toCome.map(label)).toEqual(["L5", "L6"]);
    expect(played).toEqual([]);
  });

  it("keeps an undated match last among those to come", () => {
    const { toCome } = runOrder([league(7, null, "upcoming"), league(8, "2026-10-25T14:00:00Z", "upcoming")], NOW);
    expect(toCome.map(label)).toEqual(["L8", "L7"]);
  });

  it("plays a cup tie at its score, or once its full time has passed with none", () => {
    const { toCome, played } = runOrder(
      [
        cup("2026-10-01T19:00:00Z", { for: 2, against: 0 }),
        cup("2026-10-14T19:00:00Z", null),
        cup("2026-10-21T11:00:00Z", null),
        cup("2026-11-04T19:00:00Z", null),
        cup(null, null),
      ],
      NOW,
    );
    expect(toCome.map(label)).toEqual(["C10-21", "C11-04", "C?"]);
    expect(played.map(label)).toEqual(["C10-14", "C10-01"]);
  });
});

describe("seasonOrder", () => {
  it("splits on the caller's own test and order", () => {
    const { toCome, played } = seasonOrder([3, 1, 4, 2, 5], (n) => n < 3, (a, b) => a - b);
    expect(toCome).toEqual([3, 4, 5]);
    expect(played).toEqual([2, 1]);
  });
});
