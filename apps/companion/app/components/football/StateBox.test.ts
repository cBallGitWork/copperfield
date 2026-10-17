import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer } from "@epl/core";
import StateBox from "./StateBox";

vi.mock("@/app/desk", () => ({ MINOR_CAPS: "" }));

const doubt = (news: string, chanceOfPlaying: number | null) =>
  renderToStaticMarkup(createElement(StateBox, { player: { status: "d", news, chanceOfPlaying } as FootballPlayer }));

describe("the state box's title", () => {
  // #533: "75% chance of playing · Ankle injury - 75% chance of playing" said the chance twice.
  it("says the chance once when the news repeats it", () => {
    expect(doubt("Ankle injury - 75% chance of playing", 75)).toContain('title="75% chance of playing · Ankle injury"');
  });

  it("keeps news that says something else whole", () => {
    expect(doubt("Suspended until 24 Oct", 50)).toContain('title="50% chance of playing · Suspended until 24 Oct"');
  });
});
