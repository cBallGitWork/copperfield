import ButtonLink from "../shell/ButtonLink";
import PageHeader from "../shell/PageHeader";
import RoundHead from "../shell/RoundHead";
import {
  type FootballPlayer,
  type FootballSnapshot,
  type PlayerOwner,
  COMPETITION_NAME,
  adjacentGameweeks,
  isMatchdayLive,
  londonDayAndTime,
  londonTime,
} from "@epl/core";
import { speaksForNow } from "../../football";
import { gameweekHref } from "../shell/sections";
import MatchList from "./MatchList";
import { PANEL } from "@/app/desk";
import { SQUAD } from "../../squad/routes";
import { premFixturesHref } from "../../prem/routes";

// One gameweek of football: the /gw/[gameweek] page, framed as the Premiership's screens are (Craig, 16 Oct 2026).

export default function GameweekView({
  snapshot,
  mine,
  owners,
  locksAt,
}: {
  snapshot: FootballSnapshot;
  /** Which of the reader's players are in each fixture; absent with no league to ask. */
  mine?: Map<number, FootballPlayer[]>;
  /** Who holds each rostered footballer, independent of `mine`: a reader who owns nobody still reads them. */
  owners?: Map<number, PlayerOwner>;
  /** The league's lineup lock for this gameweek while it is ahead, as plain data; null or absent prints nothing. */
  locksAt?: string | null;
}) {
  // A match in play AND a copy fresh enough to say so: a cached snapshot keeps a fixture marked live.
  const live = isMatchdayLive(snapshot) && speaksForNow(snapshot);
  const { previous, next } = adjacentGameweeks(snapshot);
  return (
    <div className="flex flex-col gap-2">
      {/* The competition's plate, as Prem's screens wear it; the gameweek is the plate's below. */}
      <PageHeader title={COMPETITION_NAME} competition back={premFixturesHref(snapshot.gameweek)} />

      <RoundHead gameweek={snapshot.gameweek} step={{ previous, next, href: gameweekHref }}>
        {/* No `--color-live` on the light plate (1.39:1), as RoundHeader: the dot carries the colour. */}
        {live ? (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="live-dot" />
            LIVE
          </span>
        ) : locksAt ? (
          <span className="truncate">
            Line-ups lock <span className="numeric font-normal normal-case">{londonDayAndTime(locksAt)}</span>
          </span>
        ) : null}
      </RoundHead>

      <section className={PANEL}>
        <MatchList snapshot={snapshot} mine={mine} owners={owners} now={speaksForNow(snapshot)} />
        {/* Missing stats are said, or a scoreline with no scorers reads as nobody having done anything. */}
        <p className="text-center text-2xs text-faint">
          {snapshot.statsUnavailable ? "Scorers not available right now." : `Updated ${londonTime(snapshot.fetchedAt)}.`}
        </p>
      </section>

      <ButtonLink href={SQUAD}>Squads</ButtonLink>
    </div>
  );
}
