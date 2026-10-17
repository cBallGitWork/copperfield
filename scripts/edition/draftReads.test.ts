import { describe, expect, it } from "vitest";
import { mapLeagueInfo, scoringOf } from "@epl/core";
import real from "../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import { categoryIds, mostPaid, offClocks, slotWorth, startedOf, tallies } from "./draftReads";

describe("offClocks", () => {
  const moment = (kind: string, men: [number | null, number | null], minute: string) => ({ id: 0, minute, half: 2, kind, men, shot: null }) as unknown as Parameters<typeof offClocks>[0][number];

  it("gives each man the clock he went off at, by substitution or injury, and nobody else one", () => {
    const clocks = offClocks([moment("substitution", [7, 3], "52"), moment("injured-off", [9, null], "45+2"), moment("goal", [5, 7], "60")]);
    expect([...clocks]).toEqual([[3, "52"], [9, "45+2"]]);
  });
});

describe("startedOf", () => {
  const sheets = new Map([[48, new Set([10, 11])]]);
  it("reads a man as a starter or not from his match's team sheet", () => {
    expect(startedOf(10, [48], sheets)).toBe(true);
    expect(startedOf(12, [48], sheets)).toBe(false);
  });

  it("says nothing when a match he played has no sheet, rather than benching him", () => {
    expect(startedOf(12, [49], sheets)).toBeNull();
    expect(startedOf(12, [], sheets)).toBeNull();
  });
});

// One gameweek's day read: a midfielder with an assist of each kind, and a keeper with a bonus for his work.
const day = (assists: [string, number, number][], keeping: [string, number, number]) => ({
  statsPerTeam: {
    allTeamsStats: {
      t1: {
        ACTIVE: {
          statsMap: {
            m1: { object1: 8, object2: assists.map(([scipId, count, fpts]) => ({ scipId, sv: String(count), fpts })) },
            k1: { object1: 2, object2: [{ scipId: keeping[0], sv: String(keeping[1]), fpts: keeping[2] }] },
          },
        },
      },
    },
  },
});
const slotOf = new Map([["m1", "M"], ["k1", "G"]]);

describe("the draft desk on the real league, whose assists are AT and whose keepers are paid on GKP", () => {
  const info = mapLeagueInfo(real);
  const raws = [day([["5010#6362#-1", 2, 6]], ["5020#6689#-1", 7, 2])];

  it("tallies a man's assists", () => {
    expect(tallies(raws, categoryIds(info)).get("m1")?.assists).toBe(2);
  });

  it("reads a keeper's bonus off what GKP paid him", () => {
    expect(mostPaid(raws, categoryIds(info).keeping, "G", slotOf)).toBe(2);
  });

  it("pays a slot for an assist at the league's own price", () => {
    expect(slotWorth(scoringOf(info), categoryIds(info), raws, [], ["M"]).returns.M).toContainEqual({ kind: "assist", worth: 3 });
  });

  it("pays a full match's minutes by the rules, 2 for 60 or more, not by what a man happened to be paid", () => {
    expect(slotWorth(scoringOf(info), categoryIds(info), [], [], ["G", "D", "M", "F"]).appearance).toBe(2);
  });

  it("prices nothing when the scoring league would not describe its scoring", () => {
    const worth = slotWorth(null, categoryIds(info), raws, [], ["M"]);
    expect([worth.appearance, worth.keeper, worth.returns.M]).toEqual([0, null, []]);
  });
});

describe("the draft desk on the rehearsal league, whose assists are A and AF and whose keepers are paid on Sv", () => {
  const info = mapLeagueInfo(rehearsal);
  const raws = [day([["5010#6000#-1", 1, 3], ["5010#6283#-1", 1, 3]], ["5020#6200#-1", 6, 2])];

  it("tallies official assists only, as it always has", () => {
    expect(tallies(raws, categoryIds(info)).get("m1")?.assists).toBe(1);
  });

  it("reads a keeper's bonus off what his saves paid him", () => {
    expect(mostPaid(raws, categoryIds(info).keeping, "G", slotOf)).toBe(2);
  });

  it("pays a slot for an assist at the league's own price", () => {
    expect(slotWorth(scoringOf(info), categoryIds(info), raws, [], ["M"]).returns.M).toContainEqual({ kind: "assist", worth: 3 });
  });
});
