import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublishedStory } from "@epl/core";
import TeamNews from "./TeamNews";

const story = {
  extras: {
    teamNews: [
      { club: "Chelsea", code: null, line: "Two doubts.", fixture: { opponent: "Arsenal", home: true, kickoff: "2026-10-10T11:30:00Z" } },
    ],
  },
} as PublishedStory;

describe("the team news thread", () => {
  it("sets a club's fixture with the paper's v, as every other fixture on the sheet", () => {
    const html = renderToStaticMarkup(createElement(TeamNews, { story }));
    expect(html).toContain("v Arsenal (H)");
    expect(html).not.toContain("vs ");
  });

  it("runs the still-out men in after their label, each with his owner where he has one", () => {
    const out = {
      extras: { teamNews: [{ club: "Chelsea", code: null, line: "", stillOut: [{ name: "Palmer", owner: "Craig" }, { name: "James" }] }] },
    } as PublishedStory;
    const html = renderToStaticMarkup(createElement(TeamNews, { story: out }));
    expect(html.replace(/<[^>]+>/g, "")).toContain("Still outPalmer (Craig) · James");
    expect(html).not.toContain("(FA)");
  });

  // 9 Oct's presser drew 17 " — " between a man and his note; the paper's prose takes a comma there.
  it("sets a man's note after a comma, never a spaced dash", () => {
    const out = { extras: { teamNews: [{ club: "Spurs", code: null, men: [{ name: "Mohamed-Ali Cho", status: "OUT", note: "calf" }, { name: "Porro", owner: "Craig", status: "Doubt", note: "hamstring" }] }] } } as PublishedStory;
    const text = renderToStaticMarkup(createElement(TeamNews, { story: out })).replace(/<[^>]+>/g, "");
    expect(text).toContain("Mohamed-Ali Cho, calf");
    expect(text).toContain("Porro (Craig), hamstring");
    expect(text).not.toContain(" — ");
  });

  it("prints no empty line over a club whose only news is its list", () => {
    const out = { extras: { teamNews: [{ club: "Spurs", code: null, stillOut: [{ name: "Porro" }] }] } } as PublishedStory;
    expect(renderToStaticMarkup(createElement(TeamNews, { story: out }))).not.toContain("text-base leading-snug text-muted\"></p>");
  });
});
