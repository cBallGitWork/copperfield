import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DepthSpot, PlTeamSheet } from "@epl/core";
import Squads from "./match/[id]/Squads";
import TeamSheet from "./match/[id]/TeamSheet";
import type { Match } from "./match/[id]/match";
import SquadTable from "./club/[code]/SquadTable";
import DepthList from "./club/[code]/depth/DepthList";
import DepthPitch from "./club/[code]/depth/DepthPitch";
import PlayerBoard from "./club/[code]/stats/PlayerBoard";
import { CLUB, MEN, UNFIT, byCode, cards, league, marks, minutes } from "./premRows.fixture";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../components/shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("../components/league/ScrollBoard", () => ({
  default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));

// Every Prem player row carries the Draft row's parts (UI audit D-3, D-7): each unfit man's StateMark and wash.

describe.each([
  [
    "a match's squads before kickoff",
    () =>
      createElement(Squads, {
        home: CLUB,
        away: undefined,
        players: MEN,
        league,
        cards: new Map(),
        phoneSide: "home",
        reader: "t1",
        minutes,
      }),
  ],
  [
    "a club's squad",
    () => createElement(SquadTable, { players: MEN, league, reader: "t1", cards, minutes: { gameweek: 8, byCode: minutes, asOf: "Thu" } }),
  ],
  [
    "a club's stats",
    () => createElement(PlayerBoard, { rows: MEN.map((player) => ({ player, positions: [], href: null })), view: "attack" }),
  ],
] as const)("%s", (_, draw) => {
  it("marks every unfit man, Saliba at 0% as injured", () => {
    const html = renderToStaticMarkup(draw());
    expect(marks(html)).toBe(UNFIT);
    expect(html).toContain('aria-label="Injured"');
    expect(html).not.toContain("cm-state");
  });

  it("washes each unfit man's row", () => {
    const html = renderToStaticMarkup(draw());
    expect(html).toContain("cm-doubt-out");
    expect(html).toContain("cm-doubt-major");
  });
});

describe("a match's team sheet, once played", () => {
  // Craig's standing rule (docs/ui/match.md): today's injury flag has no business on a match already played.
  const draw = () => {
    const sheet = {
      lineup: MEN.map((player) => ({ code: player.code, name: player.name, position: "D", shirt: player.code, captain: false })),
      substitutes: [],
    } as unknown as PlTeamSheet;
    const match = { home: CLUB, away: undefined, sheet: null, byCode } as unknown as Match;
    return createElement(TeamSheet, {
      match,
      sheets: { home: sheet, away: { lineup: [], substitutes: [] } as unknown as PlTeamSheet },
      events: new Map(),
      injured: new Map(),
      league,
      cards: new Map(),
      phoneSide: "home",
      reader: "t1",
    });
  };

  it("draws no doubt mark or wash, but keeps the holder tag", () => {
    const html = renderToStaticMarkup(draw());
    expect(marks(html)).toBe(0);
    expect(html).not.toContain("cm-doubt-");
    expect(html).toContain(">(Yours)<");
  });

  it("prints no head strip, its widths on a colgroup", () => {
    const html = renderToStaticMarkup(draw());
    expect(html).not.toContain("<thead");
    expect(html).toContain("<colgroup");
  });
});

describe("the depth chart", () => {
  const lines: DepthSpot[][] = [MEN.map((player, at) => ({ slot: `S${at}`, label: "Slot", holders: [{ code: player.code, share: 1 }] }))];
  const draw = (view: typeof DepthList | typeof DepthPitch) =>
    renderToStaticMarkup(
      createElement(view, { lines, playerOf: (code: number) => byCode.get(code) ?? null, cardOf: (code: number) => cards.get(code), minutes: { gameweek: 8, byCode: minutes } }),
    );

  it("marks every unfit man in the list", () => {
    expect(marks(draw(DepthList))).toBe(UNFIT);
  });

  // DESIGN §3: the pitch carries the colour alone (Craig, 1 Oct 2026: "pitch view, remove the chip").
  it("washes a doubt on the pitch but draws no mark there", () => {
    const html = draw(DepthPitch);
    expect(marks(html)).toBe(0);
    expect(html).toContain("cm-doubt-out");
  });

  it.each([
    ["list", DepthList],
    ["pitch", DepthPitch],
  ] as const)("inks the %s's xMins red under the floor, cyan above it", (_, view) => {
    const html = draw(view);
    expect(html).toMatch(/text-bad"[^>]*>0</);
    expect(html).toMatch(/text-info"[^>]*>90</);
  });
});
