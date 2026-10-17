import { describe, expect, it } from "vitest";
import type { Fixture, FootballPlayer, MatchEventKind } from "@epl/core";
import { fixtureGoals } from "./fixtureGoals";
import type { WireLine, WireRow } from "./wireLines";

// Liverpool 1 Man City 2, GW6: Live's Scores row carries who scored and who made it, under the score.

const LIV = 14;
const MCI = 43;
const FIXTURE = { id: 58, code: 2645258, homeClubId: LIV, awayClubId: MCI } as Fixture;

function man(name: string, clubId: number, mine = false) {
  return { player: { name, clubId } as FootballPlayer, owner: null, mine };
}

function goal(minute: string, at: number, kind: MatchEventKind, scorer: WireLine["man"], assister: WireLine["man"] = null): WireLine {
  return { key: minute, fixtureCode: FIXTURE.code, minute, kind, club: null, man: scorer, second: assister, at };
}

const doku = man("Doku", MCI, true);
const lines: WireRow[] = [
  goal("68", 3, "goal", doku),
  { key: "red", fixtureCode: FIXTURE.code, minute: "70", kind: "red-card", club: null, man: man("Van Dijk", LIV), second: null, at: 4 },
  goal("65", 2, "goal", man("Haaland", MCI), doku),
  goal("12", 1, "own-goal", man("Dias", MCI)),
];

describe("fixtureGoals", () => {
  const goals = fixtureGoals(lines, [FIXTURE]).get(FIXTURE.id);

  it("puts each goal under the side it counts for, oldest first, and an own goal under the other side", () => {
    expect(goals?.home.map((g) => [g.scorer, g.minute, g.kind])).toEqual([["Dias", "12", "own-goal"]]);
    expect(goals?.away.map((g) => [g.scorer, g.minute, g.assister])).toEqual([
      ["Haaland", "65", "Doku"],
      ["Doku", "68", null],
    ]);
  });

  it("marks the reader's own men, scorer or assister", () => {
    expect(goals?.away.map((g) => [g.scorerMine, g.assisterMine])).toEqual([
      [false, true],
      [true, false],
    ]);
  });

  it("leaves out cards, and a goal whose scorer cannot be placed on a side", () => {
    const nameless = goal("90", 5, "goal", null);
    const all = fixtureGoals([...lines, nameless], [FIXTURE]).get(FIXTURE.id);
    expect((all?.home.length ?? 0) + (all?.away.length ?? 0)).toBe(3);
  });

  it("has no entry for a match without a goal", () => {
    expect(fixtureGoals([], [FIXTURE]).has(FIXTURE.id)).toBe(false);
  });
});
