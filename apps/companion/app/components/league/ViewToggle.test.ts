import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ViewToggle from "./ViewToggle";

// The test run has no `@/` alias; the plate's classes are not under test.
vi.mock("@/app/desk", () => ({ TAB: "cm-tab" }));

describe("Pitch/List", () => {
  // 16 Oct 2026: the view you were on was announced as the "current page".
  it("says which view is on with aria-pressed, never as a page", () => {
    const html = renderToStaticMarkup(createElement(ViewToggle, { view: "pitch", onPick: () => undefined }));
    expect(html).not.toContain("aria-current");
    expect(html.match(/aria-pressed="(true|false)"/g)).toEqual(['aria-pressed="true"', 'aria-pressed="false"']);
  });
});
