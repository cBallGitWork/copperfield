import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FootFrame } from "./FootFrame";

const body = { children: "body" };
const props = { ...body, foot: createElement("nav", null, "views") };
const html = renderToStaticMarkup(createElement(FootFrame, props));
const bare = renderToStaticMarkup(createElement(FootFrame, body));

describe("a screen's foot row", () => {
  // Review M7: a match's Stats foot sat at y=1,216 of 1,332, under the thumb rail.
  it("docks above the thumb rail on a phone, and at the screen's foot on the desk", () => {
    expect(html).toMatch(/<div class="[^"]*\bsticky bottom-\[var\(--thumbrail\)\][^"]*\blg:bottom-0\b[^"]*"><nav>views/);
  });

  // Match Stats and the head-to-head's Stats draw this frame; a shared foot dock must not move them (20 Oct 2026).
  // The dock's height var is the one addition with a foot: it lifts a wide board's gauge, and moves nothing else.
  it("draws the same markup it drew before the dock was shared, plus the dock's height", () => {
    expect(html).toBe(
      '<div class="[--foot-dock:2.75rem] flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-var(--page-top)-var(--page-foot))] flex-col gap-2 ">body<div class="sticky bottom-[var(--thumbrail)] z-20 mt-auto bg-bg lg:bottom-0"><nav>views</nav></div></div>',
    );
    expect(bare).toBe(
      '<div class="flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-var(--page-top)-var(--page-foot))] flex-col gap-2 ">body</div>',
    );
  });

  // Integration review, 20 Oct 2026: the dock painted over a wide board's sideways gauge at 320.
  it("tells a wide board's gauge how tall the dock is, and says nothing without one", () => {
    expect(html).toMatch(/^<div class="[^"]*\[--foot-dock:2\.75rem\]/);
    expect(bare).not.toContain("--foot-dock");
  });

  it("lifts the gauge above the dock in the stylesheet", () => {
    const css = readFileSync(new URL("../../desk.css", import.meta.url), "utf8");
    const rule = css.slice(css.indexOf(".cm-board[data-wide] .cm-board-gauge {"));
    expect(rule.slice(0, rule.indexOf("}"))).toContain("bottom: calc(var(--thumbrail) + var(--foot-dock, 0px));");
  });
});
