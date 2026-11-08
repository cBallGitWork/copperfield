import { describe, expect, it, vi } from "vitest";
import { CUPS } from "@epl/core";

vi.mock("../schedule/schedule", () => ({ getSchedule: async () => ({ unavailable: "test" }), getSeasonResults: async () => [] }));
vi.mock("../../cupSeeds", () => ({ cupSeeds: (teams: { teamId: string }[]) => ({ infusr: teams }) }));

import { cupStanding, settled } from "./standing";

const teams = Array.from({ length: 10 }, (_, at) => ({ teamId: `t${at + 1}`, name: `Team ${at + 1}` }));
const round = (gameweek: number, status: "finished" | "live" | "upcoming") => ({
  gameweek, period: gameweek, deadline: null, kickoff: null, status, started: status !== "upcoming",
});
const results = [{ period: 10, teamId: "t8", points: 38 }, { period: 10, teamId: "t9", points: 17 }] as never;
const infusr = CUPS.find((cup) => cup.id === "infusr")!;

// Craig, 8 Nov 2026: "update the cup brackets".
describe("a cup as it stands", () => {
  it("scores a round off its period's totals and settles it once the gameweek is over", () => {
    const stages = cupStanding(infusr, teams, [round(10, "finished"), round(11, "upcoming")], results);
    expect(stages[0]?.fixtures[0]?.score).toEqual({ home: 38, away: 17, through: "home" });
    expect(settled(stages).get("M1")).toEqual({ winner: teams[7], loser: teams[8] });
  });

  it("settles nothing while the round is played", () => {
    const stages = cupStanding(infusr, teams, [round(10, "live")], results);
    expect(stages[0]?.fixtures[0]?.score).toEqual({ home: 38, away: 17 });
    expect(settled(stages).size).toBe(0);
  });
});
