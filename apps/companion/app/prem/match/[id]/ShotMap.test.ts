import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ShotMap, { type PlottedShot, type ShotSide } from "./ShotMap";
import { PINNED_ON_PHONE } from "../../../desk";

vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/football/pitchBox", () => import("../../../components/football/pitchBox"));
vi.mock("@/app/components/football/shotGeometry", () => import("../../../components/football/shotGeometry"));
vi.mock("@/app/components/shell/Link", () => import("../../../components/shell/Link"));

const shot: PlottedShot = {
  code: 1, fplFixtureId: 1, minute: 30, x: 88, y: 50, xg: 0.2, xgot: null, outcome: "miss",
  situation: null, bodyPart: null, assistCode: null, pass: null, side: "away", name: "Haaland", assister: null,
};
const side: ShotSide = { label: "MCI", colour: "#6cabdd", ink: "#000", index: {} };

/** The markup, and where the pinned block opens and its pitch closes. */
function drawn() {
  const html = renderToStaticMarkup(
    createElement(ShotMap, { shots: [shot], home: side, away: side, order: "minute", hrefs: { minute: "/m", xg: "/x" } }),
  );
  const opens = html.indexOf(PINNED_ON_PHONE);
  return { html, opens, closes: html.indexOf("</svg></div>", opens) };
}

describe("the shot map's pinned pitch (Craig, 19 Oct 2026)", () => {
  it("sticks below lg only", () => {
    for (const name of PINNED_ON_PHONE.split(" ")) expect(name.startsWith("max-lg:")).toBe(true);
  });

  it("pins the pitch and leaves the key and the list to scroll", () => {
    const { html, opens, closes } = drawn();
    expect(opens).toBeGreaterThan(-1);
    expect(html.indexOf('aria-label="Where both sides shot from"', opens)).toBeLessThan(closes);
    expect(html.indexOf("Size is the chance behind it")).toBeGreaterThan(closes);
    expect(html.indexOf("<table")).toBeGreaterThan(closes);
  });
});
