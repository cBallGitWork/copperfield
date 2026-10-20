import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { headWord } from "./TableHeads";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const markup = (label: string) => renderToStaticMarkup(createElement("span", null, headWord(label)));

describe("headWord", () => {
  it("keeps an expected figure's lower-case x out of the strip's capitals (UX review, 19 Oct 2026)", () => {
    expect(markup("xG")).toBe('<span><span class="normal-case">xG</span></span>');
    expect(markup("xMins")).toContain("normal-case");
  });

  it("leaves every other head to the capitals", () => {
    expect(markup("SoT")).toBe("<span>SoT</span>");
    // A tie switcher's tab, "v Raccoons", stays in the strip's capitals.
    expect(markup("v Raccoons")).toBe("<span>v Raccoons</span>");
  });
});
