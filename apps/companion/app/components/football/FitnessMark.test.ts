import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "@epl/core";
import FitnessMark from "./FitnessMark";

const man = (status: string, chanceOfPlaying: number | null, news = "Knock") =>
  ({ status, chanceOfPlaying, news }) as unknown as FootballPlayer;

describe("FitnessMark", () => {
  it("draws CM's mark for an unfit man, never the word chip", () => {
    const html = renderToStaticMarkup(createElement(FitnessMark, { player: man("i", 0) }));
    expect(html).toContain('role="img"');
    expect(html).not.toContain("cm-state");
  });

  it("is silent for a fit man and one the bridge has not settled", () => {
    expect(renderToStaticMarkup(createElement(FitnessMark, { player: man("a", 100, "") }))).toBe("");
    expect(renderToStaticMarkup(createElement(FitnessMark, { player: null }))).toBe("");
  });
});
