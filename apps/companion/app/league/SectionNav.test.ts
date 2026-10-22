import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import SectionNav from "./SectionNav";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

/** Each plate as its label, its classes and whether it is current. */
function plates(current: Parameters<typeof SectionNav>[0]["current"]) {
  const html = renderToStaticMarkup(createElement(SectionNav, { current }));
  return [...html.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)].map(([, attrs, label]) => ({
    label: label.replace(/<[^>]+>/g, ""),
    phone: !/\bmax-lg:hidden\b/.test(attrs),
    desk: !/\blg:hidden\b/.test(attrs.replace(/max-lg:hidden/g, "")),
    lit: attrs.includes('aria-current="page"'),
  }));
}

const drawn = (width: "phone" | "desk", current: Parameters<typeof plates>[0]) =>
  plates(current).filter((plate) => plate[width]);

describe("the League strip at each width (Craig, 22 Oct 2026: more on the desk's blue bar)", () => {
  it("draws the phone's five plates under lg, unchanged", () => {
    expect(drawn("phone", "table").map((plate) => plate.label)).toEqual(["League", "Cups", "Fixtures", "Transfers", "Team Stats"]);
  });

  it("adds Waivers and Squads from lg", () => {
    expect(drawn("desk", "table").map((plate) => plate.label)).toEqual([
      "League",
      "Cups",
      "Fixtures",
      "Transfers",
      "Waivers",
      "Team Stats",
      "Squads",
    ]);
  });

  it("lights Transfers for Waivers under lg and Waivers itself from lg, one plate each", () => {
    expect(drawn("phone", "waivers").filter((plate) => plate.lit).map((plate) => plate.label)).toEqual(["Transfers"]);
    expect(drawn("desk", "waivers").filter((plate) => plate.lit).map((plate) => plate.label)).toEqual(["Waivers"]);
  });

  it("lights nothing on Matchups at either width", () => {
    expect(plates("matchups").some((plate) => plate.lit)).toBe(false);
  });
});
