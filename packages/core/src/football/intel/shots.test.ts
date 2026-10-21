import { describe, expect, it } from "vitest";
import type { IntelShots, Shot } from "./shots";
import { assistsOf, clubKickedOff, nonPenaltyXg, shotFixtures, shotIntel, shotsInFixture } from "./shots";
import type { Fixture } from "../types";

const MANIFEST = { season: "26-27", gameweek: null, exportedAt: "", rows: 0, sources: [] };

function shot(over: Partial<Shot> = {}): Shot {
  return {
    code: 1,
    fplFixtureId: 8,
    minute: 63,
    x: 88.5,
    y: 50,
    xg: 0.79,
    xgot: 0.9,
    outcome: "goal",
    situation: "penalty",
    bodyPart: "right-foot",
    assistCode: null,
    pass: null,
    ...over,
  };
}

const file = (shots: Shot[]): IntelShots => ({ manifest: MANIFEST, shots });

describe("shotIntel", () => {
  it("groups a man's shots under his code", () => {
    expect(shotIntel(file([shot(), shot({ minute: 70 })])).get(1)).toHaveLength(2);
  });

  it("drops a shot plotted off the pitch", () => {
    // A mark outside the touchline looks exactly like a real one.
    expect(shotIntel(file([shot({ x: 140 })])).size).toBe(0);
    expect(shotIntel(file([shot({ y: -3 })])).size).toBe(0);
  });

  it("drops a shot with no usable code or fixture", () => {
    expect(shotIntel(file([shot({ code: Number.NaN })])).size).toBe(0);
    expect(shotIntel(file([shot({ fplFixtureId: Number.NaN })])).size).toBe(0);
  });

  it("keeps a shot with no xG rather than losing the mark", () => {
    // A shot with no xG is still a location for the map to draw.
    expect(shotIntel(file([shot({ xg: null, xgot: null })])).get(1)).toHaveLength(1);
  });

  it("survives a file that is not there", () => {
    expect(shotIntel(null).size).toBe(0);
  });
});

describe("shotsInFixture", () => {
  const map = shotIntel(
    file([
      { ...shot(), code: 9, fplFixtureId: 1, minute: 80 },
      { ...shot(), code: 9, fplFixtureId: 1, minute: 12 },
      { ...shot(), code: 9, fplFixtureId: 2 },
      { ...shot(), code: 7, fplFixtureId: 2 },
    ]),
  );

  it("keeps only the men who shot in that match", () => {
    const here = shotsInFixture(map, 1);
    expect([...here.keys()]).toEqual([9]);
    expect(here.get(9)).toHaveLength(2);
  });

  it("orders a man's shots as he took them", () => {
    expect(shotsInFixture(map, 1).get(9)?.map((shot) => shot.minute)).toEqual([12, 80]);
  });

  it("answers an empty map for a fixture nobody shot in", () => {
    expect(shotsInFixture(map, 99).size).toBe(0);
  });
});

describe("the assister and his key pass", () => {
  it("carries both through when the export has them", () => {
    const read = shotIntel(file([shot({ assistCode: 42, pass: { x: 70, y: 30 } })])).get(1)?.[0];
    expect(read?.assistCode).toBe(42);
    expect(read?.pass).toEqual({ x: 70, y: 30 });
  });

  it("reads an older export, which has neither, as no assister and no pass", () => {
    const old = { ...shot() } as Partial<Shot>;
    delete old.assistCode;
    delete old.pass;
    const read = shotIntel(file([old as Shot])).get(1)?.[0];
    expect(read?.assistCode).toBeNull();
    expect(read?.pass).toBeNull();
  });

  it("drops a key pass drawn off the pitch but keeps the shot", () => {
    const read = shotIntel(file([shot({ assistCode: 42, pass: { x: 140, y: 30 } })])).get(1)?.[0];
    expect(read?.pass).toBeNull();
    expect(read?.assistCode).toBe(42);
  });
});

describe("assistsOf", () => {
  it("finds every shot a man set up, whoever struck it", () => {
    const byCode = shotIntel(
      file([
        shot({ code: 10, assistCode: 7, minute: 5 }),
        shot({ code: 11, assistCode: 7, minute: 40 }),
        shot({ code: 7, assistCode: 10, minute: 60 }),
        shot({ code: 12, assistCode: null, minute: 70 }),
      ]),
    );
    expect(assistsOf(byCode, 7).map((each) => each.minute)).toEqual([5, 40]);
    expect(assistsOf(byCode, 99)).toEqual([]);
  });
});

describe("nonPenaltyXg", () => {
  // The shot helper's fixture is 8: a file holding it, for a man whose xG counts it alone.
  const COVERED = { counted: [8], held: new Set([8]) };

  it("takes what his penalties were worth off his expected goals", () => {
    const his = [shot({ xg: 0.7884 }), shot({ xg: 0.7884, minute: 80 }), shot({ situation: "assisted", xg: 0.2 })];
    expect(nonPenaltyXg(2.09, his, COVERED)).toBeCloseTo(0.5132);
  });

  it("leaves a man who took none at his expected goals", () => {
    expect(nonPenaltyXg(1.2, [shot({ situation: "assisted", xg: 1.2 })], COVERED)).toBe(1.2);
    expect(nonPenaltyXg(0, [], COVERED)).toBe(0);
  });

  it("is absent, not nought, where the file cannot vouch for his shots", () => {
    expect(nonPenaltyXg(null, [], COVERED)).toBeNull();
    expect(nonPenaltyXg(1.5, null, COVERED)).toBeNull();
    expect(nonPenaltyXg(1.5, [shot()], null)).toBeNull();
    // Expected goals but no shot held: the file has not got his matches.
    expect(nonPenaltyXg(1.5, [], COVERED)).toBeNull();
    expect(nonPenaltyXg(1.5, [shot({ xg: null })], COVERED)).toBeNull();
  });

  it("dashes a man whose xG counts a match the file lacks, whose penalty would stand at full value", () => {
    // FPL has fixture 9 and its penalty; the file holds only 8, so xG less 8's penalty would be 0.79 too high.
    const his = [shot({ xg: 0.7884 })];
    expect(nonPenaltyXg(2.37, his, { counted: [8, 9], held: new Set([8]) })).toBeNull();
  });

  it("never goes below nought on FPL's rounding", () => {
    expect(nonPenaltyXg(0.78, [shot({ xg: 0.7884 })], COVERED)).toBe(0);
  });
});

describe("shotFixtures and clubKickedOff", () => {
  it("names every fixture the file holds a shot from", () => {
    const byCode = shotIntel(file([shot({ fplFixtureId: 3 }), shot({ code: 2, fplFixtureId: 5 }), shot({ fplFixtureId: 5 })]));
    expect([...shotFixtures(byCode)].sort()).toEqual([3, 5]);
  });

  it("counts a club's fixtures once kicked off, live ones included, and no other club's", () => {
    const fixture = (id: number, home: number, away: number, status: Fixture["status"]) =>
      ({ id, homeClubId: home, awayClubId: away, status }) as Fixture;
    const fixtures = [fixture(1, 7, 2, "finished"), fixture(2, 3, 7, "live"), fixture(3, 7, 4, "upcoming"), fixture(4, 2, 3, "finished")];
    expect(clubKickedOff(fixtures, 7)).toEqual([1, 2]);
  });
});
