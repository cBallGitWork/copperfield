import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SubNote from "./SubNote";

describe("a sub note", () => {
  // Review: the scoresheet said 90+2' for a man carried off while Line Ups said 90'.
  it("prints an added-time exit as the scoresheet does", () => {
    const html = renderToStaticMarkup(createElement(SubNote, { onAt: null, offAt: 90, added: { offAt: 2 }, hurt: true }));
    expect(html).toContain("sub off 90+2&#x27; inj");
  });

  it("prints a minute inside the ninety bare", () => {
    const html = renderToStaticMarkup(createElement(SubNote, { onAt: 64, offAt: null }));
    expect(html).toContain("sub on 64&#x27;");
  });
});
