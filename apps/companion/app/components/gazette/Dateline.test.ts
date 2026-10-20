import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublishedStory } from "@epl/core";
import Dateline from "./Dateline";

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
