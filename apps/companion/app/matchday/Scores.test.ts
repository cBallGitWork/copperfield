import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LEAGUE_COMPETITION, type Club, type CompetitionTie, type Fixture, type LiveTeamScore } from "@epl/core";
import { Scores } from "./Scores";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/mine", () => import("../mine"));
vi.mock("@/app/components/shell/Link", () => import("../components/shell/Link"));
vi.mock("@/app/league/routes", () => import("../league/routes"));

const tie = {
  competition: LEAGUE_COMPETITION,
  round: null,
  home: { label: "Atletico", team: { teamId: "a", name: "Atletico" } },
  away: { label: "Hazza", team: { teamId: "h", name: "Hazza" } },
} as unknown as CompetitionTie;

const scores = new Map<string, LiveTeamScore>([
  ["a", { teamId: "a", points: 43, toPlay: 2 }],
  ["h", { teamId: "h", points: 27, toPlay: 0 }],
]);

const fixture = {
  id: 58, code: 2645258, gameweek: 7, homeClubId: 14, awayClubId: 43, kickoff: "2026-10-17T14:00:00Z",
  homeScore: 0, awayScore: 1, status: "live", settled: false, minutes: 70, homeDifficulty: null, awayDifficulty: null,
} as Fixture;
const clubs = new Map<number, Club>([
  [14, { id: 14, code: 14, name: "Liverpool", shortName: "LIV" } as Club],
  [43, { id: 43, code: 43, name: "Man City", shortName: "MCI" } as Club],
]);
const haaland = {
  key: "65", scorer: "Haaland", minute: "65", kind: "goal", assister: "Doku", scorerMine: false, assisterMine: true,
} as const;

const render = (asOf: string | null) =>
  renderToStaticMarkup(
    createElement(Scores, {
      ties: [tie],
      scores,
      places: new Map(),
      clubPlaces: new Map(),
      mine: null,
      fixtures: [],
      day: null,
      clubs: new Map(),
      now: true,
      gameweek: 7,
      asOf,
      goals: new Map(),
    }),
  );

describe("Live's head-to-head scores", () => {
  it("says how old they are when a failed refresh kept the last good ones", () => {
    expect(render("15:47")).toContain("as of 15:47");
  });

  it("prints no time while they are current", () => {
    expect(render(null)).not.toContain("as of");
  });

  // Review M2: a tie on Live never said who still had men to play.
  it("says under each side how many of his men are still to play", () => {
    expect(render(null)).toMatch(/Atletico[\s\S]*2 to play[\s\S]*Hazza[\s\S]*all played/);
  });
});

describe("Live's Premier League scores", () => {
  it("names the scorer and the assister under the match, yours in the accent", () => {
    const html = renderToStaticMarkup(
      createElement(Scores, {
        ties: [], scores, places: new Map(), clubPlaces: new Map(), mine: null, fixtures: [fixture], day: null, clubs,
        now: true, gameweek: 7, asOf: null, goals: new Map([[58, { home: [], away: [haaland] }]]),
      }),
    );
    expect(html).toContain("Haaland");
    expect(html).toMatch(/As<\/span> <span class="text-accent">Doku/);
  });

  it("names the match day on show, with an arrow to the next and an inert one at the gameweek's start", () => {
    const day = { day: "2026-10-17", title: "Sat 17 Oct", previous: null, next: { href: "/matchday?day=2026-10-18", label: "Sun 18 Oct" } };
    const html = renderToStaticMarkup(
      createElement(Scores, {
        ties: [], scores, places: new Map(), clubPlaces: new Map(), mine: null, fixtures: [fixture], day, clubs,
        now: true, gameweek: 7, asOf: null, goals: new Map(),
      }),
    );
    expect(html).toContain('<nav aria-label="Match days"');
    expect(html).toContain("Sat 17 Oct");
    expect(html).toMatch(/href="\/matchday\?day=2026-10-18"[^>]*aria-label="Sun 18 Oct"|aria-label="Sun 18 Oct"[^>]*href="\/matchday\?day=2026-10-18"/);
    const nav = html.slice(html.indexOf("<nav"), html.indexOf("</nav>"));
    expect(nav.match(/<a /g)?.length).toBe(1);
  });
});
