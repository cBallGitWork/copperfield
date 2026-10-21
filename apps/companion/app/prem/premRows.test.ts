import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, DepthSpot, FootballPlayer, PlTeamSheet } from "@epl/core";
import type { LeagueOpinion } from "./leagueOpinions";
import Squads from "./match/[id]/Squads";
import TeamSheet from "./match/[id]/TeamSheet";
import type { Match } from "./match/[id]/match";
import SquadTable from "./club/[code]/SquadTable";
import DepthList from "./club/[code]/depth/DepthList";
import DepthPitch from "./club/[code]/depth/DepthPitch";
import PlayerBoard from "./club/[code]/stats/PlayerBoard";
import TakerName from "./club/[code]/set-pieces/TakerName";
import FitnessMark from "../components/football/FitnessMark";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../components/shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("../components/league/ScrollBoard", () => ({
  default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));

// Every Prem player row carries the Draft row's parts (UI audit D-3, D-7): each unfit man's StateMark and wash.

const CLUB = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" } as unknown as Club;
const season = new Proxy({ minutes: 900 } as Record<string, number>, { get: (t, k: string) => t[k] ?? 0 });
const man = (code: number, name: string, status: string, chanceOfPlaying: number | null, news: string) =>
  ({
    id: code,
    code,
    clubId: 1,
    name,
    fullName: name,
    firstName: "",
    secondName: name,
    status,
    news,
    chanceOfPlaying,
    season,
  }) as unknown as FootballPlayer;

// Saliba out at 0%, a major doubt, a ban, and two fit men.
const MEN = [
  man(1, "Saliba", "i", 0, "Hamstring injury - Expected back 1 Nov"),
  man(2, "Saka", "d", 25, "Knock - 25% chance of playing"),
  man(3, "Rice", "s", 0, "Suspended until 25 Oct"),
  man(4, "Raya", "a", 100, ""),
  man(5, "Ødegaard", "a", null, ""),
];
const UNFIT = 3;
const byCode = new Map(MEN.map((player) => [player.code, player]));
const opinion = (ownerTeamId: string | null, owner: string | null, status: string): LeagueOpinion => ({
  fantraxId: "x",
  positions: ["D"],
  status,
  ownerTeamId,
  owner,
});
const league = new Map<number, LeagueOpinion>([
  [1, opinion("t1", "Bannan", "T")],
  [2, opinion(null, null, "FA")],
  [3, opinion("t2", "Rival", "T")],
]);
const minutes = new Map<number, number | null>([[1, 0], [2, 49], [3, 0], [4, 90], [5, 80]]);

const marks = (html: string) => html.match(/<svg role="img"/g)?.length ?? 0;

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
    "a match's team sheet",
    () => {
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
    },
  ],
  ["a club's squad", () => createElement(SquadTable, { players: MEN, league, reader: "t1", minutes: { gameweek: 8, byCode: minutes, asOf: "Thu" } })],
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

describe("the depth chart", () => {
  const lines: DepthSpot[][] = [MEN.map((player, at) => ({ slot: `S${at}`, label: "Slot", holders: [{ code: player.code, share: 1 }] }))];
  const draw = (view: typeof DepthList | typeof DepthPitch) =>
    renderToStaticMarkup(
      createElement(view, { lines, playerOf: (code: number) => byCode.get(code) ?? null, hrefOf: () => null, minutes: { gameweek: 8, byCode: minutes } }),
    );

  it("marks every unfit man in the list", () => {
    expect(marks(draw(DepthList))).toBe(UNFIT);
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

describe("holder tags in place of the owner's name", () => {
  it("prints the Holder tag after the name on a match's squads, a free man loud", () => {
    const html = renderToStaticMarkup(
      createElement(Squads, { home: CLUB, away: undefined, players: MEN, league, cards: new Map(), phoneSide: "home", reader: "t1", minutes: null }),
    );
    expect(html).toContain(">(Yours)<");
    expect(html).toMatch(/font-bold text-ink[^"]*"[^>]*>\(FA\)</);
  });

  it("drops the club squad's Owner column for the tag after the name", () => {
    const html = renderToStaticMarkup(createElement(SquadTable, { players: MEN, league, reader: null, minutes: null }));
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
          href: null,
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
