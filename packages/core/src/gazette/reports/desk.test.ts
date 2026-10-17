import { describe, expect, it } from "vitest";
import type { PlMoment } from "../../football/premierleague/moments";
import { ENZO, HAVERTZ, PALMER, SAKA, deskOf, heldBy, matchInput, moment, reportMan, shot, tieWith } from "./__fixtures__/built";
import { matchBlock } from "./brief";
import { punBrief } from "./headline";
import { codeOf, spursVilla, spursVillaDay } from "./__fixtures__/spursVilla";
import { deskDay } from "./desk";

const desk = (moments: PlMoment[], score: [number, number]) => deskOf(matchInput([SAKA, HAVERTZ, PALMER, ENZO], moments, score));

describe("deskDay's calls on a made-up match", () => {
  it("opens on the late winner, not on the lead given up before it", () => {
    // Arsenal 2-0 up, pegged back to 2-2, then their own winner in the 85th.
    const goals = [moment("10", "goal", [1, null]), moment("20", "goal", [2, null]), moment("30", "goal", [3, null]), moment("40", "goal", [4, null]), moment("85", "goal", [1, null])];
    expect(desk(goals, [3, 2]).turn).toMatchObject({ kind: "late winner", man: SAKA });
  });

  it("calls a draw from two down a comeback, and opens on the goal that levelled it", () => {
    const goals = [moment("10", "goal", [1, null]), moment("20", "goal", [2, null]), moment("82", "goal", [3, null]), moment("88", "goal", [4, null])];
    expect(desk(goals, [2, 2]).turn).toMatchObject({ kind: "comeback", man: ENZO });
  });

  it("gives every goal its finish, not one goal alone", () => {
    const goals = [
      moment("10", "goal", [2, null], { shot: shot({ foot: "header" }) }),
      moment("30", "goal", [1, null], { shot: shot({ from: "from long range, at an angle" }) }),
    ];
    const block = matchBlock(desk(goals, [2, 0]));
    expect(block).toContain("Kai Havertz (Arsenal); a header, from inside the box, low into the corner.");
    expect(block).toContain("Bukayo Saka (Arsenal); right-footed, from long range, at an angle, low into the corner.");
  });
});

describe("own goals in the briefs", () => {
  // Reece James comes on for Palmer and puts it into his own net.
  const james = reportMan(5, "Reece James", "away", { started: false, onAt: "60" });
  const match = matchInput([SAKA, PALMER, james], [moment("60", "substitution", [5, 3]), moment("70", "own-goal", [5, null])], [1, 0]);

  it("never calls a substitute's own goal his decisive goal", () => {
    expect(matchBlock(deskOf(match))).not.toContain("a substitute on for");
  });

  it("tells the pun writer an own goal is the other club's goal", () => {
    const goals = punBrief(deskOf(match), "").split("\n").find((line) => line.startsWith("THE GOALS"));
    expect(goals).toBe("THE GOALS: an own goal by Reece James (Chelsea), for Arsenal, in the 70th minute.");
  });
});

describe("deskDay's stakes", () => {
  const held = (team: string, opponent: string, us: number, them: number, over: boolean) => heldBy(team, [tieWith(opponent, us, them, { over })]);
  const stakes = (over: boolean) => {
    const holders = new Map([
      [codeOf("Buendía"), held("Notemail", "test2", 38, 34, over)],
      [codeOf("McGinn"), held("Notemail", "test2", 38, 34, over)],
      [codeOf("Gallagher"), held("test2", "Notemail", 34, 38, over)],
    ]);
    const points = new Map([[codeOf("Buendía"), 7], [codeOf("McGinn"), 6], [codeOf("Gallagher"), 6]]);
    const [made] = deskDay(spursVillaDay([spursVilla({ holders, points })]));
    return made.sections.map((s) => s.stake);
  };

  it("names a head-to-head once a page while the gameweek runs, and its result once it is over", () => {
    expect(stakes(false).filter((s) => s.includes("Notemail"))).toEqual(["Notemail has Buendía, for seven points; test2 has Gallagher, for six points against Notemail.", "Notemail has him, for six points."]);
    expect(stakes(true).filter((s) => s.includes("38-34"))).toEqual(["Notemail has Buendía, for seven points; test2 has Gallagher, for six points, and lost 38-34 to Notemail."]);
  });

  it("names both ties of a double header", () => {
    const both = heldBy("Notemail", [tieWith("test2", 38, 34), tieWith("test3", 38, 40)]);
    const [made] = deskDay(spursVillaDay([spursVilla({ holders: new Map([[codeOf("Buendía"), both]]), points: new Map([[codeOf("Buendía"), 7]]) })]));
    expect(made.sections.map((s) => s.stake).filter((s) => s.includes("Notemail"))).toEqual(["Notemail has him, for seven points against test2 and test3."]);
  });
});
