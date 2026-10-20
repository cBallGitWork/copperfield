import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, Fixture, FootballPlayer } from "@epl/core";
import RoundMatches, { byRound } from "./Rounds";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/mine", () => import("../mine"));
vi.mock("@/app/components/shell/Link", () => import("../components/shell/Link"));

function fixture(id: number, kickoff: string | null): Fixture {
  return {
    id, code: id, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff, homeScore: 3, awayScore: 1,
    status: "finished", settled: true, minutes: 90, homeDifficulty: null, awayDifficulty: null,
  } as Fixture;
}

const clubs = new Map<number, Club>([
  [1, { id: 1, code: 1, name: "Home", shortName: "HOM" } as Club],
  [2, { id: 2, code: 2, name: "Away", shortName: "AWA" } as Club],
]);
const saka = { id: 9, code: 99, name: "Saka", clubId: 1 } as FootballPlayer;

/** Gameweek 7: match 1 with one of his men, match 2 with none. */
function round(mine?: Map<number, FootballPlayer[]>): string {
  return renderToStaticMarkup(
    createElement(RoundMatches, {
      round: { gameweek: 7, fixtures: [fixture(1, "2026-10-10T14:00:00Z"), fixture(2, "2026-10-10T14:00:00Z")] },
      clubs,
      places: new Map(),
      step: { previous: 6, next: 8, href: (gw: number) => `/prem/fixtures?gw=${gw}` },
      men: mine === undefined ? undefined : { mine, lines: null, now: false },
    }),
  );
}

/** Each match's markup, in the order drawn. */
function rows(html: string): string[] {
  return html.split('href="/prem/match/').slice(1);
}

describe("a round's order", () => {
  it("breaks a level kickoff by fixture id, and puts an undated match last", () => {
    const [only] = byRound([fixture(5, "2026-10-10T14:00:00Z"), fixture(3, null), fixture(4, "2026-10-10T14:00:00Z")]);
    expect(only.fixtures.map((f) => f.id)).toEqual([4, 5, 3]);
  });
});

describe("a signed-in reader's count", () => {
  it("opens his men under the row rather than leading to another page", () => {
    const html = round(new Map([[1, [saka]]]));
    expect(html).not.toContain("/gw/");
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*>1 yours<\/button>/);
    expect(html).toContain("Saka");
  });

  it("sits beside the row's link, never inside it, and keeps a thumb's height", () => {
    const html = round(new Map([[1, [saka]]]));
    const link = html.slice(html.indexOf('href="/prem/match/1"'));
    expect(link.slice(0, link.indexOf("</a>"))).not.toContain("<button");
    expect(html).toMatch(/<button[^>]*class="[^"]*min-h-11/);
  });

  it("edges a match with his men in the accent, and holds a clear edge on the other", () => {
    const html = round(new Map([[1, [saka]]]));
    expect(html.match(/border-l-accent/g)).toHaveLength(1);
    expect(html.match(/border-l-transparent/g)).toHaveLength(1);
    expect(html.indexOf("border-l-accent")).toBeLessThan(html.indexOf('href="/prem/match/1"'));
    expect(html.indexOf("border-l-transparent")).toBeGreaterThan(html.indexOf('href="/prem/match/1"'));
  });

  it("holds the count's column on a row with none of his men", () => {
    const [, other] = rows(round(new Map([[1, [saka]]])));
    expect(other).toContain("w-12");
  });
});

describe("a signed-out reader", () => {
  it("gets no column, no edge and no button", () => {
    const html = round();
    expect(html).not.toContain("w-12");
    expect(html).not.toContain("border-l-4");
    expect(html).not.toContain("<button");
  });
});
