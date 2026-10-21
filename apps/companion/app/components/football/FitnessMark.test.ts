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

  it("draws the mark a row's own fitnessOf already gave, without a footballer", () => {
    const html = renderToStaticMarkup(createElement(FitnessMark, { mark: { state: "suspended", chance: 0, news: "Ban", out: true, label: "SUS" } as never }));
    expect(html).toContain("<rect");
    expect(renderToStaticMarkup(createElement(FitnessMark, { mark: null, player: man("i", 0) }))).toBe("");
  });

  it("is silent for a fit man and one the bridge has not settled", () => {
    expect(renderToStaticMarkup(createElement(FitnessMark, { player: man("a", 100, "") }))).toBe("");
    expect(renderToStaticMarkup(createElement(FitnessMark, { player: null }))).toBe("");
  });
});
