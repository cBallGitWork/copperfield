import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { runsAfter } from "./banner";
import { WaiverLine } from "./WaiverLine";

vi.mock("../../components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

// The real league's week from Tuesday 20 Oct 2026: runs Wed, Thu and Fri at 18:00 London.
const RUNS = ["2026-10-21T17:00:00.000Z", "2026-10-22T17:00:00.000Z", "2026-10-23T17:00:00.000Z"];
const line = (place: number | null) => renderToStaticMarkup(createElement(WaiverLine, { place }));

describe("runsAfter", () => {
  it("lists the week's other runs after the next, and none a weekday would name twice", () => {
    const ahead = [...RUNS, "2026-10-28T17:00:00.000Z"];
    expect(runsAfter(ahead, ahead[0] ?? "")).toEqual([RUNS[1], RUNS[2]]);
    expect(runsAfter(ahead, ahead[2] ?? "")).toEqual(["2026-10-28T17:00:00.000Z"]);
  });
});

describe("the waiver line", () => {
  // Review M-LEAGUE-1: Transfers always has a way in to Waivers.
  it("leads to Waivers, naming the reader's place", () => {
    const html = line(7);
    expect(html).toContain('href="/league/waivers"');
    expect(html).toContain("you&#x27;re 7th");
  });

  // Craig, 22–23 Oct 2026: "remove the waivers run xx date, hate it"; of the countdown, "yes remove".
  it("never names a run, its day or a countdown", () => {
    expect(line(7).replace(/<[^>]*>/g, "")).not.toMatch(/run|in \d+h|\d\d:\d\d/);
  });

  it("says just Waivers for a reader with no place", () => {
    expect(line(null)).not.toContain("you");
  });
});
