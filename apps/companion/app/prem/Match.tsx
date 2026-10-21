import { type Club, type Fixture, kickoffAt, londonDayAndTime } from "@epl/core";
import type { ReactNode } from "react";
import ScoreRow from "../components/shell/ScoreRow";
import { scoreSide } from "../components/football/scoreSide";
import { SMALL_CAPS } from "@/app/desk";
import { yoursEdge } from "@/app/mine";
import { matchHref } from "./match/[id]/matchRoutes";
import { clubHref } from "./routes";
import { hasScore } from "./score";
import Yours from "./Yours";

// One Premier League match as Championship Manager's results row (Craig, 5 Sep 2026).
// Its count opens `MatchList` under the row: Fixtures shows one round, so one read of its lines serves every row.

/** Row and count side by side from 390; under it the count drops beneath the row, or the club codes go to 0px at 320. */
const PAIR = { pair: "flex flex-col min-[390px]:flex-row min-[390px]:items-stretch", row: "min-w-0 min-[390px]:flex-1" };

/** The count's column with room for its chevron, held on every row of a reader's round so the colons stay in line. */
const COUNT = "numeric flex min-[390px]:w-16 shrink-0 items-center justify-end pr-1.5 text-2xs font-semibold text-accent";

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
    />
  );
  if (yours === undefined) return row;

  // The accent edge on a match with his men, a clear one on the rest, so every row keeps the column; in the gutter under 390.
  return (
    <div className={`${yoursEdge(yours > 0)} max-[389px]:-ml-1`}>
      {yours > 0 && men !== undefined ? (
        <Yours row={row} count={yours} layout={PAIR} className={COUNT}>
          {men}
        </Yours>
      ) : (
        <div className={PAIR.pair}>
          <div className={PAIR.row}>{row}</div>
          <span className={yours > 0 ? COUNT : `${COUNT} max-[389px]:hidden`}>{yours > 0 ? `${yours} yours` : null}</span>
        </div>
      )}
    </div>
  );
}

/** A side whose name leads to its club's page; an unknown club stays a plain dash. */
function linked(club: Club | undefined, places: Map<number, number>) {
  return club === undefined ? scoreSide(club, places) : { ...scoreSide(club, places), href: clubHref(club.code) };
}
