import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, SquadPlayerDetail } from "@epl/core";
import SquadRow from "./SquadRow";
import { withWeeks } from "../football/withWeeks";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../../desk"));

const row = (player: Partial<FootballPlayer>): SquadPlayerDetail => ({
  rostered: {
    slot: { fantraxId: "o", position: "D", status: "" },
    player: { code: 2, name: "O'Reilly", fullName: "Nico O'Reilly", firstName: "Nico", secondName: "O'Reilly", ...player } as FootballPlayer,
    stats: [],
  },
  club: undefined,
  opposition: undefined,
  points: 4,
  minutes: [],
}) as unknown as SquadPlayerDetail;
const draw = (player: Partial<FootballPlayer>) =>
  renderToStaticMarkup(withWeeks(createElement(SquadRow, { player: row(player), eligible: ["D"], reserve: false })));
const doubt = { status: "d", chanceOfPlaying: 75, news: "Back injury - 75% chance of playing" };

describe("a squad row", () => {
  // Craig, 22 Oct 2026: O'Reilly showed a yellow cross and nothing of why.
  it("notes a doubt's complaint and chance after his mark", () => {
    const html = draw(doubt);
    expect(html.indexOf('<svg role="img"')).toBeGreaterThan(-1);
    expect(html.indexOf('<svg role="img"')).toBeLessThan(html.indexOf(">Back · 75%</span>"));
  });

  it("gives an injured man the export's return week, never FPL's dated prose", () => {
    const html = draw({ code: 1, status: "i", chanceOfPlaying: 0, news: "Hamstring injury - Expected back 1 Nov" });
    expect(html).toContain(">Hamstring · GW10</span>");
    expect(html).not.toContain(">Back 1 Nov<");
  });

  it("stays one 36px row: the note rides the name's line", () => {
    const html = draw(doubt);
    expect(html).toMatch(/class="cm-row flex min-h-9 /);
    expect(html).toMatch(/<\/svg><span class="[^"]*">Back · 75%<\/span><\/span><\/span><span class="flex shrink-0/);
  });

  it("notes nothing for a fit man", () => {
    expect(draw({ status: "a", chanceOfPlaying: 100, news: "" })).not.toContain("text-2xs text-faint");
  });
});
