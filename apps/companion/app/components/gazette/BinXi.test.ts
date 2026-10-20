import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballSnapshot, PublishedStory } from "@epl/core";
import BinXi from "./BinXi";

vi.mock("next/image", () => ({ default: () => null }));

const man = (name: string, code: number, slot: string, points: number) => ({ name, code, slot, club: "COV", points, minutes: 90 });
const story = {
  kind: "bin-xi",
  extras: { bin: { shape: "4-4-2", total: 41, xi: [man("Carl Rushworth", 1, "G", 1), man("Bobby Thomas", 2, "D", 6)], keyStats: [] } },
} as unknown as PublishedStory;

describe("the Bin XI", () => {
  it("prints a man's single point as 1 pt, as the report sidebar does, never 1 pts", () => {
    const html = renderToStaticMarkup(createElement(BinXi, { story, snapshot: null }));
    expect(html).toContain(">1 pt<");
    expect(html).not.toContain("1 pts");
    expect(html).toContain(">6 pts<");
  });

  it("prints no bench, even under an archived story that filed one", () => {
    const bin = { ...story.extras?.bin, bench: [man("Marcus Rashford", 3, "F", 2)] };
    const html = renderToStaticMarkup(createElement(BinXi, { story: { ...story, extras: { bin } } as unknown as PublishedStory, snapshot: null }));
    expect(html).not.toContain("Bench");
    expect(html).not.toContain("Rashford");
  });

  // 20 Oct 2026: GW7's Bin XI washed Marmoush yellow for a calf knock reported after the gameweek.
  it("carries no doubt wash from today's news onto a gameweek already played, and keeps his card", () => {
    const doubtful = { code: 2, name: "Thomas", clubId: 9, status: "d", news: "Calf injury - 75% chance of playing", chanceOfPlaying: 75 };
    const snapshot = { players: [doubtful], clubs: [{ id: 9, code: 94, shortName: "COV", name: "Coventry" }] } as unknown as FootballSnapshot;
    const html = renderToStaticMarkup(createElement(BinXi, { story, snapshot }));
    expect(html).not.toContain("cm-card-doubt");
    expect(html).toContain("Thomas");
  });
});
