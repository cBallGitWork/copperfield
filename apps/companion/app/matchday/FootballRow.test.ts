import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, Fixture } from "@epl/core";
import FootballRow from "./FootballRow";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/mine", () => import("../mine"));
vi.mock("@/app/components/shell/Link", () => import("../components/shell/Link"));

const fixture = {
  id: 58, code: 2645258, gameweek: 7, homeClubId: 14, awayClubId: 43, kickoff: "2026-10-17T14:00:00Z",
  homeScore: 0, awayScore: 1, status: "live", settled: false, minutes: 70, homeDifficulty: null, awayDifficulty: null,
} as Fixture;
const clubs = new Map<number, Club>([
  [14, { id: 14, code: 14, name: "Liverpool", shortName: "LIV" } as Club],
  [43, { id: 43, code: 43, name: "Man City", shortName: "MCI" } as Club],
]);

const row = (over: Partial<Fixture>, now = true) =>
  renderToStaticMarkup(createElement(FootballRow, { fixture: { ...fixture, ...over }, clubs, places: new Map(), now }));

describe("a Premier League row's clock", () => {
  it("prints the minute in the live slot while the match runs", () => {
    expect(row({})).toMatch(/text-live">70′</);
  });

  it("prints no minute from a stale snapshot", () => {
    expect(row({}, false)).not.toContain("70′");
  });

  it("prints FT once it is over, fresh or not", () => {
    expect(row({ status: "finished" }, false)).toContain(">FT<");
  });

  it("prints nothing before kick-off", () => {
    expect(row({ status: "upcoming", homeScore: null, awayScore: null } as Partial<Fixture>)).not.toMatch(/FT|′/);
  });
});
