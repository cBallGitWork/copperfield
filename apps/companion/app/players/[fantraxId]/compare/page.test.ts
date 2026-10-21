import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CompareRoute } from "../../analysis/compareRoute";

// His Compare wears his shell with Compare lit, and hands the shared body his id as a fixed A.

const read = vi.hoisted(() => ({ subject: vi.fn() }));
vi.mock("../subject", () => ({ subject: read.subject }));
vi.mock("../title", () => ({ playerTitle: () => () => ({}) }));
vi.mock("../NoProfile", () => ({ default: ({ code }: { code: string }) => createElement("p", { "data-refused": code }) }));
vi.mock("../PlayerShell", () => ({
  default: ({ current, fantraxId, children }: { current: string; fantraxId: string; children: ReactNode }) =>
    createElement("section", { "data-shell": fantraxId, "data-current": current }, children),
}));
vi.mock("../../analysis/CompareBody", () => ({
  default: ({ route, asked, shell }: { route: CompareRoute; asked: Record<string, string>; shell: (body: ReactNode) => ReactNode }) =>
    shell(createElement("div", { "data-fixed": route.fixed, "data-base": route.base, "data-bs": asked.bs })),
}));

import PlayerCompare from "./page";

const draw = async (asked: Record<string, string>) =>
  renderToStaticMarkup(await PlayerCompare({ params: Promise.resolve({ fantraxId: "061vq" }), searchParams: Promise.resolve(asked) }));

describe("a player's own Compare", () => {
  it("draws the shared body inside his shell, Compare lit and him fixed as A", async () => {
    read.subject.mockResolvedValue({ intel: { name: "Erling Haaland" }, football: null, ownerName: null });
    expect(await draw({ bs: "2023-24" })).toBe(
      '<section data-shell="061vq" data-current="compare"><div data-fixed="061vq" data-base="/players/061vq/compare" data-bs="2023-24"></div></section>',
    );
  });

  it("keeps a refused profile's tell, as his other tabs do", async () => {
    read.subject.mockResolvedValue({ unavailable: "getPlayerProfile → WARNING" });
    expect(await draw({})).toBe('<p data-refused="getPlayerProfile → WARNING"></p>');
  });
});
