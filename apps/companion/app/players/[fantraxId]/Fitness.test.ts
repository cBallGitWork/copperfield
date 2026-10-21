import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Story } from "./Fitness";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("./latestNews", () => ({ latestNews: async () => null }));
vi.mock("./TransferStatus", () => ({ default: () => null }));

const story = {
  id: "1",
  headline: "Saka trained on Thursday.",
  body: "He came through the full session.",
  analysis: "Expect him to start.",
  at: Date.UTC(2026, 9, 16, 12),
};

describe("Story", () => {
  // A phone gets the opening paragraph only; the News tab holds the rest, the desk keeps it all (M-SQUADS-7).
  it("hides every paragraph after the first below lg", () => {
    const html = renderToStaticMarkup(createElement(Story, { story }));
    const paragraphs = [...html.matchAll(/<p class="([^"]*)">([^<]*)<\/p>/g)];
    expect(paragraphs.map((m) => m[2])).toEqual([story.headline, story.body, story.analysis]);
    expect(paragraphs[0][1]).not.toContain("max-lg:hidden");
    expect(paragraphs.slice(1).every((m) => m[1].includes("max-lg:hidden"))).toBe(true);
    expect(html).toContain("<time");
  });
});
