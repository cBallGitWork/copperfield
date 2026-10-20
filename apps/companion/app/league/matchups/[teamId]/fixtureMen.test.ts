import { describe, expect, it } from "vitest";
import type { Fixture, FootballPlayer, LineupDetail, SquadPlayerDetail } from "@epl/core";
import { byKickoff, fixtureMen, menByEnd } from "./fixtureMen";

const fixture = (id: number, kickoff: string | null): Fixture =>
  ({ id, code: id, kickoff, status: "finished" }) as Fixture;

const man = (fantraxId: string, points: number | null, ...fixtures: Fixture[]): SquadPlayerDetail => placed(fantraxId, points, true, ...fixtures);

const placed = (fantraxId: string, points: number | null, home: boolean, ...fixtures: Fixture[]): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId, position: "M", status: "" }, player: { code: 1, name: fantraxId } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: fixtures.map((f) => ({ club: { id: 2, code: 2, name: "B", shortName: "B" }, home, difficulty: null, fixture: f })),
  points,
  minutes: [],
});

const sat = fixture(1, "2026-09-19T14:00:00Z");
const sun = fixture(2, "2026-09-20T13:00:00Z");

describe("fixtureMen", () => {
  const sheet = {
    rows: [{ position: "M", players: [man("a", 2, sat), man("b", 7, sat), man("c", 3, sun)] }],
    bench: [man("d", 1, sat)],
  } as unknown as LineupDetail;

  it("lists the men in one match, the eleven by points before the bench", () => {
    expect(fixtureMen(sheet, 1).map((m) => [m.player.rostered.slot.fantraxId, m.reserve])).toEqual([
      ["b", false],
      ["a", false],
      ["d", true],
    ]);
  });

  it("names nobody for a side whose eleven is withheld", () => {
    expect(fixtureMen(undefined, 1)).toEqual([]);
  });

  it("prints a double's period points under his later match only", () => {
    const double = { rows: [{ position: "M", players: [man("e", 9, sat, sun)] }], bench: [] } as unknown as LineupDetail;
    expect(fixtureMen(double, 1)[0]?.scored).toBe(false);
    expect(fixtureMen(double, 2)[0]?.scored).toBe(true);
  });
});

describe("menByEnd", () => {
  // 19 Oct 2026: split by manager, Cunha printed under Chelsea though he plays for Man Utd.
  it("puts each man under his own club, whichever manager holds him", () => {
    const mine = { rows: [{ position: "F", players: [placed("cunha", 2, false, sat), man("palmer", 5, sat)] }], bench: [] };
    const theirs = { rows: [{ position: "F", players: [placed("mbeumo", 3, false, sat)] }], bench: [] };
    const ends = menByEnd([mine, theirs] as unknown as LineupDetail[], 1);
    const ids = (men: typeof ends.home) => men.map((m) => [m.player.rostered.slot.fantraxId, m.side]);
    expect(ids(ends.home)).toEqual([["palmer", 0]]);
    expect(ids(ends.away)).toEqual([["cunha", 0], ["mbeumo", 1]]);
  });
});

describe("byKickoff", () => {
  it("orders by kick-off and puts an undated match last", () => {
    expect(byKickoff([sun, fixture(3, null), sat]).map((f) => f.id)).toEqual([1, 2, 3]);
  });
});
