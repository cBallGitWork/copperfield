import { describe, expect, it } from "vitest";
import { afterTap, backStep, historyStep, tapReplaces } from "./backStep";

const LIVE = "/matchday";
const MATCH = "/prem/match/81";
const TIE = "/league/matchups/abc?vs=def";
const at = (url: string) => `https://app.test${url}`;

describe("the phone's back plate", () => {
  it("steps back when the browser names a page behind", () => {
    expect(backStep(LIVE, at(LIVE), 3, [])).toBe("back");
    expect(backStep(null, at(LIVE), 2, [])).toBe("back");
  });

  // 19 Oct 2026, Craig on the installed app: "live → click prem match → tap back. expected: back to live. current:
  // back to prem section". The iPhone reported nothing behind the match, and the plate took the Prem fallback.
  it("goes to the page the reader came from when the browser says there is nothing behind", () => {
    expect(backStep(LIVE, null, 1, [])).toEqual({ to: LIVE });
  });

  it("goes to the page the reader came from where the browser cannot say what is behind", () => {
    expect(backStep(LIVE, undefined, 1, [])).toEqual({ to: LIVE });
  });

  // QA-1, 19 Oct 2026: Live › head-to-head › a man's card › Full profile › plate landed on Live, skipping the tie.
  it("steps back to the page under a card's Full profile, whatever the trail remembers", () => {
    expect(backStep(LIVE, at(TIE), 3, [])).toBe("back");
  });

  // QA-2, 19 Oct 2026: Prem › Fixtures › GW7 › GW8 › GW7, then the plate ping-ponged GW8 ↔ GW7 for ever.
  it("walks the browser's own history out of a loop of taps", () => {
    // Back on the first GW7: the trail's GW7 was overwritten by the loop to read GW8, the browser has Fixtures behind.
    expect(backStep("/gw/8", at("/prem/fixtures"), 5, [])).toBe("back");
  });

  it("takes the section's list rather than revisit a page the plate has already stepped from", () => {
    // The browser has lost the history: the trail reads GW7 ← GW8 and GW8 ← GW7 after the loop.
    expect(backStep("/gw/8", null, 1, [])).toEqual({ to: "/gw/8" });
    expect(backStep("/gw/7", null, 1, ["/gw/7"])).toBe("list");
  });

  it("opens the section's list in place of a page opened cold, whatever the tab saw before the app", () => {
    expect(backStep(null, null, 5, [])).toBe("list");
  });

  it("falls back to the history's length where the browser cannot say and no tap was seen", () => {
    expect(historyStep(2)).toBe("back");
    expect(historyStep(1)).toBe("list");
    expect(backStep(null, undefined, 2, [])).toBe("back");
    expect(backStep(null, undefined, 1, [])).toBe("list");
  });
});

describe("what the plate remembers of a tap", () => {
  it("files the page a link opens under the page it was tapped on", () => {
    expect(afterTap({}, LIVE, MATCH, false)).toEqual({ [MATCH]: LIVE });
  });

  // Craig's case, kept: Live › match › Line-ups tab › plate lands on Live.
  it("carries a page's origin to the tab that replaces it, so Back still leaves the match", () => {
    const trail = afterTap({}, LIVE, MATCH, false);
    expect(afterTap(trail, MATCH, `${MATCH}/players`, true)).toEqual({ [MATCH]: LIVE, [`${MATCH}/players`]: LIVE });
  });

  it("remembers nothing for a tab whose page had no origin, or a link to the page it is on", () => {
    expect(afterTap({}, MATCH, `${MATCH}/stats`, true)).toEqual({});
    expect(afterTap({}, "/prem/fixtures?gw=7", "/prem/fixtures?gw=8", false)).toEqual({});
  });

  it("files the newest tap last and keeps the trail short", () => {
    let trail = {};
    for (let n = 0; n < 60; n++) trail = afterTap(trail, LIVE, `/prem/match/${n}`, false);
    trail = afterTap(trail, "/prem", "/prem/match/30", false);
    const keys = Object.keys(trail);
    expect(keys.length).toBeLessThanOrEqual(40);
    expect(keys.at(-1)).toBe("/prem/match/30");
    expect(trail).toMatchObject({ "/prem/match/30": "/prem" });
  });
});

describe("whether a tap replaces its page", () => {
  it("is a tab's replace on an ordinary page", () => {
    expect(tapReplaces(true, { __NA: true })).toBe(true);
    expect(tapReplaces(false, null)).toBe(false);
  });

  // QA-1: a card's Full profile replaces the card's own entry, so it is a push from the page under the card.
  it("is a push when the replacing link sits on a card's own entry", () => {
    expect(tapReplaces(true, { modal: "modal-3" })).toBe(false);
    const trail = afterTap(afterTap({}, LIVE, TIE, false), TIE, "/players/04qor", tapReplaces(true, { modal: "modal-1" }));
    expect(trail["/players/04qor"]).toBe(TIE);
  });
});
