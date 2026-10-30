import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import { OPTA_TO_CODE as optaToCode } from "../__fixtures__/plFixtureCodes";
import type { RawPlFixture, RawPlFixtureEvent } from "./raw";
import { sheetMoments } from "./sheetMoments";

// Liverpool 2-2 Nottingham Forest (GW2), as recorded: four period marks, goals, bookings and changes.
const DETAIL = recordedFixture as unknown as RawPlFixture;
const CODE = 2561895;
const moments = sheetMoments(DETAIL, CODE, optaToCode);

describe("sheetMoments", () => {
  it("names the kick-off, half-time and full-time whistles", () => {
    const whistles = moments.filter((m) => m.kind === "kick-off" || m.kind === "half-time" || m.kind === "full-time");
    expect(whistles.map((m) => [m.kind, m.minute])).toEqual([
      ["kick-off", "0"],
      ["half-time", "45+4"],
      ["full-time", "90+6"],
    ]);
    expect(whistles[1]?.score).toEqual({ home: 0, away: 1 });
    expect(whistles[2]?.score).toEqual({ home: 2, away: 2 });
  });

  it("stamps every moment with the feed's wall clock and its fixture code", () => {
    expect(moments.every((m) => m.fixtureCode === CODE && typeof m.at === "number")).toBe(true);
    expect(moments.find((m) => m.kind === "kick-off")?.at).toBe(1788003087000);
  });

  it("files the man taken off and the man coming on, each at the change's minute", () => {
    const offs = moments.filter((m) => m.kind === "off");
    const ons = moments.filter((m) => m.kind === "on");
    const changes = (DETAIL.events ?? []).filter((e) => e.type === "S");
    expect(offs.length + ons.length).toBe(changes.length);
    // plFixtureCodes.ts codes each man as his Premier League id plus a million.
    const on = new Set(changes.filter((e) => e.description === "ON").map((e) => (e.personId ?? 0) + 1_000_000));
    expect(ons.every((m) => m.man !== null && on.has(m.man))).toBe(true);
    expect(ons[0]?.minute).toBe("66");
  });

  it("gives a change's two halves the feed's one event id, and a whistle none", () => {
    const first = moments.find((m) => m.kind === "on");
    expect(first?.id).toBe(392141);
    expect(moments.filter((m) => m.id === first?.id).map((m) => m.kind)).toEqual(["on", "off"]);
    expect(moments.find((m) => m.kind === "kick-off")?.id).toBeNull();
  });

  it("knows each moment's half, so the first half's added time orders before the second half", () => {
    const half = (kind: string) => moments.find((m) => m.kind === kind)?.half;
    expect(half("half-time")).toBe(1);
    expect(half("full-time")).toBe(2);
    expect(moments.find((m) => m.kind === "second-half")?.at).toBe(1788006980000);
  });

  it("keeps each goal's clock and score, for the stream to stamp the round's goals with", () => {
    const goals = moments.filter((m) => m.kind === "goal");
    expect(goals.length).toBe(4);
    expect(goals.at(-1)?.score).toEqual({ home: 2, away: 2 });
    expect(goals.every((m) => typeof m.seconds === "number")).toBe(true);
  });

  it("tells a booking from a sending-off, and keeps a card that belongs to no man as nobody's", () => {
    const at = (label: string, extra: Partial<RawPlFixtureEvent>): RawPlFixtureEvent => ({
      type: "B",
      teamId: 1,
      clock: { secs: 600, label },
      phase: "1",
      time: { millis: 1 },
      ...extra,
    });
    const cards = sheetMoments(
      { ...DETAIL, events: [at("10'00", { description: "Y" }), at("11'00", { description: "R", personId: 5140 })] },
      CODE,
      optaToCode,
    );
    expect(cards.map((m) => [m.kind, m.minute, m.man])).toEqual([
      ["booked", "10", null],
      ["sent-off", "11", 1_005_140],
    ]);
  });

  it("leaves out an event with no clock, and a match with no events is no moments", () => {
    expect(sheetMoments({ ...DETAIL, events: [{ type: "PS", phase: "1" }] }, CODE, optaToCode)).toEqual([]);
    expect(sheetMoments({ ...DETAIL, events: undefined }, CODE, optaToCode)).toEqual([]);
  });
});
