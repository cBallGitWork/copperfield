import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Carried, Plates } from "./BoardControls";

// The app's `@/` alias is Next's, not vitest's; a board link needs a router, so it draws as its anchor.
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("./BoardLink", () => ({
  default: (props: { className: string; "aria-current"?: string; children: React.ReactNode }) =>
    createElement("a", { className: props.className, "aria-current": props["aria-current"] }, props.children),
}));

const hidden = (except: Parameters<typeof Carried>[0]["except"]) =>
  renderToStaticMarkup(createElement(Carried, { query: { rows: "60", sort: "g", all: "1" }, except }));

describe("Carried", () => {
  // M-SQUADS-1: a search or a club picked with no script must not keep a step past its new list's end.
  it("drops a page's rows wherever it drops Show all", () => {
    expect(hidden(["q", "all"])).not.toContain('name="rows"');
    expect(hidden(["sort", "dir"])).toContain('name="rows" value="60"');
  });
});

describe("Plates", () => {
  const html = renderToStaticMarkup(
    createElement(Plates, {
      query: {},
      plates: [
        { key: "attacking", label: "Attack" },
        { key: "creating", label: "Creating" },
        { key: "defensive", label: "Defence" },
        { key: "attributes", label: "Attributes" },
      ],
      group: "attacking",
      route: "/players/stats",
      replace: false,
    }),
  );

  // M-CONSIST-1, 20 Oct 2026: at 320 the plates wrapped onto two rows, 94px of a 568px screen.
  it("draws one strip on the main strip's ladder, never wrapping", () => {
    expect(html).toMatch(/^<nav aria-label="Stat groups" class="flex">/);
    expect(html).not.toContain("flex-wrap");
    expect(html).not.toContain("cm-tab-quiet");
    const plates = html.match(/<a [^>]*class="[^"]*"/g) ?? [];
    expect(plates).toHaveLength(4);
    for (const plate of plates) expect(plate).toMatch(/\bcm-tab\b.*\bwhitespace-nowrap\b.*\bmax-\[374px\]:text-3xs\b/);
  });
});
