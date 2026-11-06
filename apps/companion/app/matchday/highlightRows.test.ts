import { describe, expect, it } from "vitest";
import type { Club, Fixture, HighlightVideo } from "@epl/core";
import { highlightRows } from "./highlightRows";

const club = (id: number, name: string) => ({ id, code: id, name, shortName: name.slice(0, 3).toUpperCase() }) as Club;
const clubs = new Map([club(1, "Arsenal"), club(2, "Hull City"), club(3, "Brighton"), club(4, "Brentford"), club(5, "Man City"), club(6, "Spurs")].map((c) => [c.id, c]));
const fixture = (id: number, home: number, away: number, kickoff: string, status: Fixture["status"], score: [number, number] | null) =>
  ({ id, code: id, gameweek: 10, homeClubId: home, awayClubId: away, kickoff, status, homeScore: score?.[0] ?? null, awayScore: score?.[1] ?? null }) as Fixture;
const video = (id: string, home: string, away: string, homeScore: number, awayScore: number): HighlightVideo =>
  ({ id, title: `${home} ${homeScore}-${awayScore} ${away}`, home, away, homeScore, awayScore });

const SAT = "2026-11-07";
const fixtures = [
  fixture(3, 5, 6, "2026-11-07T17:30:00Z", "finished", [1, 0]),
  fixture(1, 1, 2, "2026-11-07T15:00:00Z", "finished", [2, 1]),
  fixture(2, 3, 4, "2026-11-07T12:30:00Z", "finished", [0, 0]),
  fixture(4, 2, 1, "2026-11-08T14:00:00Z", "live", [0, 0]),
];
const videos = [video("a", "Arsenal", "Hull City", 2, 1), video("b", "Brighton", "Brentford", 0, 0), video("x", "Arsenal", "Hull City", 1, 1)];

describe("highlightRows", () => {
  it("lists the day's finished matches with a video in kickoff order, and keeps those Sky has not posted apart", () => {
    const { rows, waiting } = highlightRows(fixtures, clubs, videos, SAT);
    expect(rows.map((row) => row.video.id)).toEqual(["b", "a"]);
    expect(waiting.map((each) => each.fixture.id)).toEqual([3]);
  });

  it("never shows a match that is still being played, nor a video whose score disagrees", () => {
    const { rows, waiting } = highlightRows(fixtures, clubs, videos, "2026-11-08");
    expect(rows).toEqual([]);
    expect(waiting).toEqual([]);
  });

  it("reads the whole gameweek when no day is given", () => {
    expect(highlightRows(fixtures, clubs, videos, null).rows).toHaveLength(2);
  });
});
