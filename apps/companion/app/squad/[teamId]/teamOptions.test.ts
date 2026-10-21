import { describe, expect, it } from "vitest";
import { teamOptions } from "./teamOptions";

const teams = [
  { teamId: "a", teamName: "Alpha" },
  { teamId: "b", teamName: "Bravo" },
  { teamId: "c", teamName: "Charlie" },
];

// The squad's team picker (Craig, 21 Oct 2026): "rank by league order and have 1st-10th".
describe("teamOptions", () => {
  it("lists the teams in table order, each led by its place", () => {
    const table = [
      { teamId: "c", rank: 1 },
      { teamId: "a", rank: 2 },
      { teamId: "b", rank: 3 },
    ];
    expect(teamOptions(teams, table)).toEqual([
      { value: "c", label: "1st Charlie" },
      { value: "a", label: "2nd Alpha" },
      { value: "b", label: "3rd Bravo" },
    ]);
  });

  it("prints a shared place as the table does", () => {
    const table = [
      { teamId: "a", rank: 1 },
      { teamId: "b", rank: 1 },
      { teamId: "c", rank: 3 },
    ];
    expect(teamOptions(teams, table).map((option) => option.label)).toEqual(["=1st Alpha", "=1st Bravo", "3rd Charlie"]);
  });

  it("keeps the league's order, unplaced, with no table", () => {
    expect(teamOptions(teams, null)).toEqual([
      { value: "a", label: "Alpha" },
      { value: "b", label: "Bravo" },
      { value: "c", label: "Charlie" },
    ]);
  });

  it("puts a team the table does not name last, unplaced", () => {
    const table = [
      { teamId: "b", rank: 1 },
      { teamId: "a", rank: 2 },
    ];
    expect(teamOptions(teams, table).map((option) => option.label)).toEqual(["1st Bravo", "2nd Alpha", "Charlie"]);
  });
});
