import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", () => ({ TAB: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("../../../teamNames", () => ({ shortName: (_id: string, full: string) => full.split(" ")[0] }));

import { SideFoot, TieSides, sideOf, sideTabs } from "./sides";

const yours = createElement("p", null, "your eleven");
const theirs = createElement("p", null, "their squad");
const tie = (open: "team" | "opponent") =>
  renderToStaticMarkup(createElement(TieSides, { open, team: yours, opponent: theirs }));

// M-SQUADS-3 (Craig, 20 Oct 2026): the Match tab draws both line-ups, one side at a time on a phone.
describe("a tie's two sides", () => {
  it("shows the open side alone under a thumb, and both side by side on the desk", () => {
    const html = tie("team");
    expect(html).toContain('<div class="lg:hidden"><p>your eleven</p></div>');
    expect(html).toContain('<div class="hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-2"><div><p>your eleven</p></div><div><p>their squad</p></div></div>');
  });

  it("puts the opponent under a thumb once his plate is picked", () => {
    expect(tie("opponent")).toContain('<div class="lg:hidden"><p>their squad</p></div>');
  });
});

describe("the side the URL names", () => {
  it("opens on the team whose screen it is unless the opponent is asked for", () => {
    expect(sideOf(undefined)).toBe("team");
    expect(sideOf("anything")).toBe("team");
    expect(sideOf("opponent")).toBe("opponent");
  });
});

describe("the foot's two plates", () => {
  it("names both sides and keeps the team's own side on the bare URL", () => {
    expect(sideTabs("me", { teamId: "a", name: "Dome United" }, [{ teamId: "b", name: "Atletico Fc" }])).toEqual([
      { key: "team", label: "Dome", href: "/squad/me/next" },
      { key: "opponent", label: "Atletico", href: "/squad/me/next?side=opponent" },
    ]);
  });

  it("calls a double header's two rivals one plate", () => {
    const tabs = sideTabs("x", { teamId: "a", name: "Dome" }, [{ teamId: "b", name: "B" }, { teamId: "c", name: "C" }]);
    expect(tabs[1].label).toBe("Opponents");
  });

  it("is a phone's control only: the desk shows both sides", () => {
    const html = renderToStaticMarkup(
      createElement(SideFoot, { open: "team", tabs: sideTabs("me", { teamId: "a", name: "Dome" }, [{ teamId: "b", name: "B" }]) }),
    );
    expect(html.startsWith('<div class="lg:hidden"><nav aria-label="Sides" class="flex">')).toBe(true);
    expect(html).toContain('aria-current="page"');
  });
});
