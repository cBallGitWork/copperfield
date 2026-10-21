import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer } from "@epl/core";
import PlayerBoard, { type Row, unplayedLast } from "./PlayerBoard";
import { VIEWS, viewOf } from "./measures";

vi.mock("@/app/desk", () => import("../../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));

/** A man with every season figure nought but his minutes. */
function row(id: number, name: string, minutes: number, goalsConceded = 0): Row {
  const season = new Proxy({ minutes, goalsConceded } as Record<string, number>, { get: (t, k: string) => t[k] ?? 0 });
  const player = { id, code: id, name, fullName: name, season, status: "a", news: "" } as unknown as FootballPlayer;
  return { player, positions: [], href: null };
}

describe("a man who has not played", () => {
  // Review: Woodman, with no minutes, printed G 0, A 0, xG 0.00, xA 0.00.
  it("prints a dash where a man who played prints his noughts", () => {
    const html = renderToStaticMarkup(createElement(PlayerBoard, { rows: [row(1, "Becker", 900), row(2, "Woodman", 0)], view: "attack" }));
    const [becker, woodman] = html.split("<tr").filter((part) => /Becker|Woodman/.test(part));
    expect(becker).toContain(">0.00<");
    expect(woodman).not.toMatch(/>0(\.00)?</);
    expect(woodman.match(/>—</g)?.length).toBe((becker.match(/>—</g)?.length ?? 0) + 4);
  });

  it("sorts last whichever way the column is turned", () => {
    const rows = [row(1, "Unplayed", 0), row(2, "Leaky", 900, 20), row(3, "Tight", 900, 5)];
    for (const descending of [true, false]) {
      const names = [...rows].sort(unplayedLast("goalsConceded", descending)).map((r) => r.player.name);
      expect(names.at(-1)).toBe("Unplayed");
    }
  });
});

describe("the board's view", () => {
  const board = (view: string) => renderToStaticMarkup(createElement(PlayerBoard, { rows: [row(1, "Becker", 900)], view }));

  // Review M-LIVE-8: a grey select took two taps through the OS picker; the view is the page's, from the foot strip.
  it("draws the view it is handed, with no select of its own", () => {
    const html = board("defence");
    expect(html).not.toContain("<select");
    expect(html).toContain(">CS<");
    expect(html).not.toContain(">xG<");
  });

  // Review M-CONSIST-3: 36px rows like the Draft tab's; the panel flush, so the tile meets its edge as the Squad tab's (D-9).
  it("runs 36px rows in a flush panel", () => {
    const html = board("attack");
    expect(html).toContain("min-h-9");
    expect(html).not.toContain("min-h-11");
    expect(html).toContain('<section class="cm-panel flex flex-col">');
  });
});

describe("viewOf", () => {
  it("reads a view from the query and falls back to the first", () => {
    expect(viewOf("time").key).toBe("time");
    expect(viewOf(undefined).key).toBe(VIEWS[0]?.key);
    expect(viewOf("nonsense").key).toBe(VIEWS[0]?.key);
  });
});
