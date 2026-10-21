import { describe, expect, it } from "vitest";
import { NO_SEASON } from "./noSeason";
import { KEEPER_RANKINGS, OUTFIELD_RANKINGS, rankings } from "./rankings";
import type { Tallied } from "./rankings";
import type { SeasonTotals } from "./types";

const man = (code: number, season: Partial<SeasonTotals>): Tallied => ({
  player: {
    id: code, code, name: `p${code}`, fullName: `p${code}`, clubId: 1, status: "a", news: "",
    chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null,
    season: { ...NO_SEASON, ...season },
  },
  shots: null,
  keyPasses: null,
});

const place = (ranked: ReturnType<typeof rankings>, head: string) => ranked.find((r) => r.head === head);

describe("rankings", () => {
  const cohort = [
    man(1, { minutes: 450, goals: 5 }),
    man(2, { minutes: 450, goals: 3 }),
    man(3, { minutes: 450, goals: 3 }),
    man(4, { minutes: 90, goals: 0 }),
    man(5, { minutes: 0, goals: 0 }),
  ];

  it("places him by how many have more, so ties share a place", () => {
    expect(place(rankings(cohort[0], cohort, OUTFIELD_RANKINGS), "G")).toMatchObject({ value: 5, rank: 1 });
    expect(place(rankings(cohort[1], cohort, OUTFIELD_RANKINGS), "G")?.rank).toBe(2);
    expect(place(rankings(cohort[2], cohort, OUTFIELD_RANKINGS), "G")?.rank).toBe(2);
    expect(place(rankings(cohort[3], cohort, OUTFIELD_RANKINGS), "G")?.rank).toBe(4);
  });

  it("counts only men who have played", () => {
    expect(place(rankings(cohort[0], cohort, OUTFIELD_RANKINGS), "G")?.of).toBe(4);
  });

  it("gives a man who has not played no place, rather than one below the field", () => {
    const ranked = rankings(cohort[4], cohort, OUTFIELD_RANKINGS);
    expect(place(ranked, "Min")).toMatchObject({ value: 0, rank: null, of: 4 });
    expect(ranked.every((r) => r.rank === null)).toBe(true);
  });

  it("heads goals and assists as the match log does", () => {
    expect(OUTFIELD_RANKINGS.map((r) => r.head)).toEqual(expect.arrayContaining(["G", "A"]));
  });

  it("has no place for a figure the map does not carry", () => {
    expect(place(rankings(cohort[0], cohort, OUTFIELD_RANKINGS), "Sh")).toMatchObject({ value: null, rank: null, of: 0 });
  });

  it("ranks his key passes on the league's count, the one Adv Stats prints", () => {
    const mapped = (code: number, keyPasses: number | null): Tallied => ({ ...man(code, { minutes: 450 }), keyPasses });
    const field = [mapped(1, 2), mapped(2, 1), mapped(3, null)];
    expect(place(rankings(field[0], field, OUTFIELD_RANKINGS), "KP")).toMatchObject({ value: 2, rank: 1, of: 2 });
    expect(place(rankings(field[2], field, OUTFIELD_RANKINGS), "KP")).toMatchObject({ value: null, rank: null });
  });

  it("ranks a keeper on goals prevented", () => {
    const keepers = [
      man(1, { minutes: 450, expectedGoalsConceded: 8, goalsConceded: 5 }),
      man(2, { minutes: 450, expectedGoalsConceded: 6, goalsConceded: 7 }),
    ];
    expect(place(rankings(keepers[0], keepers, KEEPER_RANKINGS), "Prv")).toMatchObject({ value: 3, rank: 1 });
    expect(place(rankings(keepers[1], keepers, KEEPER_RANKINGS), "Prv")?.rank).toBe(2);
  });
});
