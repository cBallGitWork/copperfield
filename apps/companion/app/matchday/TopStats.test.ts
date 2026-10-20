import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import TopStats from "./TopStats";
import { LISTS } from "./lists";
import type { TopBoard } from "./leaders";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));

const boards: TopBoard[] = LISTS.slice(0, 2).map((list) => ({ key: list.key, tab: list.title, list, rows: [] }));
const exit = createElement("a", { href: "/out" }, "Matchups");
const html = renderToStaticMarkup(createElement(TopStats, { boards, stat: undefined, teamNames: new Map(), reader: null, exit }));

describe("Live's Top stats", () => {
  // Final review, 21 Oct 2026: at 390x844 a ten-row board left the picker at y=686, 102px above the rail.
  it("fills what the page leaves under the bar, not a viewport of its own, and the desk's free of the foot's gap", () => {
    const frame = html.match(/^<div class="([^"]*)"/)?.[1] ?? "";
    expect(frame.split(" ")).toEqual(expect.arrayContaining(["min-h-0!", "flex-1", "lg:gap-0"]));
  });

  it("keeps the exit above the dock, so the picker is the last block", () => {
    const grid = html.indexOf('class="grid ');
    const out = html.indexOf('href="/out"');
    expect(out).toBeGreaterThan(grid);
    expect(out).toBeLessThan(html.indexOf('class="sticky '));
    expect(html).toContain('<div class="lg:mt-4"><a href="/out">');
  });

  it("docks the leaders picker in the sticky foot, after the boards", () => {
    const grid = html.indexOf('class="grid ');
    const foot = html.indexOf('class="sticky ');
    const nav = html.indexOf('aria-label="Which leaders"');
    expect(grid).toBeGreaterThan(-1);
    expect(foot).toBeGreaterThan(grid);
    expect(nav).toBeGreaterThan(foot);
  });
});
