import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StrengthRanks from "./StrengthRanks";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const html = renderToStaticMarkup(
  createElement(StrengthRanks, {
    // As `strengthTable` gives it: weakest first, 1 the easiest to face.
    table: [
      { code: 1, club: "AAA", home: 1, away: 1 },
      { code: 3, club: "BBB", home: 2, away: 2 },
      { code: 2, club: "MCI", home: 3, away: 2 },
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

  // Craig, 24 Oct 2026: "its worded backwards, should just be best defence is number 1 in red".
  it("runs best first, 1 the strongest, on the hardest ground", () => {
    expect(html.indexOf("MCI")).toBeLessThan(html.indexOf("BBB"));
    expect(html.indexOf("BBB")).toBeLessThan(html.indexOf("AAA"));
    const weakest = html.slice(html.indexOf("AAA"));
    expect(weakest.match(/>3rd</g)).toHaveLength(1);
    expect(weakest).toContain("var(--color-ease-1)");
    expect(weakest).not.toContain("(H)");
  });

  it("splits the cell where home and away differ, each rank on its own ground and never blank", () => {
    const row = html.slice(html.indexOf("MCI"), html.indexOf("BBB"));
    expect(row).toContain("1st at home, 1st away");
    expect(row).toMatch(/1st<span[^>]*>\(H\)<\/span>/);
    expect(row).toMatch(/1st<span[^>]*>\(A\)<\/span>/);
  });

  // Integration review, 20 Oct 2026: side by side at the desk, '17th (H)16th (A)' filled two 40px halves edge to edge.
  it("stacks the venue under the rank at every width, the halves a hairline apart", () => {
    expect(html).not.toContain("lg:flex-row");
    expect(html).not.toContain("lg:text-2xs");
    expect(html).toContain('<span class="flex gap-px">');
  });
});
