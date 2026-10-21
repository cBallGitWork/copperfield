import { readFileSync } from "node:fs";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DepthSpot } from "@epl/core";
import Squads from "./match/[id]/Squads";
import SquadTable from "./club/[code]/SquadTable";
import DepthList from "./club/[code]/depth/DepthList";
import DepthPitch from "./club/[code]/depth/DepthPitch";
import PlayerBoard from "./club/[code]/stats/PlayerBoard";
import TakerName from "./club/[code]/set-pieces/TakerName";
import FitnessMark from "../components/football/FitnessMark";
import { CLUB, MEN, byCode, buttons, cards, league } from "./premRows.fixture";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../components/shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("../components/league/ScrollBoard", () => ({
  default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));

// The rest of a Prem row's parts: the holder tag, the one player card, the stats lead's tile and a flush spine.

describe("holder tags in place of the owner's name", () => {
  it("prints the Holder tag after the name on a match's squads, a free man loud", () => {
    const html = renderToStaticMarkup(
      createElement(Squads, { home: CLUB, away: undefined, players: MEN, league, cards: new Map(), phoneSide: "home", reader: "t1", minutes: null }),
    );
    expect(html).toContain(">(Yours)<");
    expect(html).toMatch(/font-bold text-ink[^"]*"[^>]*>\(FA\)</);
  });

  it("drops the club squad's Owner column for the tag after the name", () => {
    const html = renderToStaticMarkup(createElement(SquadTable, { players: MEN, league, reader: null, cards, minutes: null }));
    expect(html).not.toContain(">Owner<");
    expect(html).toContain(">(FA)<");
    expect(html).not.toMatch(/>T</);
  });
});

describe("a set-piece taker", () => {
  it("carries his mark straight after his name, before the holder tag", () => {
    const html = renderToStaticMarkup(
      createElement(
        TakerName,
        {
          card: cards.get(1),
          held: league.get(1),
          teamNames: new Map([["t1", "Bannan"]]),
          reader: null,
          mark: createElement(FitnessMark, { player: MEN[0] ?? null }),
        } as unknown as Parameters<typeof TakerName>[0],
        "W. Saliba",
      ),
    );
    expect(html.indexOf("W. Saliba")).toBeLessThan(html.indexOf('<svg role="img"'));
    expect(html.indexOf('<svg role="img"')).toBeLessThan(html.indexOf("(Ban"));
  });
});

describe("a club's taps open the one player card", () => {
  // The audit's Lane 3: club squad, depth and set pieces open the card the match screens and every squad open.
  const lines: DepthSpot[][] = [MEN.map((player, at) => ({ slot: `S${at}`, label: "Slot", holders: [{ code: player.code, share: 1 }] }))];
  const depth = (view: typeof DepthList | typeof DepthPitch) =>
    renderToStaticMarkup(createElement(view, { lines, playerOf: (code: number) => byCode.get(code) ?? null, cardOf: (code: number) => cards.get(code), minutes: null }));

  it("gives each man our league lists a card button, and the rest a plain name", () => {
    expect(buttons(renderToStaticMarkup(createElement(SquadTable, { players: MEN, league, reader: null, cards, minutes: null })))).toBe(cards.size);
    expect(buttons(depth(DepthList))).toBe(cards.size);
    expect(buttons(depth(DepthPitch))).toBe(cards.size);
  });

  it("links to no profile page in place of the card", () => {
    expect(depth(DepthList)).not.toContain("<a ");
  });

  // MaybeCard underlines on hover itself; a row's own copy printed the class twice.
  it("underlines each card button once, from MaybeCard", () => {
    for (const button of depth(DepthList).match(/<button[^>]*>/g) ?? []) expect(button.match(/hover:underline/g)).toHaveLength(1);
  });

  it("builds a card with our league's position for each listed man only", () => {
    expect([...cards.keys()]).toEqual([1, 2, 3]);
    expect(cards.get(1)?.rostered.slot.position).toBe("D");
  });
});

describe("a club's stats lead", () => {
  // D-14: the tile at both widths, as the squad and the squad Stats board lead, not a label under the name on a phone.
  it("shows the position tile under a thumb too", () => {
    const html = renderToStaticMarkup(
      createElement(PlayerBoard, { rows: MEN.map((player) => ({ player, positions: ["D"], href: null })), view: "attack" }),
    );
    expect(html).not.toContain("hidden lg:table-cell");
    expect(html).not.toMatch(/class="[^"]*lg:hidden[^"]*"><span[^>]*>DEF</);
  });
});

describe("a Prem player list's spine", () => {
  // D-9: the index tile meets the panel edge, as on the Draft lists; a padded PANEL set it 10px in.
  const FILES = [
    "match/[id]/Squads.tsx",
    "match/[id]/TeamSheet.tsx",
    "club/[code]/page.tsx",
    "club/[code]/stats/PlayerBoard.tsx",
    "club/[code]/depth/page.tsx",
    "club/[code]/set-pieces/page.tsx",
  ];

  it.each(FILES)("%s holds its list in PANEL_FLUSH", (file) => {
    const source = readFileSync(new URL(file.replace("[", "%5B").replace("]", "%5D"), import.meta.url), "utf8");
    expect(source).toContain("PANEL_FLUSH");
    expect(source).not.toMatch(/\bPANEL\b(?!_)/);
  });

  it("draws the match books' panel unpadded", () => {
    const html = renderToStaticMarkup(
      createElement(Squads, { home: CLUB, away: undefined, players: MEN, league, cards: new Map(), phoneSide: "home", reader: null, minutes: null }),
    );
    expect(html).toContain('<section class="cm-panel flex flex-col cm-index-scoped');
    expect(html).not.toMatch(/<section class="[^"]*\bp-2\b/);
  });
});
