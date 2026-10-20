import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer } from "@epl/core";
import PlayerBoard, { type Row, unplayedLast } from "./PlayerBoard";

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
    const html = renderToStaticMarkup(createElement(PlayerBoard, { rows: [row(1, "Becker", 900), row(2, "Woodman", 0)] }));
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
