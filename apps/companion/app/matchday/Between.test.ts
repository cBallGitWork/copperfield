import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballSnapshot } from "@epl/core";
import { BetweenGameweeks } from "./Between";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => import("../components/shell/Link"));
vi.mock("@/app/league/routes", () => import("../league/routes"));

// Friday 16 Oct: gameweek 6 done, gameweek 7's first ball Sat 12:30, its lineups locking at 12:15.
const snapshot = { gameweek: 6 } as FootballSnapshot;
const up = { gameweek: 7, kickoff: "2026-10-17T11:30:00Z" };

const panel = (locksAt: string | null) =>
  renderToStaticMarkup(createElement(BetweenGameweeks, { snapshot, up, locksAt }));

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
});
