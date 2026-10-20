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
  it("draws the same markup it drew before the dock was shared", () => {
    expect(html).toBe(
      '<div class="flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-var(--page-top)-var(--page-foot))] flex-col gap-2 ">body<div class="sticky bottom-[var(--thumbrail)] z-20 mt-auto bg-bg lg:bottom-0"><nav>views</nav></div></div>',
    );
    expect(bare).toBe(
      '<div class="flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-var(--page-top)-var(--page-foot))] flex-col gap-2 ">body</div>',
    );
  });
});
