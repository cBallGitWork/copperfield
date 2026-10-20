import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "example.test" }) }));
vi.mock("../round", () => ({ leagueInfo: async () => ({ teams: [{ teamId: "t1", name: "The Raccoons" }] }) }));
vi.mock("../squads", () => ({ readerTeamId: async () => "t1" }));
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/more", useRouter: () => ({}) }));

import MorePage from "./page";

const html = async () => renderToStaticMarkup(await MorePage());

// M-SHELL-4: More printed its name twice, on Read's lit plate and on a bar under it, in five boxes of four kinds.
describe("More", () => {
  it("draws no title bar under Read's strip, keeping its heading for a screen reader", async () => {
    const page = await html();
    expect(page).not.toContain("cm-title");
    expect(page).toMatch(/<h1 class="sr-only">More<\/h1>/);
  });

  it("lists the credits with FPL, Squads and Scoring in one menu, with no About panel", async () => {
    const page = await html();
    const start = page.indexOf('<nav aria-label="More"');
    const menu = page.slice(start, page.indexOf("</nav>", start));
    for (const row of ["FPL", "Squads", "Scoring", "Credits"]) expect(menu).toContain(row);
    expect(page).not.toContain("About");
    expect(page.match(/<nav/g)).toHaveLength(2);
  });

  it("holds both exits in one panel, the address on its own line under the calendar button", async () => {
    const page = await html();
    const exits = page.slice(page.lastIndexOf("</nav>"), page.indexOf("<section"));
    expect(exits).toContain("Add the lock times to your calendar");
    expect(exits).toContain("Or subscribe by address");
    expect(exits.match(/cm-panel/g)).toHaveLength(1);
  });
});
