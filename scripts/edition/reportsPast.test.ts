import { describe, expect, it } from "vitest";
import type { PublishedStory, StoryReport } from "@epl/core";
import { reportsBefore } from "./reportsPast";

const report = (text: string) =>
  ({ standfirst: text, account: `${text} account`, sections: [{ head: `${text} head`, pitch: `${text} pitch`, stake: `${text} stake` }] }) as unknown as StoryReport;
const filed = (day: string, filedAt: string, text: string): PublishedStory =>
  ({ slug: `gw6-prem-report-${day}`, kind: "match-report", filedAt, subjects: [`match-report:gw6:${day}`], extras: { reports: [report(text)] } }) as unknown as PublishedStory;

describe("reportsBefore", () => {
  // GW6's three days as the archive held them on 16 Oct: the Monday reprinted that afternoon, after the weekend's.
  const archive = [filed("2026-10-12", "2026-10-16T13:36:41Z", "monday"), filed("2026-10-10", "2026-10-11T09:00:00Z", "saturday"), filed("2026-10-11", "2026-10-12T09:00:00Z", "sunday")];
  const days = (stories: readonly PublishedStory[], day: string) => reportsBefore(stories, day, 4).map((prose) => prose.split("\n")[0]);

  it("keeps only days before the one being written, newest day first, whenever each was filed", () => {
    expect(days(archive, "2026-10-12")).toEqual(["sunday", "saturday"]);
    expect(days(archive, "2026-10-10")).toEqual([]);
  });

  it("never judges a reprint against its own old text or a later day", () => {
    expect(days(archive, "2026-10-11")).toEqual(["saturday"]);
  });

  it("reads the writer's words as the page's check does, heads and pitches, never the desk's stakes", () => {
    const [sunday] = reportsBefore(archive, "2026-10-12", 1);
    expect(sunday).toContain("sunday head");
    expect(sunday).toContain("sunday pitch");
    expect(sunday).not.toContain("stake");
  });

  it("reads a day filed twice once, as last filed", () => {
    expect(days([...archive, filed("2026-10-11", "2026-10-16T14:00:00Z", "sunday again")], "2026-10-12")).toEqual(["sunday again", "saturday"]);
  });
});
