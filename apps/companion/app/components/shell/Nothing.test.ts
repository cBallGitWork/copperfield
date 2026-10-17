import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Nothing from "./Nothing";
import StoryHead from "../gazette/StoryHead";

// M64/N20: an empty state under a title bar drew a second h1 (/players/analysis), and an article had none.
describe("one h1 per page", () => {
  it("draws an empty state under a bar as an h2, so the bar's h1 stands alone", () => {
    const html = renderToStaticMarkup(createElement(Nothing, { title: "A player, or two" }));
    expect(html).toContain("<h2");
    expect(html).not.toContain("<h1");
  });

  it("draws one with no bar above it, as the 404, as the page's h1", () => {
    expect(renderToStaticMarkup(createElement(Nothing, { title: "Nothing at that address", page: true }))).toContain("<h1");
  });

  it("sets an article's headline as its h1 and a front-page story's as an h2 under the masthead", () => {
    const head = (rank: "article" | "front") => renderToStaticMarkup(createElement(StoryHead, { headline: "Gravenberch digs his own grave", standfirst: "", rank }));
    expect(head("article")).toMatch(/^<h1/);
    expect(head("front")).toMatch(/^<h2/);
  });
});
