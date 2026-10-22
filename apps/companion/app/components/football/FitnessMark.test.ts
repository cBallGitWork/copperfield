import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "@epl/core";
import FitnessMark from "./FitnessMark";
import { noted, withWeeks } from "./withWeeks";

const man = (status: string, chanceOfPlaying: number | null, news = "Knock", code = 1) =>
  ({ code, status, chanceOfPlaying, news }) as unknown as FootballPlayer;
const draw = (player: FootballPlayer | null, weeks?: Record<number, number>) =>
  renderToStaticMarkup(withWeeks(createElement(FitnessMark, { player }), weeks));

describe("FitnessMark", () => {
  it("draws CM's mark for an unfit man, never the word chip", () => {
    const html = draw(man("i", 0));
    expect(html).toContain('role="img"');
    expect(html).not.toContain("cm-state");
  });

  it("follows the mark with the complaint and the export's return week", () => {
    const html = draw(man("i", 0, "Knee injury - Unknown return date"));
    expect(html).toContain(`>${noted("Knee", "GW10")}</span>`);
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("Knee"));
  });

  it("gives a doubt with no week his complaint alone, never his chance, in faint ink that gives way first", () => {
    const html = draw(man("d", 75, "Back injury - 75% chance of playing", 2));
    expect(html).toContain(`<span class="min-w-0 truncate leading-tight text-2xs text-faint shrink-[99]">${noted("Back injury")}</span>`);
  });

  it("prints the complaint alone outside the layout's calendar, a date it cannot place never printed", () => {
    const html = renderToStaticMarkup(createElement(FitnessMark, { player: man("s", 0, "Suspended until 31 Oct") }));
    expect(html).toContain(`>${noted("Suspended")}</span>`);
    expect(html.split("</svg>")[1]).not.toContain("Oct");
  });

  it("is silent for a fit man and one the bridge has not settled", () => {
    expect(draw(man("a", 100, ""))).toBe("");
    expect(draw(null)).toBe("");
  });
});
