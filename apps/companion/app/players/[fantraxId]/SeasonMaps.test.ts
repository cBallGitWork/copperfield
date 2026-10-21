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

  // The map draws the shots it can place; Rankings' KP is the league's count, which can run one higher.
  it("captions the chances map by the shots it draws, never as the chances Rankings counts", () => {
    const html = renderToStaticMarkup(
      createElement(SeasonMaps, { maps: { shots: [], chances: [shot, shot], touches: [] }, club: undefined }),
    );
    expect(html).toContain("Shots set up");
    expect(html).not.toContain("Chances created");
    expect(html).toMatch(/Shots set up<\/span><span[^>]*>2</);
  });
});

describe("a past season's maps", () => {
  it("names the season and counts the touches its cells hold", () => {
    const html = renderToStaticMarkup(
      createElement(SeasonMaps, {
        maps: { shots: [{ x: 90, y: 50, xg: 0.3, outcome: "goal" }], chances: [], touches: new Map([[10, 4], [11, 3]]) },
        club: undefined,
        season: "2023/24",
      }),
    );
    expect(html).toContain("His 1 shot in 2023/24");
    expect(html).toContain("Where he touched the ball in 2023/24");
    expect(html).toContain(">7<");
    expect(html).not.toContain("Shots set up");
  });

  it("draws nothing for a season with no rows for him", () => {
    const html = renderToStaticMarkup(
      createElement(SeasonMaps, { maps: { shots: [], chances: [], touches: new Map() }, club: undefined, season: "2023/24" }),
    );
    expect(html).toBe("");
  });
});

describe("the season maps without chances", () => {
  const touches = new Map([[10, 4]]);
  it("runs three columns on a desk and puts the outcomes beside the shots on a phone", () => {
    const html = renderToStaticMarkup(createElement(SeasonMaps, { maps: { shots: [shot], chances: [], touches }, club: undefined }));
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("Outcomes");
    expect(html).toContain("Missed");
    expect(html).toContain("0.20");
  });

  it("keeps four columns and no outcomes when he set chances up", () => {
    const html = renderToStaticMarkup(createElement(SeasonMaps, { maps: { shots: [shot], chances: [shot], touches }, club: undefined }));
    expect(html).toContain("lg:grid-cols-4");
    expect(html).not.toContain("Outcomes");
  });
});
