import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

import NotFound from "./not-found";

// M-SHELL-7: the 404 explained the four kinds of thing an address can name; the title says it.
describe("the 404", () => {
  it("is its title and one way out, with no line explaining it", () => {
    const html = renderToStaticMarkup(createElement(NotFound));
    expect(html).toContain("Nothing at that address");
    expect(html).not.toMatch(/<p[ >]/);
    expect(html.match(/<a /g)).toHaveLength(1);
  });
});
