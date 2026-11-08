import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HeadRow } from "./TableHeads";
import { GROUP_PLATE, MINOR_WORD, SECTION_BAR, SMALL_WORD } from "../../desk";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

// DESIGN §10.1: small capitals are the paper's furniture, never the desk's (the reskin, Craig 8 Nov 2026).
describe("a desk label", () => {
  it("prints a table's heads as they are written, xMins and FPts alike", () => {
    const html = renderToStaticMarkup(createElement("table", null, createElement("thead", null, createElement(HeadRow, null))));
    expect(html).not.toContain("uppercase");
  });

  it("is never set in capitals by a recipe", () => {
    for (const recipe of [SMALL_WORD, MINOR_WORD, GROUP_PLATE, SECTION_BAR]) expect(recipe).not.toContain("uppercase");
  });
});
