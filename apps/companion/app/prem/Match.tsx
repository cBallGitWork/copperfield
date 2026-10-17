import { type Club, type Fixture, kickoffAt, londonDayAndTime } from "@epl/core";
import Link from "../components/shell/Link";
import ScoreRow from "../components/shell/ScoreRow";
import { gameweekHref } from "../components/shell/sections";
import { scoreSide } from "../components/football/scoreSide";
import { SMALL_CAPS } from "@/app/desk";
import { matchHref } from "./match/[id]/matchRoutes";
import { hasScore } from "./score";

// One Premier League match as Championship Manager's results row (Craig, 5 Sep 2026).
// Not `MatchList`: that expands off per-player stats only the round in view carries.

/** The count's column, held on every row of a reader's round so the colons stay in line. */
const COUNT = "numeric flex w-12 shrink-0 items-center justify-end pr-1.5 text-2xs font-semibold text-accent";

export default function Match({
  fixture,
  clubs,
  places,
  yours,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Each club's place, by club id (CM's blue block); empty before a ball is kicked. */
  places: Map<number, number>;
  /** How many of the reader's men are in it; undefined with no reader, so no column is held. */
  yours?: number;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = hasScore(fixture);

  const row = (
    <ScoreRow
      home={scoreSide(home, places)}
      away={scoreSide(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      // FPL leaves `kickoff_time` null until television picks the match; never guess a date (DESIGN §7).
      pending={kickoffAt(fixture.kickoff, londonDayAndTime)}
      clock={
        fixture.status === "finished" ? (
          <span className={`${SMALL_CAPS} text-faint`}>FT</span>
        ) : null
      }
      href={matchHref(fixture.id, "overview")}
    />
  );
  if (yours === undefined) return row;

  return (
    <div className="flex items-stretch">
      <div className="min-w-0 flex-1">{row}</div>
      {/* Counted, as the gameweek's own page counts them, and a tap to that page, which names them. */}
      {yours === 0 || fixture.gameweek === null ? (
        <span className={COUNT} />
      ) : (
        <Link href={gameweekHref(fixture.gameweek)} className={`cm-row ${COUNT} hover:brightness-110`}>
          {yours} yours
        </Link>
      )}
    </div>
  );
}
