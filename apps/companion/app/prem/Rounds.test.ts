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
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*>1 yours<svg/);
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

  it("marks the count as one that opens, with a chevron inside its button", () => {
    const html = round(new Map([[1, [saka]]]));
    const button = html.slice(html.indexOf("<button"), html.indexOf("</button>"));
    expect(button).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(button).not.toContain("rotate-180");
  });

  it("holds the count's column on a row with none of his men", () => {
    const [, other] = rows(round(new Map([[1, [saka]]])));
    expect(other).toContain("min-[390px]:w-16");
  });

  // At 320 a column beside the row took the club codes to 0px; under 390 the count drops beneath the row.
  it("puts the count under the row below 390, so the club codes keep their room", () => {
    const html = round(new Map([[1, [saka]]]));
    expect(html.match(/class="flex flex-col min-\[390px\]:flex-row/g)).toHaveLength(2);
    expect(html).not.toMatch(/class="[^"]*(?<![:\w-])w-16/);
    const [, other] = rows(html);
    expect(other).toMatch(/<span class="[^"]*max-\[389px\]:hidden/);
  });

  it("hangs the owner edge in the gutter below 390, so the row keeps its full width", () => {
    const html = round(new Map([[1, [saka]]]));
    expect(html.match(/border-l-4[^"]*max-\[389px\]:-ml-1/g)).toHaveLength(2);
  });
});

describe("a signed-out reader", () => {
  it("gets no column, no edge and no button", () => {
    const html = round();
    expect(html).not.toContain("w-16");
    expect(html).not.toContain("border-l-4");
    expect(html).not.toContain("<button");
  });
});

describe("a match row's ways in", () => {
  // Craig, 21 Oct 2026: a team name goes to its club, the score or kickoff to the match; the row was one link.
  it("links each club's name to its page and the middle to the match", () => {
    const hrefs = [...round().matchAll(/<a [^>]*href="(\/prem\/(?:club|match)\/[^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/prem/club/1", "/prem/match/1", "/prem/club/2", "/prem/club/1", "/prem/match/2", "/prem/club/2"]);
  });
});
