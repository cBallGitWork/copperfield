import { describe, expect, it } from "vitest";
import { mapLeagueInfo } from "@epl/core";
import real from "../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import { COLUMNS } from "./columns";
import { STATS_SORT, boardView } from "./views";

// Both leagues' getLeagueInfo of 1 Oct 2026: the real one scores AT, GKP, DFP and DFP3, the rehearsal A, AF and Sv.
const realCategories = mapLeagueInfo(real).scoringCategories;
const rehearsalCategories = mapLeagueInfo(rehearsal).scoringCategories;
// The season's figures, Attack, Chances and Defence in turn (Craig, 19 Oct 2026).
const ADV = ["xG", "npxG", "xGI", "npxGI", "Sh", "SoT", "BCM", "xA", "KP", "BCC", "Crs", "AC", "Tkl", "Int", "Blk", "Clr", "Rec", "AW", "xGC"];
const labels = (key: "pool" | "stats", categories: typeof realCategories) =>
  boardView(key, categories).columns.filter((column) => column.group !== "attributes").map((column) => column.label);

describe("boardView", () => {
  it("puts the real league's scored counts on Players, with FPts, FP/G, GP and DCP (Craig, 16 Oct 2026)", () => {
    expect(labels("pool", realCategories)).toEqual([
      "Player", "FPts", "xMins", "FP/G", "Min", "GP", "G", "AT", "CS", "DC", "DC+", "DCP", "GA", "GKP", "PKS", "YC", "RC",
    ]);
  });

  it("puts every other figure on Adv Stats: the season's counts, the counts the league does not score, the attributes", () => {
    expect(labels("stats", realCategories)).toEqual([
      "Player", "A", "AF", ...ADV, "Sv", "PKM", "OG",
    ]);
    expect(boardView("stats", realCategories).columns.some((column) => column.key === "fin")).toBe(true);
  });

  it("reads the split off the league, never a list: the rehearsal scores A, AF and Sv, so they are Players'", () => {
    const players = labels("pool", rehearsalCategories);
    expect(players).toEqual(expect.arrayContaining(["A", "AF", "Sv"]));
    expect(players).not.toContain("AT");
    expect(labels("stats", rehearsalCategories)).toEqual(expect.arrayContaining(["AT", "GKP"]));
  });

  it("splits every column once, the name on both", () => {
    const pool = boardView("pool", realCategories).columns.map((column) => column.key);
    const stats = boardView("stats", realCategories).columns.map((column) => column.key);
    expect(pool.filter((key) => stats.includes(key))).toEqual(["name"]);
    expect(pool.length + stats.length - 1).toBe(COLUMNS.length);
  });

  it("keeps every count on Players for a league whose scoring did not arrive", () => {
    expect(labels("pool", {})).toEqual(expect.arrayContaining(["AT", "A", "AF", "Sv", "GKP"]));
    // PKM and OG sit on Adv Stats whatever the league scores (Craig, 24 Oct 2026).
    expect(labels("stats", {})).toEqual(["Player", ...ADV, "PKM", "OG"]);
  });

  it("orders Adv Stats by a column it draws", () => {
    expect(boardView("stats", realCategories).columns.some((column) => column.key === STATS_SORT)).toBe(true);
  });
});
