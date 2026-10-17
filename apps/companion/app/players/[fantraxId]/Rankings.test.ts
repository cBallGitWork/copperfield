import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Ranked } from "@epl/core";
import Rankings from "./Rankings";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const ranked: Ranked[] = [
  { head: "Min", title: "Minutes played", value: 540, kind: "count", rank: 1, of: 23 },
  { head: "Sv", title: "Saves", value: 21, kind: "count", rank: 3, of: 23 },
];
const fpts: Ranked = { head: "FPts", title: "Fantasy points", value: 37, kind: "count", rank: 2, of: 23 };

describe("Rankings", () => {
  // His league points were nowhere on the Data tab without a sideways scroll (review M28).
  it("leads with his points and their place, ruled off from the football figures", () => {
    const html = renderToStaticMarkup(createElement(Rankings, { ranked, fpts, group: "goalkeepers" }));
    const heads = [...html.matchAll(/<th[^>]*title="([^"]+)"[^>]*>/g)].map((m) => m[0]);
    expect(heads[0]).toContain('title="Fantasy points"');
    expect(heads[1]).toContain("border-l");
    expect(html).toContain(">37<");
    expect(html).toContain(">2nd<");
  });

  it("draws as before without them", () => {
    const html = renderToStaticMarkup(createElement(Rankings, { ranked, fpts: null, group: "goalkeepers" }));
    expect(html).not.toContain("FPts");
    expect(html).toContain("Among 23 goalkeepers");
  });
});
