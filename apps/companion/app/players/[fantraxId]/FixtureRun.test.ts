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
  createElement(FixtureRun, { run, minutes: new Map([[7, 83], [8, 85]]), asOf: "Thu 15 Oct", weeks: null, group: null }),
);

describe("Next up", () => {
  // A phone never shows the title the row's figures carried; "83 85" was a row of numbers with no name (review M30).
  it("names the xMins row on screen", () => {
    expect(html).toMatch(/>xMins</);
    expect(html).toContain(">83<");
  });

  // The model's figure was undated, so Friday's read passed for Monday's (review M23).
  it("dates the xMins once", () => {
    expect(html.match(/Thu 15 Oct/g)).toHaveLength(1);
  });
});
