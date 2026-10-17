import { describe, expect, it } from "vitest";
import { mapLeagueInfo, type LeagueScoring } from "@epl/core";
import real from "../../../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../../../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import { fantasyBoxes, type FantasyMan } from "./fantasyCategories";

// Both leagues' getLeagueInfo of 1 Oct 2026: the real one scores AT, GKP, DFP and DFP3, the rehearsal A, AF and Sv.
function scoringOf(info: ReturnType<typeof mapLeagueInfo>): LeagueScoring | null {
  return info.scoring === null ? null : { rules: info.scoring, categories: info.scoringCategories };
}
const scoring = scoringOf(mapLeagueInfo(real));

let next = 1;
function man(position: string, counts: Record<string, number>): FantasyMan {
  const code = next++;
  return { code, name: `${position}${code}`, league: { position, counts } };
}

const boxOf = (men: FantasyMan[], key: string, by: LeagueScoring | null = scoring) =>
  fantasyBoxes({ home: men, away: [] }, by).find((box) => box.key === key);

/** Every home man in a box, part after part. */
const homeOf = (box: ReturnType<typeof boxOf>) => box?.parts.flatMap((part) => part.home);

describe("fantasyBoxes on the real league", () => {
  it("counts assists under AT and a keeper's work under GKP, never the rehearsal's A and Sv", () => {
    const keeper = man("G", { GKP: 4, AT: 1 });
    const boxes = fantasyBoxes({ home: [keeper], away: [] }, scoring);
    expect(boxes.map((box) => [box.key, box.label])).toEqual([
      ["INDIVIDUAL_ASSISTS_TOTAL", "Assists"],
      ["INDIVIDUAL_KEEPER_POINTS", "Keeper actions"],
    ]);
  });

  it("heads every box in plain football words, never Fantrax's caption", () => {
    const everything = { G: 1, AT: 1, A: 1, GKP: 1, Sv: 1, PKS: 1, PKM: 1, OG: 1, YC: 1, RC: 1 };
    const heads = (league: LeagueScoring | null) =>
      fantasyBoxes({ home: [man("G", everything)], away: [] }, league).map((box) => box.label);
    const plain = ["Goals", "Assists", "Keeper actions", "Penalties saved", "Penalties missed", "Own goals", "Yellow cards", "Red cards"];
    expect(heads(scoring)).toEqual(plain);
    expect(heads(scoringOf(mapLeagueInfo(rehearsal)))).toEqual(plain.map((head) => (head === "Keeper actions" ? "Saves" : head)));
  });

  it("lists our DefCon from 1 for a defender, 4 for a midfielder and 3 for a forward, and nobody below", () => {
    const listed = [
      man("D", { DFP: 1, DFP3: 9 }),
      man("M", { DFP: 0, DFP3: 4 }),
      man("F", { DFP: 0, DFP3: 3 }),
    ];
    const below = [man("D", { DFP: 0, DFP3: 9 }), man("M", { DFP3: 3 }), man("F", { DFP3: 2 })];
    const box = boxOf([...listed, ...below], "defcon");
    expect(homeOf(box)?.map((m) => m.code).sort()).toEqual(listed.map((m) => m.code).sort());
    expect(homeOf(box)?.some((m) => m.count === 0)).toBe(false);
  });

  it("reads our DefCon at the letter his points are priced at", () => {
    // Priced as a midfielder: his 5 DFP is nothing to the league, his 4 DFP3 is close.
    const wingBack = man("M", { DFP: 5, DFP3: 4 });
    expect(homeOf(boxOf([wingBack], "defcon"))).toEqual([{ code: wingBack.code, name: wingBack.name, count: 4 }]);
  });

  it("separates DefCon by the letter he is priced at, defenders first, each the highest count first", () => {
    const [mid, fwd, back, bigMid] = [man("M", { DFP3: 7 }), man("F", { DFP3: 6 }), man("D", { DFP: 3 }), man("M", { DFP3: 9 })];
    const box = boxOf([mid, fwd, back, bigMid], "defcon");
    expect(box?.parts.map((part) => [part.position, part.home.map((m) => m.code)])).toEqual([
      ["D", [back.code]],
      ["M", [bigMid.code, mid.code]],
      ["F", [fwd.code]],
    ]);
  });

  it("draws every other category as one undivided part", () => {
    const box = boxOf([man("D", { G: 1 }), man("F", { G: 2 })], "INDIVIDUAL_GOALS");
    expect(box?.parts.map((part) => part.position)).toEqual([null]);
  });
});

describe("fantasyBoxes without the league", () => {
  it("shows no box when the league did not answer", () => {
    expect(fantasyBoxes({ home: [man("D", { DFP: 4, G: 1 })], away: [] }, null)).toEqual([]);
  });
});
