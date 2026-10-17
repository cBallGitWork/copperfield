import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Vidiprinter from "./Vidiprinter";
import type { WireLine } from "./wireLines";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../components/shell/Absent"));

const man = (name: string, teamName: string) =>
  ({ player: { name }, owner: { teamName }, mine: false }) as unknown as WireLine["man"];

const goal: WireLine = {
  key: "1", fixtureCode: 1, minute: "65", kind: "goal", club: null, at: null,
  man: man("Haaland", "Raccoons"), second: man("Doku", "Glengarry"),
};

describe("the vidiprinter", () => {
  // Review M4: at 390 the owner brackets cut to "(Racco…" on 11 lines.
  it("wraps a man's owner onto the next line rather than cutting the bracket", () => {
    const html = renderToStaticMarkup(createElement(Vidiprinter, { lines: [goal] }));
    const brackets = [...html.matchAll(/<span class="([^"]*)">\((Raccoons|Glengarry)\)<\/span>/g)];
    expect(brackets).toHaveLength(2);
    for (const [, classes] of brackets) expect(classes).not.toContain("truncate");
    expect(html.match(/flex-wrap/g)).toHaveLength(2);
  });
});
