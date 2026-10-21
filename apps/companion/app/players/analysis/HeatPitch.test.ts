import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { touchesOf } from "@epl/core";
import { intelTouches } from "../../intel";
import HeatPitch from "./HeatPitch";
import { binned } from "./heat";

vi.mock("@/app/components/football/pitchBox", () => import("../../components/football/pitchBox"));

const draw = (touches: Parameters<typeof HeatPitch>[0]["touches"]) =>
  renderToStaticMarkup(createElement(HeatPitch, { touches, id: "season", label: "Touches" }));

describe("a heat pitch off counted cells", () => {
  // A past season's file is binned on heat.ts's grid; this season's men must draw the same off either.
  it("draws every man in this season's file byte for byte as his points do", () => {
    expect(intelTouches.size).toBeGreaterThan(0);
    for (const player of intelTouches.values()) {
      const points = touchesOf(player, null);
      expect(draw(binned(points))).toBe(draw(points));
    }
  });
});
