import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FootFrame } from "./FootFrame";

const props = { foot: createElement("nav", null, "views"), children: "body" };
const html = renderToStaticMarkup(createElement(FootFrame, props));

describe("a screen's foot row", () => {
  // Review M7: a match's Stats foot sat at y=1,216 of 1,332, under the thumb rail.
  it("docks above the thumb rail on a phone, and at the screen's foot on the desk", () => {
    expect(html).toMatch(/<div class="[^"]*\bsticky bottom-\[var\(--thumbrail\)\][^"]*\blg:bottom-0\b[^"]*"><nav>views/);
  });

  // Integration review, 20 Oct 2026: the dock painted over a wide board's sideways gauge at 320.
  it("tells a wide board's gauge how tall the dock is, and says nothing without one", () => {
    expect(html).toMatch(/^<div class="[^"]*\[--foot-dock:2\.75rem\]/);
    const bare = renderToStaticMarkup(createElement(FootFrame, null, "body"));
    expect(bare).not.toContain("--foot-dock");
  });

  it("lifts the gauge above the dock in the stylesheet", () => {
    const css = readFileSync(new URL("../../desk.css", import.meta.url), "utf8");
    const rule = css.slice(css.indexOf(".cm-board[data-wide] .cm-board-gauge {"));
    expect(rule.slice(0, rule.indexOf("}"))).toContain("bottom: calc(var(--thumbrail) + var(--foot-dock, 0px));");
  });
});
