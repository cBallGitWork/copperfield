import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/players" }));

import ScoutShell from "./Shell";

// M-CONSIST-5: a 'DATA' bar sat over the strip, repeating the lit Data tab beside it and naming no subject.
describe("Data's frame", () => {
  it("opens on its views' strip with no bar, keeping its heading for a screen reader", () => {
    const html = renderToStaticMarkup(ScoutShell({ children: null }));
    expect(html).not.toContain("cm-title");
    expect(html.startsWith('<div class="flex flex-col gap-2"><h1 class="sr-only">Data</h1><nav')).toBe(true);
  });
});
