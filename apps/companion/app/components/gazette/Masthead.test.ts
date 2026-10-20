import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SEASON } from "@epl/core";
import Masthead from "./Masthead";

const AT = "2026-10-20T08:00:00Z";
// Fri 23 Oct 2026, 19:45 in London.
const LOCKS = "2026-10-23T18:45:00Z";

// 20 Oct 2026, Craig: the dateline's right-hand slot carries the next line-up lock, not the season.
describe("the masthead's dateline", () => {
  it("prints the next lock at the right, its gameweek dropped under 375px", () => {
    const html = renderToStaticMarkup(createElement(Masthead, { at: AT, lock: { gameweek: 8, at: LOCKS } }));
    expect(html).toContain('<span class="max-[374px]:hidden">GW8 </span>Locks Fri 19:45');
    expect(html).not.toContain(SEASON);
  });

  // Integration review, 20 Oct: `numeric` set the lock's words in the display face beside the date's small caps.
  it("sets the lock in the dateline's own face, figures tabular", () => {
    const html = renderToStaticMarkup(createElement(Masthead, { at: AT, lock: { gameweek: 8, at: LOCKS } }));
    expect(html).toContain('<span class="tabular-nums whitespace-nowrap">');
    expect(html).not.toContain("numeric");
  });

  it("prints no gameweek where the calendar cannot name one", () => {
    const html = renderToStaticMarkup(createElement(Masthead, { at: AT, lock: { gameweek: undefined, at: LOCKS } }));
    expect(html).toContain(">Locks Fri 19:45<");
    expect(html).not.toContain("GW");
  });

  it("keeps the season when no lock is known", () => {
    const html = renderToStaticMarkup(createElement(Masthead, { at: AT, lock: null }));
    expect(html).toContain(SEASON);
    expect(html).not.toContain("Locks");
  });
});
