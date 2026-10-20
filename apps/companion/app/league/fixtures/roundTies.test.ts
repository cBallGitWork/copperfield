import { describe, expect, it } from "vitest";
import { LEAGUE_COMPETITION, type CompetitionTie } from "@epl/core";
import { fixtureTies, onTheCard, roundTies } from "./roundTies";

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

// Review LEAGUE-8: Matchups, retired into Fixtures, put the reader's tie first and owed his clean sheets.
describe("fixtureTies", () => {
  const side = (teamId: string) => ({ team: { teamId, name: teamId }, label: teamId });
  const tie = (home: string, away: string, competition = LEAGUE_COMPETITION): CompetitionTie =>
    ({ competition, round: null, code: null, home: side(home), away: side(away) });
  const cup = { id: "cup", name: "Cup" };
  const ties = [tie("t1", "t2"), tie("t3", "t4"), tie("t3", "t5", cup)];
  const owed = new Map([["t3", 4]]);

  it("puts the reader's ties first and keeps the rest in Fantrax's order", () => {
    const order = fixtureTies(ties, "t4", owed).map((each) => `${each.home.label}-${each.away.label}`);
    expect(order).toEqual(["t3-t4", "t1-t2", "t3-t5"]);
  });

  it("leaves the order alone for a reader with no team", () => {
    expect(fixtureTies(ties, null, owed).map((each) => each.home.label)).toEqual(["t1", "t3", "t3"]);
  });

  it("gives the league's ties the clean sheets owed, and a cup's none", () => {
    const [, league, cupTie] = fixtureTies(ties, null, owed);
    expect(league.owed?.get("t3")).toBe(4);
    expect(cupTie.owed).toBeUndefined();
  });
});
