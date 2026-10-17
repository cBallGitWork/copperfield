import { describe, expect, it } from "vitest";
import { formations } from "../../league/formations";
import type { RosterLimits } from "../../league/types";
import { binStar, binXi, owed, type BinMan, type Worth } from "./select";

const limits: RosterLimits = {
  maxTotalPlayers: 14,
  maxActivePlayers: 11,
  maxReservePlayers: 3,
  maxActiveByPosition: { G: 1, D: 5, M: 5, F: 3 },
  minActiveByPosition: { G: 1, D: 3, M: 2, F: 1 },
};
const SHAPES = formations(limits);
const GOALS: Record<string, number> = { G: 10, D: 6, M: 5, F: 4 };
const worth: Worth = (position) => (GOALS[position] === undefined ? null : { goal: GOALS[position], assist: 3 });
const LUCK = 0.5;

let next = 0;
function man(position: string, points: number, more: Partial<BinMan> = {}): BinMan {
  next += 1;
  return {
    fantraxId: `p${next}`, code: next, name: `${position} ${next}`, clubId: 1, position, points,
    minutes: 90, started: true, goals: 0, assists: 0, expectedGoals: 0, expectedAssists: 0,
    shots: 0, shotsOnTarget: 0, chancesCreated: 0, ...more,
  };
}

/** A full pool: a keeper, five defenders, five midfielders, three forwards, strongest first. */
function pool(): BinMan[] {
  return [
    man("G", 6),
    ...[12, 9, 6, 6, 2].map((points) => man("D", points)),
    ...[11, 8, 7, 6, 1].map((points) => man("M", points)),
    ...[6, 5, 2].map((points) => man("F", points)),
  ];
}

describe("binXi", () => {
  it("fields the shape the points pick, keeper first and each line back to front", () => {
    const side = binXi(pool(), SHAPES, () => null, LUCK);
    expect(side?.shape).toBe("4-4-2");
    expect(side?.xi.map((each) => each.position)).toEqual(["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"]);
    expect(side?.total).toBe(6 + 12 + 9 + 6 + 6 + 11 + 8 + 7 + 6 + 6 + 5);
  });

  it("leaves out a man who came off the bench, however he scored", () => {
    const cameo = man("M", 20, { started: false, minutes: 6, goals: 1 });
    const side = binXi([...pool(), cameo], SHAPES, () => null, LUCK);
    expect(side?.xi.map((each) => each.fantraxId)).not.toContain(cameo.fantraxId);
  });

  it("lets the chances he made move a close call", () => {
    const lucky = man("M", 6, { goals: 1, expectedGoals: 0.05 });
    const unlucky = man("M", 5, { expectedGoals: 1.2, shots: 6 });
    // Four midfielders make the side either way; the fourth place is the close call.
    const rest = [man("G", 6), ...[12, 9, 8, 8, 2].map((p) => man("D", p)), ...[11, 8, 7].map((p) => man("M", p)), ...[6, 6, 2].map((p) => man("F", p))];
    const picked = (luck: number) => binXi([...rest, lucky, unlucky], SHAPES, worth, luck)?.xi.map((each) => each.fantraxId);
    expect(picked(0)).toContain(lucky.fantraxId);
    expect(picked(0)).not.toContain(unlucky.fantraxId);
    expect(picked(LUCK)).toContain(unlucky.fantraxId);
    expect(picked(LUCK)).not.toContain(lucky.fantraxId);
  });

  it("never lets the chances overturn a big score", () => {
    const big = man("F", 9, { goals: 1, expectedGoals: 0.1 });
    const busy = man("F", 5, { expectedGoals: 1 });
    expect(big.points + LUCK * owed(big, worth)).toBeGreaterThan(busy.points + LUCK * owed(busy, worth));
  });

  it("fields eleven and no bench", () => {
    const denied = man("F", 2, { expectedGoals: 1.4, shots: 6 });
    const side = binXi([...pool(), denied], SHAPES, worth, LUCK);
    expect(side?.xi).toHaveLength(11);
    expect(side).not.toHaveProperty("bench");
  });

  it("stars the man with the most points, the first fielded on a tie", () => {
    const side = binXi(pool(), SHAPES, () => null, LUCK);
    expect(side === null ? null : binStar(side).points).toBe(12);
    const level = man("M", 12);
    const tied = binXi([...pool(), level], SHAPES, () => null, LUCK);
    expect(tied === null ? null : binStar(tied).position).toBe("D");
  });

  it("files no side when no allowed shape can be filled by men who started", () => {
    expect(binXi(pool().filter((each) => each.position !== "G"), SHAPES, worth, LUCK)).toBeNull();
    expect(binXi(pool(), [], worth, LUCK)).toBeNull();
  });
});
