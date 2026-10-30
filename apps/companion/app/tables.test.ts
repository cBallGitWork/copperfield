import { beforeEach, describe, expect, it, vi } from "vitest";
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

const scorer = (name: string, owner: string | null, points: number, status = "T") => ({
  entry: { player: { fantraxId: name, displayName: name }, ownerTeamId: owner, status },
  stats: { points },
});
let scorers = [scorer("Pascal Gross", ATLETICO, 44), scorer("João Pedro", BEEF, 40)];

vi.mock("./players/pool", () => ({
  getLeaguePool: async () => ({
    rows: scorers,
    teamNames: new Map([
      [ATLETICO, "AtleticoTimHortons"],
      [BEEF, "Cowthenbeef"],
    ]),
  }),
}));

vi.mock("./football", () => ({ footballNow: async () => ({ clubs: [] }), seasonFixtures: async () => [] }));

beforeEach(() => {
  scorers = [scorer("Pascal Gross", ATLETICO, 44), scorer("João Pedro", BEEF, 40)];
});

describe("the paper's tables", () => {
  it("name a team by its short name, as Team of the Week beside them does", async () => {
    expect((await scorerRows()).map((row) => row.detail)).toEqual(["Atletico", "Beef"]);
    expect((await draftRows(null)).map((row) => row.name)).toEqual(["Atletico", "Beef"]);
  });

  // 20 Oct 2026: Raya and Calafiori, both on 41, printed 5 and 6, their order settled by spelling.
  it("gives men level on points one place, as the Live leaders do", async () => {
    scorers = [scorer("Haaland", BEEF, 47), scorer("Saka", BEEF, 41), scorer("Palmer", BEEF, 41), scorer("Isak", BEEF, 39)];
    expect((await scorerRows()).map((row) => `${row.rank} ${row.name}`)).toEqual(["1 Haaland", "2 Palmer", "2 Saka", "4 Isak"]);
  });

  it("prints a dash, never an id or free agent, for an owned man whose team's name is missing", async () => {
    scorers = [scorer("Saka", "t9", 41)];
    expect((await scorerRows()).map((row) => row.detail)).toEqual(["—"]);
  });

  it("writes a man nobody holds out in full", async () => {
    scorers = [scorer("Saka", null, 41, "FA"), scorer("Rice", null, 40, "WW")];
    expect((await scorerRows()).map((row) => row.detail)).toEqual(["Free agent", "On waivers"]);
  });
});
