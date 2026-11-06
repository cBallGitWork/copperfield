import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublishedStory } from "@epl/core";
import DraftReport from "./DraftReport";

vi.mock("@/app/derbies", () => ({ derbyBetween: () => null }));
vi.mock("./Face", () => ({ default: () => null }));

const none = { goals: [], assists: [], cleanSheets: [] };
const side = (teamId: string, name: string, score: number) => ({ teamId, name, score, returns: none, eleven: [], bench: [], rankBefore: null, rankAfter: null, run: "" });
const matchup = (n: number) => ({ home: side(`h${n}`, "Hazza Maguazza's Redempshazza", 36), away: side(`a${n}`, "Dome", 32), verdict: "", standfirst: "", paragraphs: [], story: null, face: null });
const story = (count: number) => ({ extras: { draft: { cutoff: "final", matchups: Array.from({ length: count }, (_, i) => matchup(i)) } } }) as unknown as PublishedStory;
const html = (count: number) => renderToStaticMarkup(createElement(DraftReport, { story: story(count), snapshot: null }));

describe("a draft report on a phone", () => {
  it("lets a long team name wrap inside its column of the full-time header", () => {
    const name = /<span class="([^"]*)">Hazza Maguazza&#x27;s Redempshazza<\/span>/.exec(html(1))?.[1] ?? "";
    expect(name.split(" ")).toEqual(expect.arrayContaining(["min-w-0", "wrap-anywhere"]));
  });

  it("prints every match-up one after another, with no contents list and none hidden", () => {
    const out = html(5);
    expect(out).not.toContain("The match-ups");
    expect(out).not.toContain(":hidden");
    expect(out.match(/<section/g)).toHaveLength(5);
  });
});
