import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { IndexCell } from "./TableCells";

vi.mock("@/app/desk", () => import("../../desk"));

/** The index td's classes, as rendered. */
function indexClasses(wide = false): string[] {
  const cell = IndexCell({ wide, children: "=10th" });
  const row = createElement("tr", null, cell);
  const html = renderToStaticMarkup(createElement("table", null, createElement("tbody", null, row)));
  return (html.match(/<td class="([^"]*)"/)?.[1] ?? "").split(/\s+/);
}

describe("the index cell", () => {
  // '=10th' measures 29.6px at 390 and 33.8px at 1440; the cell is 32 and 36, so side padding pushes it over.
  it("leaves its whole width to a five-character label", () => {
    const classes = indexClasses();
    expect(classes).toEqual(expect.arrayContaining(["w-8", "lg:w-9", "px-0"]));
    expect(classes.filter((name) => /^(lg:)?(px|pl|pr)-/.test(name) && name !== "px-0")).toEqual([]);
  });

  it("keeps its edge when a date or season grows it", () => {
    expect(indexClasses(true)).toContain("px-1.5");
  });
});
