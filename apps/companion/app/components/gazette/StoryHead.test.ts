import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, PublishedStory } from "@epl/core";
import StoryHead from "./StoryHead";
import Teaser from "./Teaser";

vi.mock("./TurnLink", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("./StoryFace", () => ({ default: () => null, hasPicture: () => false }));
vi.mock("./Dateline", () => ({ default: () => null }));

const classOf = (html: string, tag: string) => new RegExp(`<${tag} class="([^"]*)"`).exec(html)?.[1].split(" ") ?? [];
const wraps = expect.arrayContaining(["wrap-anywhere", "hyphens-auto"]);

describe("a paper headline at a phone's narrowest measure", () => {
  it("breaks a long word inside an article's head and a front-page head", () => {
    expect(classOf(renderToStaticMarkup(createElement(StoryHead, { headline: "domeitalycoach", standfirst: "", rank: "article" })), "h1")).toEqual(wraps);
    expect(classOf(renderToStaticMarkup(createElement(StoryHead, { headline: "domeitalycoach", standfirst: "", rank: "front" })), "h2")).toEqual(wraps);
  });

  it("breaks a long word inside a shoulder's 138px column", () => {
    const story = { slug: "s", headline: "domeitalycoach end up in the red", deck: "" } as PublishedStory;
    expect(classOf(renderToStaticMarkup(createElement(Teaser, { story, clubs: new Map<number, Club>(), pictured: false })), "h3")).toEqual(wraps);
  });
});
