import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MinutesRun from "./MinutesRun";

vi.mock("@/app/desk", () => import("../../desk"));

describe("a card's xMins", () => {
  it("prints the day the model's figures are from, once", () => {
    const html = renderToStaticMarkup(
      createElement(MinutesRun, {
        weeks: [
          { gameweek: 7, minutes: 23, asOf: "Thu 15 Oct" },
          { gameweek: 8, minutes: 67, asOf: "Thu 15 Oct" },
        ],
      }),
    );
    expect(html.match(/Thu 15 Oct/g)).toHaveLength(1);
  });
});
