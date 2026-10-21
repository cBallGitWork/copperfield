import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { availabilityOf, type FootballPlayer } from "@epl/core";
import FitnessLine from "./FitnessLine";

vi.mock("@/app/desk", () => import("../../desk"));

const man = (status: string, chanceOfPlaying: number | null, news: string) =>
  ({ status, chanceOfPlaying, news }) as unknown as FootballPlayer;

const render = (player: FootballPlayer) =>
  renderToStaticMarkup(createElement(FitnessLine, { player, availability: availabilityOf(player), note: "Calf injury" }));

/** The quarter blocks filled in his band, out of four. */
const filled = (html: string) => (html.match(/background-color:var\(--color-doubt-/g) ?? []).length;

describe("FitnessLine", () => {
  it("washes a slight doubt amber, boxes it Dbt, crosses it in the same yellow and fills three quarters at 75%", () => {
    const html = render(man("d", 75, "Calf injury - 75% chance of playing"));
    expect(html).toContain("cm-doubt-slight");
    expect(html).toContain(">Dbt<");
    expect(html).toMatch(/<path d="M6 2h4[^>]*fill:var\(--color-doubt-slight\)/);
    expect(filled(html)).toBe(3);
    expect(html).toContain(">75%<");
  });

  it("washes an injured man red and fills no quarter at nought", () => {
    const html = render(man("i", 0, "Knee injury - Unknown return date"));
    expect(html).toContain("cm-doubt-out");
    expect(html).toContain(">Inj<");
    expect(filled(html)).toBe(0);
    expect(html).toContain(">0%<");
  });

  it("gives a ban CM's card, and draws no blocks where FPL gave no chance", () => {
    const html = render(man("s", null, "Suspended until 25 Oct"));
    expect(html).toMatch(/<rect /);
    expect(html).not.toContain("%<");
  });

  it("draws nothing for a fit man", () => {
    expect(render(man("a", 100, ""))).toBe("");
  });
});
