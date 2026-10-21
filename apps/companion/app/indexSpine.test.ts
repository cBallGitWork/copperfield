import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { INDEX_BLOCK, INDEX_SPINE } from "./desk";
import { IndexCell, PointsCell } from "./components/league/TableCells";
import PositionTile from "./components/league/PositionTile";
import DateChip from "./components/shell/DateChip";

// CM's index column is one spine, no gap, every list (Craig, 21 Oct 2026): each block takes its row's full height.

vi.mock("@/app/desk", () => import("./desk"));

const APP = import.meta.dirname;

/** A block or cell's classes, as rendered. */
function classesOf(element: ReactElement, tag: string): string[] {
  const wrapped = tag === "td" ? createElement("table", null, createElement("tbody", null, createElement("tr", null, element))) : element;
  const html = renderToStaticMarkup(wrapped);
  return (html.match(new RegExp(`<${tag} class="([^"]*)"`))?.[1] ?? "").split(/\s+/);
}

/** A class that would hold a block short of its row or inset it: a fixed height, or a margin above or below. */
const GAP = /^(lg:)?(-?(my|mt|mb)-|h-\d|max-h-)/;

describe("the index spine", () => {
  const blocks: [string, string[]][] = [
    ["a squad row's position tile", classesOf(PositionTile({ positions: ["D"] }), "span")],
    ["a board's position cell", classesOf(PositionTile({ positions: ["D"], cell: true }), "td")],
    ["the index cell", classesOf(IndexCell({ children: "1st" }), "td")],
    ["the points cell", classesOf(PointsCell({ children: 41 }), "td")],
    ["Mail's date chip", classesOf(DateChip({ day: "Mon 19 Oct" }), "span")],
  ];

  it.each(blocks)("%s wears the spine and nothing that gaps it", (_, classes) => {
    expect(classes).toEqual(expect.arrayContaining(["cm-index", "cm-spine"]));
    expect(classes.filter((name) => GAP.test(name))).toEqual([]);
  });

  it("is one recipe: the block is the spine centred", () => {
    expect(INDEX_SPINE).toBe("cm-index cm-spine");
    expect(INDEX_BLOCK.startsWith(INDEX_SPINE)).toBe(true);
  });

  it("stretches the block and gives back a desk row's padding", () => {
    const css = readFileSync(join(APP, "desk.css"), "utf8");
    expect(css).toMatch(/\.cm-spine \{\s*align-self: stretch;/);
    expect(css).toMatch(/\.cm-row \.cm-spine \{\s*margin-block: -0\.125rem;/);
    // The row's own desk padding, which the margin above gives back.
    expect(css).toMatch(/\.cm-row \{\s*min-height: 1\.75rem;\s*padding-block: 0\.125rem;/);
  });

  // A plate on a pitch card or a stat bar is not a list's column; anything else that paints the block takes the recipe.
  const PLATES = ["prem/club/[code]/depth/DepthPitch.tsx", "prem/match/[id]/MatchStats.tsx", "components/league/BenchStrip.tsx"];

  it("is drawn through the recipe everywhere but the plates", () => {
    const literal = readdirSync(APP, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".tsx") && !file.startsWith(".next"))
      .map((file) => file.split(sep).join("/"))
      .filter((file) => /["`]cm-index /.test(readFileSync(join(APP, file), "utf8")));
    expect(literal.sort()).toEqual([...PLATES].sort());
  });
});
