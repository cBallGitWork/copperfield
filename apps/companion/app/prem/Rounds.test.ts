import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, Fixture, FootballPlayer } from "@epl/core";
import RoundMatches, { byRound, sideCounts } from "./Rounds";

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
const rice = { id: 10, code: 100, name: "Rice", clubId: 1 } as FootballPlayer;
const palmer = { id: 11, code: 111, name: "Palmer", clubId: 2 } as FootballPlayer;

/** Gameweek 7: match 1 holds `mine`'s men for it, match 2 none. */
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

/** Each match's markup, in the order drawn, cut at its home club's link. */
function rows(html: string): string[] {
  return html.split('href="/prem/club/1"').slice(1);
}

describe("a round's order", () => {
  it("breaks a level kickoff by fixture id, and puts an undated match last", () => {
    const [only] = byRound([fixture(5, "2026-10-10T14:00:00Z"), fixture(3, null), fixture(4, "2026-10-10T14:00:00Z")]);
    expect(only.fixtures.map((f) => f.id)).toEqual([4, 5, 3]);
  });
});

describe("his men counted by side", () => {
  it("counts each man under the club he plays for", () => {
    expect(sideCounts(fixture(1, null), [saka, rice, palmer])).toEqual({ home: 2, away: 1 });
    expect(sideCounts(fixture(1, null), [palmer])).toEqual({ home: 0, away: 1 });
    expect(sideCounts(fixture(1, null), [])).toEqual({ home: 0, away: 0 });
  });
});

// Craig, 21 Oct 2026: "i hate the 2 yours text in its own columns, looks crap, put it under the team name".
describe("a signed-in reader's count", () => {
  it("prints each side's count beside its own club's name, the home before the score and the away after", () => {
    const [match] = rows(round(new Map([[1, [saka, rice, palmer]]])));
    expect(match).toMatch(/HOM[\s\S]*aria-label="2 yours"[\s\S]*href="\/prem\/match\/1"[\s\S]*AWA[\s\S]*aria-label="1 yours"/);
  });

  it("prints a count only on the side that has his men", () => {
    const [match, other] = rows(round(new Map([[1, [palmer]]])));
    expect(match.match(/<button/g)).toHaveLength(1);
    expect(match.indexOf("<button")).toBeGreaterThan(match.indexOf('href="/prem/club/2"'));
    expect(other).not.toContain("<button");
    expect(other).not.toContain("yours");
  });

  it("holds no count column on any row, with men or without", () => {
    const html = round(new Map([[1, [saka]]]));
    expect(html).not.toMatch(/w-16|min-\[390px\]:flex-row|max-\[389px\]:hidden/);
  });

  it("opens his men under the row from either count, rather than leading to another page", () => {
    const html = round(new Map([[1, [saka, palmer]]]));
    expect(html).not.toContain("/gw/");
    const controls = [...html.matchAll(/<button[^>]*aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(controls).toHaveLength(2);
    expect(controls[0]).toBe(controls[1]);
    expect(html).toMatch(new RegExp(`<div id="${controls[0]}" hidden="">[\\s\\S]*Saka`));
  });

  it("sits beside the names' links on one line, never inside one, each at a row's 36, a pill under lg", () => {
    const html = round(new Map([[1, [saka, palmer]]]));
    for (const a of html.match(/<a [\s\S]*?<\/a>/g) ?? []) expect(a).not.toContain("<button");
    for (const b of html.match(/<button[^>]*>/g) ?? []) expect(b).toMatch(/min-h-9 /);
    expect(html).not.toContain("min-h-6");
    expect(html).toMatch(/<button[^>]*aria-label="1 yours"[^>]*><span aria-hidden="true" class="[^"]*bg-accent[^"]*lg:hidden">1<\/span>/);
  });

  it("marks the count as one that opens, with a closed chevron inside its button", () => {
    const html = round(new Map([[1, [saka]]]));
    const button = html.slice(html.indexOf("<button"), html.indexOf("</button>"));
    expect(button).toMatch(/aria-expanded="false"/);
    expect(button).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(button).not.toContain("rotate-180");
  });

  it("draws no owner edge, so every row's blocks keep the arrows' column", () => {
    const html = round(new Map([[1, [saka]]]));
    expect(html).not.toContain("border-l-4");
    expect(html).not.toContain("-ml-1");
  });
});

describe("a signed-out reader", () => {
  it("gets no edge and no button", () => {
    const html = round();
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
