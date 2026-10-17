import { describe, expect, it, vi } from "vitest";
import { draftRows, scorerRows } from "./tables";

// Two teams with a short name in data/leagues/short-names.json, one man each on the scorers chart.
const ATLETICO = "uexqrijomu8l5asi";
const BEEF = "7z8fy0pnmuogbtdw";

vi.mock("./standings", () => ({
  leagueTable: async () => [
    { teamId: ATLETICO, teamName: "AtleticoTimHortons", rank: 1, points: 15 },
    { teamId: BEEF, teamName: "Cowthenbeef", rank: 2, points: 12 },
  ],
}));

vi.mock("./players/pool", () => ({
  getLeaguePool: async () => ({
    rows: [
      { entry: { player: { fantraxId: "gross", displayName: "Pascal Gross" }, ownerTeamId: ATLETICO }, stats: { points: 44 } },
      { entry: { player: { fantraxId: "pedro", displayName: "João Pedro" }, ownerTeamId: BEEF }, stats: { points: 40 } },
    ],
    teamNames: new Map([
      [ATLETICO, "AtleticoTimHortons"],
      [BEEF, "Cowthenbeef"],
    ]),
  }),
}));

vi.mock("./football", () => ({ footballNow: async () => ({ clubs: [] }), seasonFixtures: async () => [] }));

describe("the paper's tables", () => {
  it("name a team by its short name, as Team of the Week beside them does", async () => {
    expect((await scorerRows()).map((row) => row.detail)).toEqual(["Atletico", "Beef"]);
    expect((await draftRows(null)).map((row) => row.name)).toEqual(["Atletico", "Beef"]);
  });
});
