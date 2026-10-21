import { type ComponentProps, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PANEL, PANEL_FLUSH } from "../../desk";

vi.mock("@/app/desk", () => import("../../desk"));

import SectionShell from "./SectionShell";

const panel = (flush?: boolean) => {
  const page = renderToStaticMarkup(createElement(SectionShell, { header: null, nav: null, rows: 10, flush } as ComponentProps<typeof SectionShell>, "x"));
  return page.slice(page.indexOf("<section"), page.indexOf(">", page.indexOf("<section")));
};

// D-9: /league and /prem inset the table's index spine 12px and 10px inside the panel; every list meets the edge.
describe("the section's panel", () => {
  it("pads its content by default", () => {
    expect(panel()).toContain(`class="${PANEL}"`);
  });

  it("holds a flush board against its edge, so the index spine meets the panel", () => {
    expect(panel(true)).toContain(`class="${PANEL_FLUSH}"`);
  });
});
