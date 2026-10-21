import { describe, expect, it } from "vitest";
import type { Shot, TouchPlayer } from "@epl/core";
import { attackingSpan, pastSeasonMaps, seasonMaps, shotBreakdown, touchCount } from "./maps";

const HIM = 1;
const MATE = 2;

function shot(code: number, extra: Partial<Shot> = {}): Shot {
  return {
    code,
    fplFixtureId: 10,
    minute: 30,
    x: 88,
    y: 50,
    xg: 0.1,
    xgot: null,
    outcome: "miss",
    situation: null,
    bodyPart: null,
    assistCode: null,
    pass: null,
    ...extra,
  };
}

const shots = new Map<number, Shot[]>([
  [HIM, [shot(HIM), shot(HIM, { outcome: "goal", assistCode: MATE })]],
  [MATE, [shot(MATE, { assistCode: HIM, pass: { x: 70, y: 20 } }), shot(MATE, { assistCode: HIM }), shot(MATE)]],
]);

const touches = new Map<number, TouchPlayer>([
  [
    HIM,
    {
      code: HIM,
      fixtures: [
        { fplFixtureId: 10, p: [40, 50, 60, 55] },
        { fplFixtureId: 11, p: [70, 30] },
      ],
    },
  ],
]);

describe("seasonMaps", () => {
  it("takes his own shots, and none of a teammate's", () => {
    const maps = seasonMaps(HIM, shots, touches, false);
    expect(maps.shots).toEqual(shots.get(HIM));
  });

  it("takes every shot he set up as his chances, with or without a pass to draw", () => {
    const maps = seasonMaps(HIM, shots, touches, false);
    expect(maps.chances).toHaveLength(2);
    expect(maps.chances.every((each) => each.code === MATE && each.assistCode === HIM)).toBe(true);
  });

  it("merges his touches across every fixture", () => {
    expect(seasonMaps(HIM, shots, touches, false).touches).toEqual([
      { x: 40, y: 50 },
      { x: 60, y: 55 },
      { x: 70, y: 30 },
    ]);
  });

  it("gives a keeper his touches and nothing else", () => {
    const maps = seasonMaps(HIM, shots, touches, true);
    expect(maps.shots).toEqual([]);
    expect(maps.chances).toEqual([]);
    expect(maps.touches).toHaveLength(3);
  });

  it("has nothing for a man the files never mention", () => {
    expect(seasonMaps(99, shots, touches, false)).toEqual({ shots: [], chances: [], touches: [] });
  });
});

describe("attackingSpan", () => {
  it("is the attacking half when everything is in it", () => {
    expect(attackingSpan([{ x: 88 }, { x: 60 }])).toEqual({ x: 50, width: 50 });
  });

  it("reaches back for a pass or a shot from his own half, rather than cutting it off", () => {
    const span = attackingSpan([{ x: 88 }, { x: 30 }]);
    expect(span.x).toBeLessThan(30);
    expect(span.x + span.width).toBe(100);
  });

  it("never reaches past his own goal line", () => {
    expect(attackingSpan([{ x: 1 }])).toEqual({ x: 0, width: 100 });
  });
});

describe("pastSeasonMaps", () => {
  const past = { counts: new Map([[0, 3], [5, 2]]), shots: [{ x: 90, y: 50, xg: 0.2, outcome: "miss" as const }] };

  it("draws his shots and touches, and no chances, which the file does not carry", () => {
    expect(pastSeasonMaps(past, false)).toEqual({ shots: past.shots, chances: [], touches: past.counts });
  });

  it("keeps a keeper's touches only", () => {
    expect(pastSeasonMaps(past, true).shots).toEqual([]);
  });

  it("counts touches off points or cells alike", () => {
    expect(touchCount(past.counts)).toBe(5);
    expect(touchCount([{ x: 1, y: 1 }])).toBe(1);
  });
});

describe("shotBreakdown", () => {
  it("counts every outcome, noughts kept, and sums the xG the shots carry", () => {
    const { rows, xg } = shotBreakdown([
      { x: 90, y: 50, xg: 0.5, outcome: "goal" },
      { x: 90, y: 50, xg: 0.25, outcome: "miss" },
      { x: 90, y: 50, xg: null, outcome: "miss" },
    ]);
    expect(rows.map((row) => [row.label, row.count])).toEqual([
      ["Goals", 1], ["Saved", 0], ["Post", 0], ["Missed", 2], ["Blocked", 0],
    ]);
    expect(xg).toBe(0.75);
  });

  it("has no xG when no shot carries one", () => {
    expect(shotBreakdown([{ x: 90, y: 50, xg: null, outcome: "save" }]).xg).toBeNull();
  });
});
