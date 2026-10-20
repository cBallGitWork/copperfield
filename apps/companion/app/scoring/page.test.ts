import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PANEL } from "../desk";

const held = vi.hoisted(() => ({ scoring: null as unknown }));
vi.mock("@/app/scoring", () => ({ leagueScoring: async () => held.scoring }));
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

// At 320 the four slot columns' side padding pushed the 285px board through the panel's right padding.
describe("Scoring's figure cells", () => {
  it("narrow their side padding below 375px, so the board fits inside the panel's inset", async () => {
    held.scoring = {
      rules: { goaliePosition: "G", goalie: { G: { Default: 10 } }, outfield: { G: { D: 6, M: 5, F: 4, Default: 0 } } },
      categories: { "5020#1": { code: "G", name: "Goals", longCode: null } },
    };
    const page = await html();
    held.scoring = null;
    const figures = page.match(/<td[^>]*class="numeric[^"]*"/g) ?? [];
    expect(figures.length).toBeGreaterThan(0);
    for (const td of figures) expect(td).toContain("max-[374px]:px-0.5");
  });
});
