import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PastSeason, Ranked } from "@epl/core";
import PastSeasons from "./PastSeasons";
import Rankings from "./Rankings";
import SetPieces from "./SetPieces";
import Board from "../../components/league/Board";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/components/shell/Absent", () => import("../../components/shell/Absent"));

const season = (label: string): PastSeason => ({
  season: label, minutes: 2700, goals: 20, assists: 5, cleanSheets: 9, goalsConceded: 30,
  yellowCards: 2, redCards: 0, saves: 0, fplPoints: 200,
});
const clubs = new Map([["25-26", "Manchester City"], ["24-25", "Watford"]]);
const league = [{ name: "Man City", shortName: "MCI" }];
const ranked: Ranked[] = [{ head: "Min", title: "Minutes played", value: 540, kind: "count", rank: 1, of: 23 }];
const seasons = () => renderToStaticMarkup(createElement(PastSeasons, { seasons: [season("2025/26"), season("2024/25"), season("2023/24")], clubs, league }));

/** The table's own classes. */
const table = (html: string) => html.match(/<table class="([^"]*)"/)?.[1] ?? "";

describe("the player's short tables", () => {
  // N-6: the match log says G and A, so the Seasons table under the same picker does too.
  it("heads Seasons as the match log heads the same counts", () => {
    const heads = [...seasons().matchAll(/<th[^>]*title="[^"]*"[^>]*>[\s\S]*?<\/th>/g)].map((m) => m[0].replace(/<[^>]+>/g, ""));
    expect(heads).toEqual(["Min", "G", "A", "CS", "GA", "Sv", "Yel", "Red"]);
  });

  // N-18: the full name took 121px of 390 and scrolled the table sideways.
  it("prints a club's code under a thumb and its name on a desk; a club since gone keeps its name; none is a dash", () => {
    const html = seasons();
    expect(html).toContain('<span class="block max-w-24 truncate lg:hidden">MCI</span><span class="hidden lg:inline">Manchester City</span>');
    expect(html).toContain('<span class="block max-w-24 truncate lg:hidden">Watford</span>');
    expect(html.match(/<tbody>[\s\S]*<\/tbody>/)?.[0]).toContain("—");
  });

  // N-16: a short table stretched to 1100px on a desk.
  it("sizes Seasons and Rankings to their figures on a desk, and leaves every other board full width", () => {
    const rankings = renderToStaticMarkup(createElement(Rankings, { ranked, fpts: null, group: "forwards" }));
    for (const html of [seasons(), rankings]) expect(table(html)).toMatch(/\bw-full\b.*\blg:w-auto\b/);
    const board = createElement(Board<string>, { rows: ["a"], keyOf: (row) => row, lead: {}, columns: [{ key: "x", head: "X", cell: () => ({ value: 1 }) }] });
    expect(table(renderToStaticMarkup(board))).not.toContain("lg:w-auto");
  });

  // LAYOUT-7: three ranks were a one-row table under 28px of heads; they are one line of label and figure.
  it("prints the set pieces as one line, not a table", () => {
    const pieces = [
      { piece: "pens", label: "Penalties", rank: 1, of: 3 },
      { piece: "fks", label: "Free kicks", rank: null, of: 2 },
    ] as const;
    const html = renderToStaticMarkup(createElement(SetPieces, { pieces, club: "Man City" }));
    expect(html).not.toContain("<table");
    expect(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).toContain("Penalties 1st Free kicks —");
    expect(html).toContain('title="Not among the 2 takers"');
  });

  it("tightens the Rankings figures under a thumb", () => {
    const html = renderToStaticMarkup(createElement(Rankings, { ranked, fpts: null, group: "forwards" }));
    expect(html).toMatch(/<td[^>]*class="[^"]*px-1 text-center lg:px-1\.5/);
  });
});
