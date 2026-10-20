import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ListAndPitch from "./ListAndPitch";
import ViewToggle from "./ViewToggle";

// The test run has no `@/` alias; the plate's classes are not under test.
vi.mock("@/app/desk", () => ({ TAB: "cm-tab", PANEL: "cm-panel flex flex-col gap-2 p-2" }));

describe("Pitch/List", () => {
  // 16 Oct 2026: the view you were on was announced as the "current page".
  it("says which view is on with aria-pressed, never as a page", () => {
    const html = renderToStaticMarkup(createElement(ViewToggle, { view: "pitch", onPick: () => undefined }));
    expect(html).not.toContain("aria-current");
    expect(html.match(/aria-pressed="(true|false)"/g)).toEqual(['aria-pressed="true"', 'aria-pressed="false"']);
  });
});

describe("Pitch/List docked at the foot", () => {
  const draw = (props: object) =>
    renderToStaticMarkup(createElement(ListAndPitch, { opens: "pitch", list: "LIST", pitch: "PITCH", ...props }));

  it("sits above the lists by default, as every screen has it now", () => {
    const html = draw({});
    expect(html.indexOf("aria-pressed")).toBeLessThan(html.indexOf("PITCH"));
    expect(html).not.toContain("sticky");
  });

  // M-CONSIST-1: a screen's sub-views switch from its foot, above the thumb rail; the desk shows both and no toggle.
  it("docks below them above the thumb rail when a caller opts in, hidden on the desk", () => {
    const html = draw({ foot: true });
    expect(html.indexOf("aria-pressed")).toBeGreaterThan(html.indexOf("PITCH"));
    expect(html).toMatch(/<div class="[^"]*\bsticky bottom-\[var\(--thumbrail\)\][^"]*\blg:hidden\b[^"]*"><div role="group"/);
  });

  it("keeps a squad's week at the top, alone, when the toggle goes to the foot", () => {
    const html = draw({ foot: true, beside: createElement("i", null, "WEEK") });
    expect(html.indexOf("WEEK")).toBeLessThan(html.indexOf("PITCH"));
    expect(html.indexOf("aria-pressed")).toBeGreaterThan(html.indexOf("LIST"));
    expect(html).toContain('class="cm-panel');
  });
});
