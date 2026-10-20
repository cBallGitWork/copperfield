import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StrengthRanks from "./StrengthRanks";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const html = renderToStaticMarkup(
  createElement(StrengthRanks, {
    table: [
      { code: 1, club: "AAA", home: 1, away: 1 },
      { code: 2, club: "MCI", home: 16, away: 17 },
    ],
    clubs: new Map(),
  }),
);

describe("the planner's rankings", () => {
  // SQUADS-5, Craig 20 Oct 2026: Home and Away printed the same rank in 38 of 40 rows.
  it("draws one rank column, not Home and Away", () => {
    expect(html).toContain(">Rank<");
    expect(html).not.toContain(">Home<");
    expect(html).not.toContain(">Away<");
  });

  it("prints a club's one rank once on its ground, with no venue", () => {
    const row = html.slice(html.indexOf("AAA"), html.indexOf("MCI"));
    expect(row.match(/>1st</g)).toHaveLength(1);
    expect(row).toContain("var(--color-ease-1)");
    expect(row).not.toContain("(H)");
  });

  it("splits the cell where home and away differ, each rank on its own ground and never blank", () => {
    const row = html.slice(html.indexOf("MCI"));
    expect(row).toContain("16th at home, 17th away");
    expect(row).toMatch(/16th<span[^>]*>\(H\)<\/span>/);
    expect(row).toMatch(/17th<span[^>]*>\(A\)<\/span>/);
  });
});
