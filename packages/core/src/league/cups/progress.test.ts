import { describe, expect, it } from "vitest";
import { CUPS } from "./declared";
import { cupDraw } from "./progress";

const infusr = CUPS.find((cup) => cup.id === "infusr")!;
const seeds = Array.from({ length: 10 }, (_, at) => ({ teamId: `t${at + 1}`, name: `Team ${at + 1}` }));
/** GW10's totals: seed 8 beats 9 (M1), seed 7 and 10 level (M2). */
const totals: Record<string, number> = { t8: 38, t9: 17, t7: 21, t10: 21, t1: 40, t2: 30 };
const scoreOf = (gameweek: number, teamId: string) => (gameweek === 10 ? totals[teamId] ?? 0 : null);
const upTo = (last: number) => ({ started: (gw: number) => gw <= last, finished: (gw: number) => gw < last });

// Craig, 8 Nov 2026: "update the cup brackets". Round 1 is GW10.
describe("a cup's draw as it stands", () => {
  it("prints a round's scores while it is played, and nobody through", () => {
    const [round1] = cupDraw(infusr, 10, seeds, scoreOf, upTo(10));
    expect(round1?.fixtures[0]?.score).toEqual({ home: 38, away: 17 });
    expect(round1?.fixtures[1]?.score).toEqual({ home: 21, away: 21 });
  });

  it("carries a winner on points into the round that waits on him, and the loser to the losers' side", () => {
    const stages = cupDraw(infusr, 10, seeds, scoreOf, upTo(11));
    expect(stages[0]?.fixtures[0]?.score).toEqual({ home: 38, away: 17, through: "home" });
    expect(stages[1]?.fixtures[0]).toMatchObject({ code: "M3", home: "Team 1", away: "Team 8", awayTeam: seeds[7] });
    expect(stages[2]?.fixtures[0]).toMatchObject({ code: "M7", home: "Team 9", homeTeam: seeds[8] });
  });

  it("leaves a level tie waiting on its tie-break, its slots still placeholders", () => {
    const stages = cupDraw(infusr, 10, seeds, scoreOf, upTo(11));
    expect(stages[0]?.fixtures[1]?.score?.through).toBeUndefined();
    expect(stages.flatMap((stage) => stage.fixtures).some((fixture) => fixture.home === "Loser M2" || fixture.away === "Loser M2")).toBe(true);
  });

  it("prints no score before its gameweek starts, or for a side still a placeholder", () => {
    const stages = cupDraw(infusr, 10, seeds, scoreOf, upTo(9));
    expect(stages.every((stage) => stage.fixtures.every((fixture) => fixture.score === undefined))).toBe(true);
  });
});

// GW10's M1 finished Cowthenbeef 48, its_ohi 48: level, and the tie-break's counts are not read.
describe("a level tie settled by its tie-break", () => {
  it("goes through the side the commissioner recorded, and carries both on", () => {
    const stages = cupDraw(infusr, 10, seeds, scoreOf, upTo(11), new Map([["M2", "t10"]]));
    expect(stages[0]?.fixtures[1]?.score).toEqual({ home: 21, away: 21, through: "away", tieBreak: true });
    expect(stages.flatMap((stage) => stage.fixtures).some((fixture) => fixture.away === "Team 10" && fixture.code === "M5")).toBe(true);
  });

  it("ignores a record for a tie the points decided, or naming a team not in it", () => {
    const stages = cupDraw(infusr, 10, seeds, scoreOf, upTo(11), new Map([["M1", "t9"], ["M2", "t3"]]));
    expect(stages[0]?.fixtures[0]?.score?.through).toBe("home");
    expect(stages[0]?.fixtures[1]?.score?.through).toBeUndefined();
  });
});
