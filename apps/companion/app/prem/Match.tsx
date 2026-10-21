import { type Club, type Fixture, kickoffAt, londonDayAndTime } from "@epl/core";
import type { ReactNode } from "react";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { SMALL_CAPS } from "@/app/desk";
import { yoursEdge } from "@/app/mine";
import { matchHref } from "./match/[id]/matchRoutes";
import { clubHref } from "./routes";
import { hasScore } from "./score";
import Yours, { YoursToggle } from "./Yours";

// One Premier League match as Championship Manager's results row (Craig, 5 Sep 2026).
// A count under a club's name opens `MatchList` under the row: Fixtures shows one round, so one read of its lines serves every row.

/** How many of the reader's men play for each side of a match. */
export interface SideCounts {
  home: number;
  away: number;
}

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
  /** His men on each side; undefined with no reader, so no edge is held. */
  yours?: SideCounts;
  /** Who did what, opened by a count; only a row with his men has one. */
  men?: ReactNode;
}) {
  const home = clubs.get(fixture.homeClubId);
  const away = clubs.get(fixture.awayClubId);
  const played = hasScore(fixture);
  const count = (n: number) => (n > 0 && men !== undefined ? <YoursToggle count={n} /> : undefined);

  const row = (
    <ScoreRow
      home={linked(home, places)}
      away={linked(away, places)}
      score={played ? { home: fixture.homeScore, away: fixture.awayScore } : null}
      // FPL leaves `kickoff_time` null until television picks the match; never guess a date (DESIGN §7).
      pending={kickoffAt(fixture.kickoff, londonDayAndTime)}
      clock={
        fixture.status === "finished" ? (
          <span className={`${SMALL_CAPS} text-faint`}>FT</span>
        ) : null
      }
      scoreHref={matchHref(fixture.id, "overview")}
      under={yours === undefined ? undefined : { home: count(yours.home), away: count(yours.away) }}
    />
  );
  if (yours === undefined) return row;

  // The accent edge on a match with his men, a clear one on the rest, so every name keeps its column; in the gutter under 390.
  const any = yours.home + yours.away > 0;
  return (
    <div className={`${yoursEdge(any)} max-[389px]:-ml-1`}>
      {any && men !== undefined ? <Yours row={row}>{men}</Yours> : row}
    </div>
  );
}

/** A side whose name leads to its club's page; an unknown club stays a plain dash. */
function linked(club: Club | undefined, places: Map<number, number>) {
  return club === undefined ? scoreSide(club, places) : { ...scoreSide(club, places), href: clubHref(club.code) };
}
