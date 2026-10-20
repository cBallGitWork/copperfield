import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { bannerWords, runsAfter } from "./banner";
import { WaiverLine } from "./WaiverCountdown";

vi.mock("../../components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

// The real league's week from Tuesday 20 Oct 2026: runs Wed, Thu and Fri at 18:00 London.
const RUNS = ["2026-10-21T17:00:00.000Z", "2026-10-22T17:00:00.000Z", "2026-10-23T17:00:00.000Z"];
const at = (iso: string) => Date.parse(iso);

describe("bannerWords", () => {
  it("opens eighteen hours out, at midnight London before an 18:00 run", () => {
    expect(bannerWords(RUNS, at("2026-10-20T22:59:00Z"), 9, false)).toBeNull();
    expect(bannerWords(RUNS, at("2026-10-20T23:00:00Z"), 9, false)).toEqual({ when: "in 18h", near: true, place: "you're 9th" });
  });

  it("counts down to the minute on the day", () => {
    expect(bannerWords(RUNS, at("2026-10-21T11:48:00Z"), 9, false)?.when).toBe("in 5h 12m");
  });

  // Thursday and Friday are runs too, so the banner opens again each night.
  it("moves to the next run once one has gone, and opens again eighteen hours before it", () => {
    expect(bannerWords(RUNS, at("2026-10-21T17:00:00Z"), 1, false)).toBeNull();
    expect(bannerWords(RUNS, at("2026-10-21T23:30:00Z"), 1, false)?.when).toBe("in 17h 30m");
  });

  it("says the day and the time before the window when it must always show", () => {
    expect(bannerWords(RUNS, at("2026-10-19T12:00:00Z"), 9, true)).toEqual({ when: "Wed 18:00", near: false, place: "you're 9th" });
  });

  it("lists the week's other runs after the next, and none a weekday would name twice", () => {
    const ahead = [...RUNS, "2026-10-28T17:00:00.000Z"];
    expect(runsAfter(ahead, ahead[0] ?? "")).toEqual([RUNS[1], RUNS[2]]);
    expect(runsAfter(ahead, ahead[2] ?? "")).toEqual(["2026-10-28T17:00:00.000Z"]);
  });

  it("leaves the place out for a reader with none, and says nothing once every run has gone", () => {
    expect(bannerWords(RUNS, at("2026-10-21T12:00:00Z"), null, false)?.place).toBeNull();
    expect(bannerWords(RUNS, at("2026-10-24T00:00:00Z"), 9, true)).toBeNull();
    expect(bannerWords([], at("2026-10-21T12:00:00Z"), 9, true)).toBeNull();
  });
});

describe("the waiver line", () => {
  // Review M-LEAGUE-1: with no schedule read, Transfers had no way in to Waivers.
  const line = (words: ReturnType<typeof bannerWords>, place: number | null, always: boolean) =>
    renderToStaticMarkup(createElement(WaiverLine, { words, place, always }));

  it("still leads to Waivers on Transfers with no run to count down to, naming the reader's place", () => {
    const html = line(null, 7, true);
    expect(html).toContain('href="/league/waivers"');
    expect(html).toContain("you&#x27;re 7th");
    expect(html).not.toMatch(/>run /);
  });

  it("says just Waivers for a reader with no place", () => {
    expect(line(null, null, true)).not.toContain("you");
  });

  it("draws nothing off Transfers with no run near", () => {
    expect(line(null, 7, false)).toBe("");
  });

  it("counts down when a run is near", () => {
    expect(line({ when: "in 5h 12m", near: true, place: "you're 9th" }, 9, false)).toContain("in 5h 12m");
  });
});
