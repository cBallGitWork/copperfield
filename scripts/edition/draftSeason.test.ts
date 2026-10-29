import { describe, expect, it } from "vitest";
import { mapLeagueInfo, matchupState, type PeriodResult, type StandingsRow } from "@epl/core";
import real from "../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import { draftSide, eleven } from "../../packages/core/src/gazette/matchups/__fixtures__/draftSide";
import { LIMITS } from "../../packages/core/src/gazette/matchups/__fixtures__/limits";

import { draftSeason, gameweekFacts, placeOf, ranksAfter, sweepOf } from "./draftSeason";

// Four gameweeks settled before the fifth: Zeta won all four, Alpha lost all four.
const games: [period: number, home: string, homePoints: number, away: string, awayPoints: number][] = [
  [1, "Zeta", 60, "Alpha", 40], [1, "Yank", 55, "Bravo", 45], [2, "Zeta", 70, "Bravo", 50], [2, "Yank", 65, "Alpha", 35],
  [3, "Zeta", 52, "Yank", 48], [3, "Bravo", 58, "Alpha", 42], [4, "Zeta", 66, "Alpha", 44], [4, "Yank", 61, "Bravo", 39],
];
const names = ["Zeta", "Yank", "Bravo", "Alpha"];
const info = {
  ...mapLeagueInfo(real),
  teams: names.map((name) => ({ teamId: name, name })),
  matchups: [...games.map(([period, home, , away]) => ({ period, homeTeamId: home, awayTeamId: away })), { period: 5, homeTeamId: "Zeta", awayTeamId: "Bravo" }, { period: 5, homeTeamId: "Yank", awayTeamId: "Alpha" }],
};
const results: PeriodResult[] = games.flatMap(([period, home, h, away, a]) => [{ period, teamId: home, points: h }, { period, teamId: away, points: a }]);
const row = (teamId: string, won: number, lost: number): StandingsRow => ({ teamId, teamName: teamId, rank: 0, won, drawn: 0, lost, played: won + lost, points: won * 3, pointsFor: 0, pointsAgainst: 0 });
const table = [row("Zeta", 4, 0), row("Yank", 3, 1), row("Bravo", 1, 3), row("Alpha", 0, 4)];
const state = (home: string, h: number, away: string, a: number) => matchupState({ home: draftSide(home, h, eleven(home)), away: draftSide(away, a, eleven(away)) }, LIMITS);
const states = [state("Zeta", 70, "Bravo", 50), state("Yank", 40, "Alpha", 60)];
const side = (name: string) => ({ teamId: name, name });

describe("draftSeason", () => {
  it("places each side by the results it has settled, and tells its form, the table and its meetings", async () => {
    const season = draftSeason(info, { table, pedigree: new Map(), moves: [], traded: [] }, results, 5);
    expect(placeOf(season, "Zeta")).toEqual({ rank: 1, won: 4, drawn: 0, lost: 0, run: "WWWW" });
    expect(gameweekFacts(season, states).get("Zeta")?.map((f) => f.text)).toEqual(["Zeta have won 5 in a row", "Zeta stayed top"]);
    expect(sweepOf(season, side("Zeta"), side("Bravo"), { for: 70, against: 50 })?.text).toBe("Zeta have won both meetings with Bravo");
  });

  it("tells no place, table, form or meeting when Fantrax would not give the season's results", async () => {
    const season = draftSeason(info, { table, pedigree: new Map(), moves: [], traded: [] }, null, 5);
    expect(placeOf(season, "Zeta")).toBeNull();
    expect(ranksAfter(season, states).size).toBe(0);
    expect(gameweekFacts(season, states).size).toBe(0);
    expect(sweepOf(season, side("Zeta"), side("Bravo"), { for: 70, against: 50 })).toBeNull();
  });
});
