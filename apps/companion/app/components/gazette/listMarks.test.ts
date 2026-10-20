import { describe, expect, it } from "vitest";
import { listMarks } from "./listMarks";

const PHONE = "@media (width < 64rem){";

/** The selector of each rule inside the phone's media block, without its declarations. */
const selectors = (css: string) =>
  css.slice(PHONE.length, -1).split("}").filter((rule) => rule !== "").map((rule) => rule.slice(0, rule.indexOf("{")));

describe("listMarks", () => {
  it("marks the lead's row by its own anchor when no match is chosen, since the list opens on its heading", () => {
    // `a:first-child` matched nothing: the list's first child is its `<h3>`, so the lead's row never lit.
    expect(selectors(listMarks("rpt", ["m-1", "m-2"]))[0]).toBe('.rpt:not(:has(section:target)) .rpt-list a[href="#m-1"]');
  });

  it("marks a chosen match's row by its anchor", () => {
    expect(selectors(listMarks("dft", ["d-1", "d-2"])).slice(1)).toEqual([
      '.dft:has(#d-1:target) .dft-list a[href="#d-1"]',
      '.dft:has(#d-2:target) .dft-list a[href="#d-2"]',
    ]);
  });

  // 20 Oct 2026: a desk shows every match, so a reversed row there marked a choice nobody made.
  it("marks rows only below lg, where the sections hide and the list picks one", () => {
    const css = listMarks("rpt", ["m-1"]);
    expect(css.startsWith(PHONE)).toBe(true);
    expect(css.endsWith("}}")).toBe(true);
  });

  it("writes nothing for a report with no matches", () => {
    expect(listMarks("dft", [])).toBe("");
  });
});
