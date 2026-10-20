import { describe, expect, it } from "vitest";
import type { Club, PresserLine, StoryFixture } from "@epl/core";
import { firstKickoff, teamSheetRows } from "./dispatch";

describe("when the elevens expire", () => {
  // The cargo is in home-club order, not kickoff order: GW6 printed Arsenal first and Coventry, Monday night, fourth.
  it("is the round's earliest kickoff, wherever its tie sits in the cargo", () => {
    const lineups = [
      { home: { club: "Arsenal" }, kickoff: "2026-10-10T14:00:00Z" },
      { home: { club: "Brentford" }, kickoff: "2026-10-10T11:30:00Z" },
      { home: { club: "Coventry City" }, kickoff: "2026-10-12T19:00:00Z" },
    ];
    expect(firstKickoff(lineups)).toBe("2026-10-10T11:30:00Z");
  });

  it("is none without a readable kickoff", () => {
    expect(firstKickoff(null)).toBeNull();
    expect(firstKickoff([{ kickoff: "" }, { kickoff: 4 }])).toBeNull();
  });
});

// Gameweek 7, 16 Oct 2026: Villa's filed line said only what Barkley's Doubt bullet prints.
describe("the Team Sheet as filed", () => {
  const VILLA = { id: 2, code: 7, name: "Aston Villa" } as unknown as Club;
  const clubs = new Map([[7, VILLA]]);
  const ties = new Map<number, StoryFixture>();
  const maatsen: PresserLine = {
    code: 1, club: 7, tag: "ruled_out", confidence: 0.9, said: "2026-10-16T12:00:00Z", manager: "Unai Emery",
    playerName: "Ian Maatsen", clubName: "Aston Villa", ownerName: null, fresh: false,
  };
  const row = (line: string) => [{ club: "Aston Villa", code: 7, line, men: [{ name: "Ross Barkley", status: "Doubt", note: "" }] }];
  const lineOf = (rows: unknown) => (rows as { line: string }[])[0].line;

  it("drops a line that only repeats a bullet's status", () => {
    expect(lineOf(teamSheetRows(row("Ross Barkley is a doubt."), { presserTies: ties, presserClubs: clubs }, []))).toBe("");
  });

  it("drops one that only repeats a still-out man's absence, which the desk adds", () => {
    expect(lineOf(teamSheetRows(row("Ian Maatsen is out."), { presserTies: ties, presserClubs: clubs }, [maatsen]))).toBe("");
  });

  it("keeps a line with a fact beyond the bullets", () => {
    const line = "Ross Barkley is a doubt with a knee, to be assessed on Friday.";
    expect(lineOf(teamSheetRows(row(line), { presserTies: ties, presserClubs: clubs }, [maatsen]))).toBe(line);
  });
});
