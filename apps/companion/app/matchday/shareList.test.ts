import { describe, expect, it } from "vitest";
import { CUPS, LEAGUE_COMPETITION, LEAGUE_NAME, type CompetitionTie, type LiveTeamScore } from "@epl/core";
import { SHARE_LAYOUT, shareHeight, shareList, shareStamp } from "./shareList";

// The picture Craig sends the group in place of a screenshot of Live's league list (19 Oct 2026).

function tie(home: string, away: string, competition = LEAGUE_COMPETITION, round: string | null = null): CompetitionTie {
  return {
    competition,
    round,
    code: null,
    home: { label: home, team: { teamId: home, name: home } },
    away: { label: away, team: { teamId: away, name: away } },
  } as unknown as CompetitionTie;
}

const score = (teamId: string, points: number | null, toPlay: number | null): [string, LiveTeamScore] => [
  teamId,
  { teamId, points, toPlay },
];

const TIES = [tie("glen", "ohi"), tie("bannan", "racc")];
const SCORES = new Map([score("glen", 30, 0), score("ohi", 0, 2), score("bannan", 43, null)]);
const PLACES = new Map([["glen", "9th"], ["ohi", "5th"], ["bannan", "7th"], ["racc", "4th"]]);
const SATURDAY = "2026-10-17T14:52:00Z";

describe("shareList", () => {
  const list = shareList({ ties: TIES, scores: SCORES, places: PLACES, gameweek: 7, state: "live", takenAt: SATURDAY });

  it("names the gameweek and the London time the scores were read", () => {
    expect(list.title).toBe("Draft Gameweek 7");
    expect(list.stamp).toBe("as of 15:52");
  });

  it("keeps the league's order under the league's name", () => {
    expect(list.groups.map((group) => group.title)).toEqual([LEAGUE_NAME]);
    expect(list.groups[0].rows.map((row) => `${row.home.name}-${row.away.name}`)).toEqual(["glen-ohi", "bannan-racc"]);
  });

  it("prints places, a nought, the dash for a total not given, and the men still to play", () => {
    const [first, second] = list.groups[0].rows;
    expect(first).toEqual({
      home: { name: "glen", place: "9th", left: "all played" },
      away: { name: "ohi", place: "5th", left: "2 to play" },
      score: { home: 30, away: 0 },
    });
    expect(second.score).toEqual({ home: 43, away: null });
    expect(second.home.left).toBeNull();
  });

  it("gives a cup its own block, headed with its round, and grows the picture to hold it", () => {
    const [cup] = CUPS;
    const withCup = shareList({
      ties: [...TIES, tie("glen", "racc", cup, "Semi-final")],
      scores: SCORES,
      places: PLACES,
      gameweek: 7,
      state: "live",
      takenAt: SATURDAY,
    });
    expect(withCup.groups.map((group) => group.title)).toEqual([LEAGUE_NAME, `${cup.name} · Semi-final`]);
    expect(withCup.size.height - list.size.height).toBe(SHARE_LAYOUT.gap + SHARE_LAYOUT.groupHead + SHARE_LAYOUT.row + SHARE_LAYOUT.groupFoot);
  });

  it("is the desk's width, and as tall as its rows", () => {
    const { pad, title, stamp, gap, groupHead, groupFoot, row } = SHARE_LAYOUT;
    expect(list.size).toEqual({ width: SHARE_LAYOUT.width, height: pad + title + stamp + gap + groupHead + 2 * row + groupFoot + pad });
    expect(shareHeight([])).toBe(pad + title + stamp + pad);
  });
});

describe("shareStamp", () => {
  it("says the time while the scores can move, and when they have stopped", () => {
    expect(shareStamp(null, SATURDAY)).toBe("as of 15:52");
    expect(shareStamp("live", SATURDAY)).toBe("as of 15:52");
    expect(shareStamp("bonus-settling", SATURDAY)).toBe("Full time");
    expect(shareStamp("provisional", SATURDAY)).toBe("Full time");
    expect(shareStamp("final", SATURDAY)).toBe("Final");
  });
});
