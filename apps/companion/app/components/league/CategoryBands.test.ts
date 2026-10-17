import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CategoryBand } from "@epl/core";
import CategoryBands from "./CategoryBands";

vi.mock("@/app/desk", () => ({ GROUP_PLATE: "", PANEL: "", gainOrLoss: () => "" }));

const goals: CategoryBand = { code: "G", name: "Goals", mine: [{ fantraxId: "a", points: 15 }], theirs: [] };
const names = new Map([["a", { name: "Semenyo", club: undefined, slot: "F" }]]);

/** The two figures on the band's plate, the URL's side first. */
function figures(priced: [boolean, boolean]): string[] {
  const html = renderToStaticMarkup(
    createElement(CategoryBands, { bands: [goals], names, theirNames: new Map(), priced, withheld: null }),
  );
  return [...html.matchAll(/<span class="numeric w-8[^"]*">([^<]*)<\/span>/g)].map((match) => match[1]);
}

describe("a band's totals", () => {
  // Review M42: "15 GOALS —" for a side whose men played, where Team Stats prints his 0.
  it("prints a nought for a side whose eleven registered none", () => {
    expect(figures([true, true])).toEqual(["15", "0"]);
  });

  it("keeps the dash for a side with no reading at all", () => {
    expect(figures([true, false])).toEqual(["15", "—"]);
  });
});
