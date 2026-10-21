import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { availabilityOf, type FootballPlayer } from "@epl/core";
import StateMark from "./StateMark";

const mark = (status: string, chanceOfPlaying: number | null, news = "Knock") =>
  renderToStaticMarkup(
    createElement(StateMark, {
      availability: availabilityOf({ status, chanceOfPlaying, news } as unknown as FootballPlayer),
    }),
  );

const CROSS = '<path d="M6 2h4';

describe("StateMark", () => {
  it("crosses a slight doubt in the ramp's yellow", () => {
    const html = mark("d", 75);
    expect(html).toContain("fill:var(--color-doubt-slight)");
    expect(html).toContain(CROSS);
    expect(html).toContain('aria-label="Doubtful"');
  });

  it("crosses a major doubt in the ramp's orange", () => {
    const html = mark("d", 25);
    expect(html).toContain("fill:var(--color-doubt-major)");
    expect(html).toContain(CROSS);
  });

  it("crosses an injured man in the ramp's red", () => {
    const html = mark("i", 0);
    expect(html).toContain("fill:var(--color-doubt-out)");
    expect(html).toContain(CROSS);
    expect(html).toContain('aria-label="Injured"');
  });

  it("gives a ban a red card, not a cross", () => {
    const html = mark("s", null, "Suspended until 25 Oct");
    expect(html).toContain("fill:var(--color-doubt-out)");
    expect(html).toMatch(/<rect /);
    expect(html).not.toContain(CROSS);
  });

  it("bars a man who has gone", () => {
    const html = mark("u", 0, "Left the club");
    expect(html).toMatch(/<circle [^>]*fill="none"/);
    expect(html).not.toContain(CROSS);
  });

  it("carries the chance in its title", () => {
    expect(mark("d", 50)).toContain("50% chance of playing");
  });

  it("hides itself from a screen reader where the word stands beside it", () => {
    const html = renderToStaticMarkup(
      createElement(StateMark, {
        availability: availabilityOf({ status: "d", chanceOfPlaying: 75, news: "Knock" } as unknown as FootballPlayer),
        worded: true,
      }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("aria-label");
  });

  it("keeps its band on a reserve row: each shape fills from the band, never currentColor", () => {
    for (const html of [mark("i", 0), mark("s", null, "Suspended"), mark("u", 0, "Left the club")]) {
      expect(html).not.toContain("currentColor");
      expect(html).toMatch(/(fill|stroke):var\(--color-doubt-out\)/);
    }
  });

  it("draws nothing for a fit man", () => {
    expect(mark("a", 100, "")).toBe("");
  });
});
