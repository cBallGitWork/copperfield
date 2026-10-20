import { type Club, type Fixture, kickoffAt } from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import MatchClock from "../components/football/MatchClock";
import { scoreSide } from "../components/football/scoreSide";
import { matchHref } from "../prem/match/[id]/matchRoutes";
import { hasScore } from "../prem/score";

/** One Premier League match as a Championship Manager results row, linking to its match page by
 *  the per-season id `/prem/match/[id]` takes. */
export default function FootballRow({
  fixture,
  clubs,
  places,
  now,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Each club's place in the real table, by club id; empty before a ball is kicked, not twenty sides in 1st. */
  places: Map<number, number>;
  /** Whether the snapshot is fresh enough to speak in the present tense. */
  now: boolean;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = hasScore(fixture);

  return (
    <ScoreRow
      home={scoreSide(home, places)}
      away={scoreSide(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      pending={kickoffAt(fixture.kickoff)}
      // Right of the figures (Craig, 5 Sep 2026); `--color-live` means a match in play and nothing else (DESIGN §3).
      // A stale snapshot keeps no minute: it would be speaking in the present tense.
      clock={fixture.status === "live" && !now ? null : <MatchClock fixture={fixture} />}
      href={matchHref(fixture.id, "overview")}
    />
  );
}
