import { type Club, type Fixture, kickoffAt, londonDayAndTime } from "@epl/core";
import type { ReactNode } from "react";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { SMALL_CAPS } from "@/app/desk";
import { yoursEdge } from "@/app/mine";
import { matchHref } from "./match/[id]/matchRoutes";
import { hasScore } from "./score";
import Yours from "./Yours";

// One Premier League match as Championship Manager's results row (Craig, 5 Sep 2026).
// Its count opens `MatchList` under the row: Fixtures shows one round, so one read of its lines serves every row.

/** The count's column, held on every row of a reader's round so the colons stay in line. */
const COUNT = "numeric flex w-12 shrink-0 items-center justify-end pr-1.5 text-2xs font-semibold text-accent";

export default function Match({
  fixture,
  clubs,
  places,
  yours,
  men,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** Each club's place, by club id (CM's blue block); empty before a ball is kicked. */
  places: Map<number, number>;
  /** How many of the reader's men are in it; undefined with no reader, so no column is held. */
  yours?: number;
  /** Who did what, opened by the count; only a row with his men has one. */
  men?: ReactNode;
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

  // The accent edge on a match with his men, a clear one on the rest, so every row keeps the column.
  return (
    <div className={yoursEdge(yours > 0)}>
      {yours > 0 && men !== undefined ? (
        <Yours row={row} count={yours} className={COUNT}>
          {men}
        </Yours>
      ) : (
        <div className="flex items-stretch">
          <div className="min-w-0 flex-1">{row}</div>
          <span className={COUNT}>{yours > 0 ? `${yours} yours` : null}</span>
        </div>
      )}
    </div>
  );
}
