import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SquadPlayerDetail } from "@epl/core";
import SquadRows from "./SquadRows";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: () => null }));

/** A list row's width at 390 on the Team tab, off Craig's 11 Oct shot: "M. Sangaré" (73.7px) fit the name column and
 *  "Matheus N." (75.7px) did not, beside 270px of fixed columns. */
const ROW_AT_390 = 345;

/** The widest name in that squad with its box: "J. Hinshelwood" is 102.3px of Oxanium bold at 14px, DBT 23.2, a 6px gap. */
const WIDEST_NAME = 131.5;

const man: SquadPlayerDetail = {
  rostered: { slot: { fantraxId: "a", position: "M", status: "" }, unresolved: "unmapped" },
  club: undefined,
  opposition: undefined,
  points: 13,
  minutes: [{ gameweek: 7, minutes: 18, asOf: "Thu 15 Oct" }] as SquadPlayerDetail["minutes"],
};

const html = renderToStaticMarkup(
  createElement(SquadRows, { lines: [{ position: "M", players: [man] }], projected: false }),
);

/** Tailwind's phone width in px for a class list, `lg:` ignored: `w-11` is 44, `w-[1.875rem]` 30. */
function phoneWidth(classes: string): number {
  const fixed = classes.split(" ").find((name) => /^w-(\d+(\.\d+)?|\[[\d.]+rem\])$/.test(name));
  if (fixed === undefined) return 0;
  const rem = fixed.match(/^w-\[([\d.]+)rem\]$/);
  return rem ? Number(rem[1]) * 16 : Number(fixed.slice(2)) * 4;
}

const gapOf = (classes: string) => Number(classes.match(/(?:^| )gap-(\d+(?:\.\d+)?)(?: |$)/)?.[1] ?? 0) * 4;

describe("the squad list at 390", () => {
  const head = html.match(/<div class="(flex items-center[^"]*)">([\s\S]*?)<\/div>/);
  const cells = [...(head?.[2] ?? "").matchAll(/<span class="([^"]*shrink-0[^"]*)"/g)].map((match) => match[1]);

  it("leaves the name column room for the widest name in Craig's squad", () => {
    // Pos, crest, opponent, xMins and FPts, the gaps between all six columns, and the row's 6px either side.
    const fixed = cells.reduce((sum, classes) => sum + phoneWidth(classes), 0);
    const room = ROW_AT_390 - fixed - 5 * gapOf(head?.[1] ?? "") - 12;
    expect(cells).toHaveLength(5);
    expect(room).toBeGreaterThanOrEqual(WIDEST_NAME);
  });

  it("dates the xMins column once, under the list (review M23)", () => {
    expect(html.match(/Thu 15 Oct/g)).toHaveLength(1);
    const bench = renderToStaticMarkup(
      createElement(SquadRows, { lines: [{ position: "M", players: [man] }], projected: false, head: false }),
    );
    expect(bench).not.toContain("Thu 15 Oct");
  });

  it("heads the opponent Opp under a thumb and Opponent on the desk", () => {
    expect(head?.[2]).toContain('<span class="lg:hidden">Opp</span>');
    expect(head?.[2]).toContain('<span class="hidden lg:inline">Opponent</span>');
  });

  it("draws each row's fixed columns as wide as their heads", () => {
    const row = html.slice(html.indexOf('class="cm-row flex'));
    const widthClass = (classes: string) => classes.split(" ").find((name) => name.startsWith("w-"));
    expect(gapOf(row.match(/^class="([^"]*)"/)?.[1] ?? "")).toBe(gapOf(head?.[1] ?? ""));
    for (const classes of cells) expect(row).toContain(` ${widthClass(classes)} `);
  });
});

describe("a man FPL expects back on a date", () => {
  const out = {
    ...man,
    rostered: {
      slot: { fantraxId: "b", position: "D", status: "" },
      player: { code: 1, name: "Mykolenko", fullName: "Vitalii Mykolenko", status: "i", chanceOfPlaying: 0, news: "Leg injury - Expected back 28 Nov" },
      stats: [],
    },
  } as unknown as SquadPlayerDetail;
  const row = renderToStaticMarkup(createElement(SquadRows, { lines: [{ position: "D", players: [out] }], projected: false }));

  // A phone never shows a title, and the date was in one alone (review M30, UX-5).
  it("prints the date under his name, not in a title", () => {
    expect(row).toMatch(/>Back 28 Nov</);
  });
});
