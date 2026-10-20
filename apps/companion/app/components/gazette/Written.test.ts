import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, PublishedStory } from "@epl/core";
import Written from "./Written";

vi.mock("./StoryFace", () => ({ default: () => "FACE" }));
vi.mock("./Share", () => ({ default: () => null }));
vi.mock("./Dateline", () => ({ default: () => null }));
vi.mock("./Calls", () => ({ default: () => null }));
vi.mock("@/app/config", () => ({ columnistOf: () => null }));

const face = { code: 1, name: "Dunk", clubId: 1, position: "D" };
const article = (kind: string, extras: object) =>
  ({ kind, slug: "s", headline: "H", deck: "", body: "Prose.", filedAt: "2026-10-19T20:00:00Z", face, extras }) as unknown as PublishedStory;
const figure = (story: PublishedStory) =>
  /<figure class="([^"]*)"/.exec(renderToStaticMarkup(createElement(Written, { story, teams: [], clubs: new Map<number, Club>() })))?.[1];

describe("an article's head picture", () => {
  it("prints on a desk only when the blocks below carry their own pictures", () => {
    expect(figure(article("draft-report", { draft: [] }))).toMatch(/(^| )hidden @3xl:block( |$)/);
    expect(figure(article("match-report", { reports: [] }))).toMatch(/(^| )hidden @3xl:block( |$)/);
  });

  it("prints at every width on a presser and a trade", () => {
    expect(figure(article("presser", { teamNews: [] }))).not.toContain("hidden");
    expect(figure(article("trade", {}))).not.toContain("hidden");
  });
});
