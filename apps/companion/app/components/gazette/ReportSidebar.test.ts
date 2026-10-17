import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { StoryReport } from "@epl/core";
import ReportSidebar from "./ReportSidebar";

vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

// Porro off injured for Gray, and Gray himself off later for Kudus, who was booked: Spurs v Villa, GW5.
const lineup = {
  formation: "4-3-3",
  lines: [[{ name: "Porro", booked: false, sentOff: false, replacedBy: { name: "Gray", minute: "19", booked: false, replacedBy: { name: "Kudus", minute: "80", booked: true } } }]],
  unused: [],
};
const side = (code: number, withLineup: boolean) => ({ code, score: 0, goals: [], assists: [], manager: null, lineup: withLineup ? lineup : null, next: null });
const report = {
  fixtureCode: 1, kickoff: "", home: side(6, true), away: side(7, false), halfTime: null, venue: null, attendance: null, referee: null,
  standfirst: "", account: "", sections: [], keyStats: [], rows: [], video: null,
} as unknown as StoryReport;

describe("the report sidebar's line-ups", () => {
  it("prints every man in a chain of replacements, and books the last of them", () => {
    const html = renderToStaticMarkup(createElement(ReportSidebar, { report, names: () => "Tottenham Hotspur", matchHref: null })).replace(/<[^>]*>/gu, "");
    expect(html).toContain("Porro (Gray 19 (Kudus 80))");
    expect(html).toContain("Booked: Kudus.");
  });
});

describe("the report sidebar's Star man", () => {
  const starred = (holder: string | null) =>
    renderToStaticMarkup(createElement(ReportSidebar, { report: { ...report, star: { name: "Henderson", mark: 9.1, club: "Chelsea", holder, did: "two goals" } } as unknown as StoryReport, names: () => "Chelsea", matchHref: null })).replace(/<[^>]*>/gu, "");

  it("names his manager when he has one, and tags an unowned man with nothing", () => {
    expect(starred("Cowthenbeef")).toContain("Chelsea, Cowthenbeef · two goals");
    expect(starred(null)).toContain("Chelsea · two goals");
    expect(starred(null)).not.toContain("free agent");
  });
});
