import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballSnapshot } from "@epl/core";
import { BetweenGameweeks } from "./Between";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => import("../components/shell/Link"));
vi.mock("@/app/league/SectionNav", () => import("../league/SectionNav"));

// Friday 16 Oct: gameweek 6 done, gameweek 7's first ball Sat 12:30, its lineups locking at 12:15.
const snapshot = { gameweek: 6 } as FootballSnapshot;
const up = { gameweek: 7, kickoff: "2026-10-17T11:30:00Z" };

const panel = (locksAt: string | null) =>
  renderToStaticMarkup(createElement(BetweenGameweeks, { snapshot, up, locksAt }));

// The same Friday seen once gameweek 7 is FPL's current one: nothing finished, the panel names no next week.
const before = (locksAt: string | null) =>
  renderToStaticMarkup(createElement(BetweenGameweeks, { snapshot: { gameweek: 7 } as FootballSnapshot, up, locksAt }));

describe("Live between gameweeks", () => {
  it("gives the coming gameweek's lineup lock, not its kickoff", () => {
    const html = panel("2026-10-17T11:15:00.000Z");
    expect(html).toContain("Gameweek 7 line-ups lock ");
    expect(html).toContain("12:15");
    expect(html).not.toContain("12:30");
  });

  it("gives the kickoff when the league names no lock", () => {
    expect(panel(null)).toContain("Gameweek 7 starts ");
  });

  it("draws no h1: the page's title bar holds the only one", () => {
    expect(panel(null)).not.toContain("<h1");
  });

  it("ends the lock line on the time, with no full stop", () => {
    expect(panel("2026-10-17T11:15:00.000Z")).toMatch(/12:15<\/span><\/p>/);
  });

  it("says the week is over once, in the sub line, not again in the panel's head", () => {
    expect(panel(null)).not.toContain("is done");
    expect(before(null)).not.toContain("Gameweek 7 next");
    expect(panel(null)).toContain("No football today");
  });

  it("sends 'Who plays whom' to the league's fixtures for the coming gameweek", () => {
    const html = before("2026-10-17T11:15:00.000Z");
    expect(html).toContain('href="/league/fixtures?gw=7"');
    expect(html).not.toContain('href="/league/matchups"');
  });
});
