import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, SquadPlayerDetail } from "@epl/core";
import SquadRow from "./SquadRow";
import { noted, withWeeks } from "../football/withWeeks";

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
  it("notes a doubt's complaint after his mark, never his chance", () => {
    const html = draw(doubt);
    expect(html.indexOf('<svg role="img"')).toBeGreaterThan(-1);
    expect(html.indexOf('<svg role="img"')).toBeLessThan(html.indexOf(`>${noted("Back injury")}</span>`));
  });

  it("gives an injured man the export's return week over FPL's date, and the date's gameweek without one", () => {
    const news = "Hamstring injury - Expected back 1 Nov";
    expect(draw({ code: 1, status: "i", chanceOfPlaying: 0, news })).toContain(`>${noted("Hamstring", "GW10")}</span>`);
    expect(draw({ code: 3, status: "i", chanceOfPlaying: 0, news })).toContain(`>${noted("Hamstring", "GW10")}</span>`);
  });

  // Craig, 23 Oct 2026: "theres an expected date too, on some rows we had that under the player name, wheres that gone".
  it("puts FPL's expected date back under the name, and none where FPL names no day", () => {
    expect(draw({ code: 1, status: "i", chanceOfPlaying: 0, news: "Hamstring injury - Expected back 1 Nov" })).toContain(">Back 1 Nov</span>");
    expect(draw({ code: 1, status: "s", chanceOfPlaying: 0, news: "Suspended until 31 Oct" })).toContain(">Back 31 Oct</span>");
    expect(draw({ code: 1, status: "i", chanceOfPlaying: 0, news: "Knee injury - Unknown return date" })).not.toContain(">Back ");
  });

  it("keeps a 36px row, the note beside the name when it fits and wrapping under it on a phone when not", () => {
    const html = draw(doubt);
    expect(html).toMatch(/class="cm-row flex min-h-9 /);
    // The name and mark never part; the note is their sibling in a line that wraps under a thumb and not on a desk.
    expect(html).toContain('<span class="flex min-w-0 flex-wrap items-center gap-x-1.5 lg:flex-nowrap"><span class="flex min-w-0 max-w-full items-center gap-1.5">');
    expect(html).toContain(`</svg></span><span class="min-w-0 truncate leading-tight text-2xs text-faint shrink-[99]">${noted("Back injury")}</span></span>`);
  });

  it("notes nothing for a fit man", () => {
    expect(draw({ status: "a", chanceOfPlaying: 100, news: "" })).not.toContain("text-2xs text-faint");
  });
});
