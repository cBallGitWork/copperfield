import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GroupNav from "../league/GroupNav";
import TabStrip from "./TabStrip";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const strip = (label: string) =>
  renderToStaticMarkup(
    createElement(TabStrip, { label: "Which leaders", tabs: [{ key: "a", label, href: "/a" }], current: "a" }),
  );

describe("TabStrip", () => {
  it("prints Live's xG and xA tabs as xG and xA, not XG and XA (19 Oct 2026)", () => {
    expect(strip("xG")).toContain('<span class="normal-case">xG</span>');
    expect(strip("xA")).toContain('<span class="normal-case">xA</span>');
  });

  it("leaves a plain word to the strip's capitals", () => {
    expect(strip("Points")).not.toContain("normal-case");
  });
});

describe("a strip docked at a screen's foot", () => {
  // M-CONSIST-1, 20 Oct 2026: at 320 Team Stats' groups wrapped onto two rows, 88px tall over the rail.
  it("sets the stat groups on the main strip's ladder, one row that never wraps", () => {
    const html = renderToStaticMarkup(createElement(GroupNav, { group: "attacking", href: (key: string) => `/${key}` }));
    expect(html).not.toContain("flex-wrap");
    const plates = html.match(/<a [^>]*class="[^"]*"/g) ?? [];
    expect(plates).toHaveLength(5);
    for (const plate of plates) expect(plate).toMatch(/\bwhitespace-nowrap\b.*\bmax-\[374px\]:text-3xs\b/);
  });
});
