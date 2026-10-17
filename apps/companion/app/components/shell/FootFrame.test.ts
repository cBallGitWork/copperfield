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
});
