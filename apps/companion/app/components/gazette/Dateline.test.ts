import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublishedStory } from "@epl/core";
import Dateline from "./Dateline";
import Brief from "./Brief";

// The row's link and picture load the app's alias; the words are what is under test.
vi.mock("./TurnLink", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("./StoryFace", () => ({ default: () => null, hasPicture: () => false }));

const presser = { kind: "presser", byline: "The Team Sheet", edition: "The Team Sheet", filedAt: "2026-10-09T15:40:00Z" } as PublishedStory;

// 19 Oct 2026, Craig: "remove tags above the titles like 'the back page' nobody knows what that is". A column's name
// left the heads, and it must not come back by the dateline.
describe("a story's dateline", () => {
  it("never names the story's column or its edition", () => {
    const html = renderToStaticMarkup(createElement(Dateline, { story: presser, byline: false, turn: false }));
    expect(html).not.toContain("The Team Sheet");
    expect(html).toContain("Filed");
  });

  it("names no second column either, as the Line-Ups once did with The Form Guide", () => {
    const lineups = { ...presser, byline: "The Line-Ups", edition: "The Form Guide" } as PublishedStory;
    const html = renderToStaticMarkup(createElement(Dateline, { story: lineups, byline: false, turn: false }));
    expect(html).not.toMatch(/The Line-Ups|The Form Guide/);
  });
});

// 20 Oct 2026, Craig: a phone's brief prints its filing day, so last week's story does not pass for this week's.
describe("a brief's filing day", () => {
  const old = { ...presser, slug: "old", headline: "Old news", filedAt: "2026-10-11T18:44:00Z" } as PublishedStory;

  it("is the day alone, never the time or the turn", () => {
    const html = renderToStaticMarkup(createElement(Dateline, { story: old, byline: false, day: true }));
    expect(html).toMatch(/>Sun 11 Oct</);
    expect(html).not.toMatch(/Filed|read on/);
  });

  it("prints on a phone's row, and the desk's card keeps its full dateline", () => {
    const html = renderToStaticMarkup(createElement(Brief, { story: old, clubs: new Map() }));
    expect(html).toMatch(/<span class="[^"]*@md\/stories:hidden[^"]*">Sun 11 Oct<\/span>/);
    expect(html).toMatch(/<span class="[^"]*hidden @md\/stories:block[^"]*">Filed /);
  });
});
