import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/players",
  useSearchParams: () => new URLSearchParams("q=Saka&pos=D&sort=sh&group=attacking"),
}));

import ScoutShell from "./Shell";

// M-CONSIST-5: a 'DATA' bar sat over the strip, repeating the lit Data tab beside it and naming no subject.
describe("Data's frame", () => {
  it("opens on its views' strip with no bar, keeping its heading for a screen reader", () => {
    const html = renderToStaticMarkup(ScoutShell({ children: null }));
    expect(html).not.toContain("cm-title");
    expect(html.startsWith('<div class="flex flex-col gap-2"><h1 class="sr-only">Data</h1><nav')).toBe(true);
  });

  // P-13: the strip threw the search away; the boards over one pool share it, the rest stay bare.
  it("hands Adv Stats the search and positions from Players, and Clubs nothing", () => {
    const html = renderToStaticMarkup(ScoutShell({ current: "pool", children: null }));
    expect(html).toContain('href="/players/stats?q=Saka&amp;pos=D"');
    expect(html).toContain('href="/players/teams"');
    expect(html).toContain('href="/players"');
  });
});
