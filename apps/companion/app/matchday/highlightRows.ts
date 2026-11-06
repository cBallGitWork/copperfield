import { type Club, type Fixture, type HighlightVideo, highlightFor, onLondonDay } from "@epl/core";

// Live's highlights view: the day's finished matches, each with Sky's video where it has posted one.

/** A finished match and its video. */
export interface HighlightRow {
  fixture: Fixture;
  home: Club;
  away: Club;
  video: HighlightVideo;
}

/** The finished matches on `day` (every one when null): those with a video in kickoff order, and those still waiting. */
export function highlightRows(
  fixtures: readonly Fixture[],
  clubs: ReadonlyMap<number, Club>,
  videos: readonly HighlightVideo[],
  day: string | null,
): { rows: HighlightRow[]; waiting: { fixture: Fixture; home: Club; away: Club }[] } {
  const rows: HighlightRow[] = [];
  const waiting: { fixture: Fixture; home: Club; away: Club }[] = [];
  const finished = fixtures
    .filter((fixture) => fixture.status === "finished" && (day === null || onLondonDay(fixture.kickoff, day)))
    .sort((a, b) => Date.parse(a.kickoff ?? "") - Date.parse(b.kickoff ?? "") || a.id - b.id);
  for (const fixture of finished) {
    const home = clubs.get(fixture.homeClubId);
    const away = clubs.get(fixture.awayClubId);
    if (home === undefined || away === undefined) continue;
    // Both clubs and the score must agree, as on the match page: no video beats one on the wrong match.
    const video = highlightFor(videos, { home: home.name, away: away.name, homeScore: fixture.homeScore, awayScore: fixture.awayScore });
    if (video === null) waiting.push({ fixture, home, away });
    else rows.push({ fixture, home, away, video });
  }
  return { rows, waiting };
}
