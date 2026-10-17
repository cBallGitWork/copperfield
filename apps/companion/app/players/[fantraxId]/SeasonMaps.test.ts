import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Shot } from "@epl/core";
import SeasonMaps from "./SeasonMaps";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/football/pitchBox", () => import("../../components/football/pitchBox"));

const shot: Shot = {
  code: 1, fplFixtureId: 1, minute: 30, x: 88, y: 50, xg: 0.2, xgot: null, outcome: "miss",
  situation: null, bodyPart: null, assistCode: null, pass: { x: 70, y: 40 },
};

describe("the season maps' labels", () => {
  // "His 1 shots this season" was read aloud (review N33).
  it("says one shot, not one shots", () => {
    const html = renderToStaticMarkup(
      createElement(SeasonMaps, { maps: { shots: [shot], chances: [shot], touches: [] }, club: undefined }),
    );
    expect(html).toContain("His 1 shot this season");
    expect(html).toContain("The 1 shot he set up");
    expect(html).not.toContain("1 shots");
  });
});
