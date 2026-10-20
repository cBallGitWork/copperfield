import { describe, expect, it, vi } from "vitest";
import { type FootballPlayer, type FootballSnapshot, type RawPlFixture, mapRoundGoals } from "@epl/core";
import { wireLines } from "./wireLines";
import { withSheets } from "./sheetCodes";

vi.mock("../plFeed", () => ({}));

// GW6: 6 of 36 scorers and 2 assisters printed "—" on the wire, Henderson twice, because the bridge was last
// harvested on 7 Sep. The match pages named them all off the team sheets; Live's goals now read the same sheets.

const HENDERSON = 3712;
const MANZAMBI = 304175;
const FIXTURE_CODE = 2645221;

function man(id: number, opta: string, display: string) {
  return { id, name: { display }, altIds: { opta } };
}

const ROUND: RawPlFixture = {
  id: 128975,
  status: "C",
  teams: [],
  altIds: { opta: `g${FIXTURE_CODE}` },
  goals: [{ personId: HENDERSON, assistId: MANZAMBI, clock: { secs: 90, label: "02'00" }, type: "G" }],
};

const DETAIL: RawPlFixture = {
  ...ROUND,
  teamLists: [
    { teamId: 1, lineup: [man(HENDERSON, "p56979", "Jordan Henderson")], substitutes: [] },
    { teamId: 2, lineup: [], substitutes: [man(MANZAMBI, "p614071", "Johan Manzambi")] },
  ],
};

const players = [
  { code: 56979, id: 1, name: "Henderson", clubId: 1, optaCode: "p56979" },
  { code: 614071, id: 2, name: "Manzambi", clubId: 2, optaCode: "p614071" },
] as FootballPlayer[];

const snapshot = { clubs: [], players, fixtures: [] } as unknown as FootballSnapshot;

function names(codes: Map<number, number>): (string | undefined)[] {
  const lines = wireLines(mapRoundGoals([ROUND], codes), snapshot, undefined, null);
  return lines.flatMap((row) => [row.man?.player.name, row.second?.player.name]);
}

describe("the goals' names", () => {
  it("prints no name for a man the bridge has not harvested", () => {
    expect(names(new Map())).toEqual([undefined, undefined]);
  });

  it("names the scorer and the assister off the match's team sheet", () => {
    const opta = new Map(players.map((player) => [player.optaCode ?? "", player.code]));
    expect(names(withSheets(new Map(), [DETAIL], opta))).toEqual(["Henderson", "Manzambi"]);
  });

  it("keeps the bridge's code where the sheet names nobody", () => {
    expect(withSheets(new Map([[9, 99]]), [ROUND], new Map()).get(9)).toBe(99);
  });
});
