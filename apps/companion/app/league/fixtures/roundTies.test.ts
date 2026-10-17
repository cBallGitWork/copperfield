import { describe, expect, it } from "vitest";
import { onTheCard, roundTies } from "./roundTies";

const teams = [
  { teamId: "t1", name: "test1" },
  { teamId: "t2", name: "test2" },
];
// The league began in period 6: periods 1 to 5 hold no pairing.
const league = { teams, matchups: [6, 7].map((period) => ({ period, homeTeamId: "t1", awayTeamId: "t2" })) };
const round = (gameweek: number) => ({ gameweek, period: gameweek });

describe("roundTies", () => {
  it("lists the league's pairings for the round's period", () => {
    expect(roundTies(league, round(6)).map((tie) => `${tie.home.label} v ${tie.away.label}`)).toEqual(["test1 v test2"]);
    expect(roundTies(league, round(5))).toEqual([]);
  });
});

describe("onTheCard", () => {
  it("leaves out the gameweeks before the league began", () => {
    expect(onTheCard(league, [1, 2, 3, 4, 5, 6, 7].map(round)).map((each) => each.gameweek)).toEqual([6, 7]);
  });

  it("keeps every round while none has a tie, so the empty state can say so", () => {
    expect(onTheCard({ teams, matchups: [] }, [1, 2].map(round)).map((each) => each.gameweek)).toEqual([1, 2]);
  });
});
