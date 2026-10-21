import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClubsBoards } from "./TeamBoard";
import { sortedTeams, teamsView } from "./columns";
import type { TeamRow } from "./teamRows";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));

const rows: TeamRow[] = ["ARS", "BHA"].map((shortName, at) => ({
  club: { id: at + 1, code: at + 1, name: shortName, shortName },
  season: null,
  squad: null,
}));

function render(group?: string): string {
  const view = teamsView({ group });
  return renderToStaticMarkup(createElement(ClubsBoards, { view, rows: sortedTeams(rows, view.sort, view.descending) }));
}

describe("Clubs under a thumb", () => {
  // Integration review: Adv Stats docks its plates in the foot, Clubs drew them at the top.
  it("docks the group plates in the foot and keeps the Key at the top", () => {
    const html = render();
    const foot = html.indexOf("sticky bottom-[var(--thumbrail)]");
    expect(foot).toBeGreaterThan(-1);
    expect(html.indexOf('aria-label="Stat groups"')).toBeGreaterThan(foot);
    expect(html.indexOf(">Key<")).toBeLessThan(html.indexOf("<table"));
  });

  // Final review: nested in the panel, the dock sat 10px in and up from Adv Stats' and the desk panel ran ~230px past row 20.
  it("docks the plates outside the panel, as Adv Stats does", () => {
    const html = render();
    const panelEnd = html.indexOf("</section>");
    expect(html.indexOf('aria-label="Data views"')).toBeGreaterThan(-1);
    expect(panelEnd).toBeGreaterThan(html.indexOf("<table"));
    expect(html.indexOf("sticky bottom-[var(--thumbrail)]")).toBeGreaterThan(panelEnd);
  });

  // Integration review: on Defence at 390 the squeezed Place cell let the pinned Club slide over GC's head.
  it("holds the Place block at the width the pinned Club's offset assumes", () => {
    const html = render("defence");
    const place = html.match(/<td class="cm-index[^"]*"/g) ?? [];
    expect(place.length).toBeGreaterThan(0);
    for (const cell of place) expect(cell).toMatch(/\bmin-w-8\b.*\blg:min-w-9\b/);
  });
});
