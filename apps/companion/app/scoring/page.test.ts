import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PANEL } from "../desk";

vi.mock("@/app/scoring", () => ({ leagueScoring: async () => null }));
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/scoring", useRouter: () => ({}) }));

import ScoringPage from "./page";

const html = async () => renderToStaticMarkup(await ScoringPage());

// M-SHELL-5 + M-CONSIST-5: More's three children were headed two ways; Scoring alone wore Read's strip.
describe("Scoring's head", () => {
  it("has the back plate its siblings have, and no Read strip", async () => {
    const page = await html();
    expect(page).toContain('aria-label="Back"');
    expect(page).not.toContain('aria-label="Read"');
  });
});

// M-CONSIST-9: its table and its cup ties sat flush to the panel's border while every other board is inset.
describe("Scoring's panels", () => {
  it("inset both sections by the panel's own padding", async () => {
    const page = await html();
    expect(page.match(new RegExp(`<section[^>]*class="${PANEL}`, "g"))).toHaveLength(2);
  });
});
