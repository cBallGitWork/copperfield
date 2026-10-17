import { describe, expect, it } from "vitest";
import outfielder from "../football/__fixtures__/plPlayerStats.json";
import { plMatchParts, type MatchParts } from "../football/premierleague/playerMatch";
import type { RawPlPlayerStats } from "../football/premierleague/rawStats";
import { mapLeagueInfo } from "../league/fantrax/map";
import real from "../league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import type { LeagueScoring } from "../league/scoring";
import { scoringOf } from "../league/selectors";
import keeper from "../football/__fixtures__/plPlayerStatsKeeper.json";
import { attackingStats, defensiveStats, fullMatchStats, scoredStats } from "./fullMatchStats";

// Both leagues' getLeagueInfo of 1 Oct 2026: the real one scores AT, DFP, DFP3 and GKP; the rehearsal A, AF and Sv.
function scoring(raw: Parameters<typeof mapLeagueInfo>[0]): LeagueScoring {
  const read = scoringOf(mapLeagueInfo(raw));
  if (read === null) throw new Error("fixture carries no scoring");
  return read;
}
const REAL = scoring(real);
const REHEARSAL = scoring(rehearsal);

const PARTS: MatchParts = {
  tacklesWon: 3,
  interceptions: 1,
  blocks: 1,
  clearances: 1,
  recoveries: 11,
  penaltiesWon: 0,
  smothers: 0,
  punches: 0,
  highClaims: 0,
  saves: 0,
  shots: 3,
  shotsOnTarget: 1,
  chancesCreated: 2,
  bigChancesCreated: 1,
  bigChancesMissed: 0,
  crosses: 3,
  accurateCrosses: 2,
  touchesInBox: 4,
  contests: 2,
  contestsWon: 1,
  aerialsWon: 4,
};

const keys = (scoring: LeagueScoring, position: string) => scoredStats(scoring, position) ?? [];

describe("scoredStats on the real league", () => {
  it("gives a defender the penalty he won, and leaves what Fantrax counts to Fantrax", () => {
    expect(keys(REAL, "D")).toEqual(["penaltiesWon"]);
  });

  it("gives a keeper the parts of his keeper points, and the penalty he won, since he is paid assists", () => {
    expect(keys(REAL, "G")).toEqual(["penaltiesWon", "saves", "smothers", "punches", "highClaims"]);
  });

  it("gives a man filed at two positions what either is paid for", () => {
    expect(keys(REAL, "D/G")).toEqual(keys(REAL, "G"));
  });

  it("is null with no scoring or no position, so the card shows every row", () => {
    expect(scoredStats(null, "D")).toBeNull();
    expect(scoredStats(REAL, null)).toBeNull();
    expect(scoredStats(REAL, "")).toBeNull();
  });
});

describe("scoredStats on a league that pays saves on their own", () => {
  it("leaves saves to Fantrax's own count", () => {
    expect(keys(REHEARSAL, "G")).not.toContain("saves");
    expect(keys(REHEARSAL, "M")).toEqual(["penaltiesWon"]);
  });
});

// Craig, 11 Oct 2026: "Why wouldn't the player card in live games just use Fantrax data?" FPL 403'd mid-match.
describe("fullMatchStats", () => {
  it("is Opta's alone: no minutes, goals or cards, which Fantrax counts above it", () => {
    expect(fullMatchStats(PARTS, null).map((row) => row.key)).toEqual([
      "penaltiesWon",
      "saves",
      "smothers",
      "punches",
      "highClaims",
    ]);
  });

  it("prints a keeper's noughts once he has played: zero is a stat", () => {
    expect(fullMatchStats(plMatchParts(keeper as RawPlPlayerStats), keys(REAL, "G"))).toEqual([
      { key: "penaltiesWon", label: "Penalties won", value: 0 },
      { key: "saves", label: "Saves", value: expect.any(Number) },
      { key: "smothers", label: "Smothers", value: 1 },
      { key: "punches", label: "Punches", value: 2 },
      { key: "highClaims", label: "High claims", value: 3 },
    ]);
  });

  it("has no rows until Opta has a line for him", () => {
    expect(fullMatchStats(null, keys(REAL, "D"))).toEqual([]);
  });
});

describe("attackingStats", () => {
  it("reads his shooting down the left column and his making down the right", () => {
    expect(attackingStats(PARTS, "M").map((row) => row.key)).toEqual([
      "shots",
      "shotsOnTarget",
      "bigChancesMissed",
      "touchesInBox",
      "chancesCreated",
      "bigChancesCreated",
      "crosses",
      "contests",
    ]);
  });

  it("gives crosses and take-ons as made of tried, and a count alone otherwise", () => {
    const rows = attackingStats(PARTS, "D/M");
    expect(rows.find((row) => row.key === "crosses")).toEqual({ key: "crosses", label: "Accurate crosses", value: 2, of: 3 });
    expect(rows.find((row) => row.key === "contests")).toEqual({ key: "contests", label: "Dribbles won", value: 1, of: 2 });
    expect(rows.find((row) => row.key === "chancesCreated")).toEqual({
      key: "chancesCreated",
      label: "Chances created",
      value: 2,
      of: null,
    });
  });

  it("reads a metric Opta omitted as nought: zero is a stat", () => {
    // Recorded 6 Oct 2026: Jacob Murphy's line carries no shot on target and no big chance.
    const rows = attackingStats(plMatchParts(outfielder as RawPlPlayerStats), "M");
    expect(rows.find((row) => row.key === "shotsOnTarget")?.value).toBe(0);
    expect(rows.find((row) => row.key === "bigChancesCreated")?.value).toBe(0);
    expect(rows.find((row) => row.key === "shots")?.value).toBe(2);
  });

  it("has no block when Opta has no line for him", () => {
    expect(attackingStats(null, "F")).toEqual([]);
  });

  it("gives a keeper no block", () => {
    expect(attackingStats(PARTS, "G")).toEqual([]);
  });
});

describe("defensiveStats", () => {
  it("reads his tackling down the left column and his clearing up down the right, priced or not", () => {
    expect(defensiveStats(PARTS, "F").map((row) => [row.key, row.value])).toEqual([
      ["tacklesWon", 3],
      ["interceptions", 1],
      ["blocks", 1],
      ["clearances", 1],
      ["recoveries", 11],
      ["aerialsWon", 4],
    ]);
  });

  it("names each row in words", () => {
    expect(defensiveStats(PARTS, "D").map((row) => row.label)).toEqual([
      "Tackles won",
      "Interceptions",
      "Blocks",
      "Clearances",
      "Recoveries",
      "Aerials won",
    ]);
  });

  it("reads a metric Opta omitted as nought: zero is a stat", () => {
    // Recorded 6 Oct 2026: Jacob Murphy lost his one aerial and won none, so Opta sent no `aerial_won`.
    const rows = defensiveStats(plMatchParts(outfielder as RawPlPlayerStats), "M");
    expect(rows.find((row) => row.key === "aerialsWon")?.value).toBe(0);
    expect(rows.find((row) => row.key === "tacklesWon")?.value).toBe(2);
  });

  it("has no block when Opta has no line for him, and none for a keeper", () => {
    expect(defensiveStats(null, "D")).toEqual([]);
    expect(defensiveStats(plMatchParts(keeper as RawPlPlayerStats), "G")).toEqual([]);
  });
});
