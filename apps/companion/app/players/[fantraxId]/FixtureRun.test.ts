import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Opposition } from "@epl/core";
import FixtureRun from "./FixtureRun";

vi.mock("@/app/desk", () => import("../../desk"));

const run = [7, 8].map(
  (gameweek) =>
    ({
      club: { id: 2, code: 31, name: "Crystal Palace", shortName: "CRY" },
      home: true,
      difficulty: 3,
      fixture: { id: gameweek, gameweek },
    }) as unknown as Opposition,
);

const html = renderToStaticMarkup(
  createElement(FixtureRun, { run, minutes: new Map([[7, 83], [8, 85]]), asOf: "Thu 15 Oct", view: "attack" }),
);

describe("Next up", () => {
  // A phone never shows the title the row's figures carried; "83 85" was a row of numbers with no name (review M30).
  it("names the xMins row on screen", () => {
    expect(html).toMatch(/>xMins</);
    expect(html).toContain(">83<");
  });

  // LAYOUT-10: a table drawn without the table's head, its figures a step under every board's.
  it("heads each gameweek on the table's plate, each fixture one 28px line, xMins at the row figure's size", () => {
    expect(html).toMatch(/<span class="cm-bevel flex h-6 items-center[^"]*text-3xs font-bold uppercase">GW7</);
    expect(html).toMatch(/class="numeric flex min-h-7 items-baseline[^"]*"/);
    expect(html).not.toMatch(/min-h-11/);
    expect(html).toMatch(/<span class="numeric text-center font-bold text-info text-sm"[^>]*>83</);
  });

  // Craig, 24 Oct 2026: the planner's ramp in place of FPL's five steps.
  it("draws each fixture on the ease ramp, never FPL's difficulty", () => {
    expect(html).toContain("--color-ease-");
    expect(html).not.toContain("--color-fdr-");
  });

  // The model's figure was undated, so Friday's read passed for Monday's (review M23).
  it("dates the xMins once", () => {
    expect(html.match(/Thu 15 Oct/g)).toHaveLength(1);
  });
});
