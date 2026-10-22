import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SquadPlayerDetail } from "@epl/core";
import SquadRows from "./SquadRows";
import { noted, withWeeks } from "../football/withWeeks";

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
  createElement(SquadRows, { lines: [{ position: "M", players: [man] }] }),
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
  // The fixed columns: a width and no give. The figures' group carries no width of its own.
  const cells = [...(head?.[2] ?? "").matchAll(/<span class="([^"]*shrink-0[^"]*)"/g)]
    .map((match) => match[1] ?? "")
    .filter((classes) => phoneWidth(classes) > 0);

  it("leaves the name column room for the widest name in Craig's squad", () => {
    // Pos, crest, opponent, xMins and FPts; a gap between tile, crest, name and figures, which butt; 6px either side.
    const fixed = cells.reduce((sum, classes) => sum + phoneWidth(classes), 0);
    const room = ROW_AT_390 - fixed - 3 * gapOf(head?.[1] ?? "") - 12;
    expect(cells).toHaveLength(5);
    expect(room).toBeGreaterThanOrEqual(WIDEST_NAME);
  });

  it("dates the xMins column once, under the whole list, the bench included (review M23)", () => {
    expect(html.match(/Thu 15 Oct/g)).toHaveLength(1);
    const benched = { ...man, rostered: { ...man.rostered, slot: { ...man.rostered.slot, fantraxId: "z" } } } as SquadPlayerDetail;
    const both = renderToStaticMarkup(createElement(SquadRows, { lines: [{ position: "M", players: [man] }], bench: [benched] }));
    expect(both.match(/Thu 15 Oct/g)).toHaveLength(1);
    expect(both.indexOf("Thu 15 Oct")).toBeGreaterThan(both.indexOf(">Bench<"));
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

describe("a man due back in a known week", () => {
  const out = {
    ...man,
    rostered: {
      slot: { fantraxId: "b", position: "D", status: "" },
      player: { code: 1, name: "Mykolenko", fullName: "Vitalii Mykolenko", status: "i", chanceOfPlaying: 0, news: "Leg injury - Expected back 28 Nov" },
      stats: [],
    },
  } as unknown as SquadPlayerDetail;
  const row = renderToStaticMarkup(withWeeks(createElement(SquadRows, { lines: [{ position: "D", players: [out] }] })));

  // A phone never shows a title (review M30, UX-5); the export's week beats FPL's fixed date.
  it("prints his return week beside his name, not in a title", () => {
    expect(row).toContain(`>${noted("Leg", "GW10")}</span>`);
  });
});

describe("a squad row's status and minutes (Craig, 21 Oct 2026)", () => {
  const held = (id: string, status: string, chance: number | null, minutes: number | null) =>
    ({
      ...man,
      rostered: {
        slot: { fantraxId: id, position: "M", status: "" },
        player: { code: 1, name: id, fullName: id, status, chanceOfPlaying: chance, news: status === "a" ? "" : "Knock" },
        stats: [],
      },
      minutes: [{ gameweek: 7, minutes, asOf: "Thu 15 Oct" }],
    }) as unknown as SquadPlayerDetail;
  const rows = (players: SquadPlayerDetail[], doubted?: string[]) =>
    renderToStaticMarkup(createElement(SquadRows, { lines: [{ position: "M", players }], doubted }));
  /** One man's row, from his name to the end of his row. */
  const rowOf = (html: string, id: string) => html.slice(html.indexOf(`>${id}<`)).split("</li>")[0];

  it("marks every man who is not fit in his band's colour, and drops the word box", () => {
    const html = rows([held("Slight", "d", 75, 80), held("Major", "d", 25, 80), held("Out", "i", 0, 0)]);
    expect(rowOf(html, "Slight")).toContain("fill:var(--color-doubt-slight)");
    expect(rowOf(html, "Major")).toContain("fill:var(--color-doubt-major)");
    expect(rowOf(html, "Out")).toContain("fill:var(--color-doubt-out)");
    expect(html).not.toContain(">Dbt<");
    expect(html).not.toContain(">Inj<");
  });

  it("gives a suspended man the red card", () => {
    expect(rowOf(rows([held("Banned", "s", null, 0)]), "Banned")).toMatch(/<rect /);
  });

  it("prints MNS on the planner's men only, and never over a status mark", () => {
    const html = rows([held("Named", "a", 100, 30), held("Other", "a", 100, 30), held("Hurt", "d", 75, 30)], ["Named", "Hurt"]);
    expect(rowOf(html, "Named")).toContain('<span aria-hidden="true">MNS</span><span class="sr-only">Might not start</span>');
    expect(rowOf(html, "Other")).not.toContain("MNS");
    expect(rowOf(html, "Hurt")).not.toContain("MNS");
  });

  it.each([
    [49, "text-bad"],
    [50, "text-info"],
  ])("inks %i xMins %s", (minutes, ink) => {
    expect(rowOf(rows([held("Him", "a", 100, minutes)]), "Him")).toContain(`font-bold ${ink}">${minutes}<`);
  });

  it("dashes a missing reading", () => {
    expect(rowOf(rows([held("Him", "a", 100, null)]), "Him")).toMatch(/font-bold text-info">—</);
  });
});

describe("the squad list's FPts", () => {
  // Craig, 21 Oct 2026: "put fpts in cyan too": the league's points in the reading cyan, never lit, on every row.
  it("prints his points in the reading cyan, not the standout amber", () => {
    const cell = html.match(/<span class="([^"]*)">13<\/span>/)?.[1] ?? "";
    expect(cell).toContain("text-info");
    expect(cell).not.toContain("text-mid");
  });
});
