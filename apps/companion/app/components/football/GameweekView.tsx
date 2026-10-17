import Link from "@/app/components/shell/Link";
import ButtonLink from "../shell/ButtonLink";
import PageHeader from "../shell/PageHeader";
import {
  type FootballPlayer,
  type FootballSnapshot,
  type PlayerOwner,
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
      <PageHeader
        title={`Gameweek ${snapshot.gameweek}`}
        competition
        back={premFixturesHref(snapshot.gameweek)}
        sub={
          live ? (
            <span className="flex items-center gap-1.5 text-live">
              <span className="live-dot" />
              LIVE
            </span>
          ) : locksAt ? (
            `Line-ups lock ${londonDayAndTime(locksAt)}`
          ) : undefined
        }
      />

      <section className={PANEL}>
        <MatchList snapshot={snapshot} mine={mine} owners={owners} now={speaksForNow(snapshot)} />
        {/* Missing stats are said, or a scoreline with no scorers reads as nobody having done anything. */}
        <p className="text-center text-2xs text-faint">
          {snapshot.statsUnavailable ? "Scorers not available right now." : `Updated ${londonTime(snapshot.fetchedAt)}.`}
        </p>
      </section>

      <nav aria-label="Gameweeks" className="flex items-center justify-between gap-3 text-sm">
        <GameweekLink gameweek={previous} label="Previous" />
        <GameweekLink gameweek={next} label="Next" align="end" />
      </nav>

      <ButtonLink href={SQUAD}>Squads</ButtonLink>

    </div>
  );
}

/** A gameweek's link, or an inert placeholder at either end of the season so the other keeps its place. */
function GameweekLink({
  gameweek,
  label,
  align = "start",
}: {
  gameweek: number | null;
  label: string;
  align?: "start" | "end";
}) {
  const classes = `min-h-11 flex-1 px-3 py-2.5 lg:min-h-9 ${
    align === "end" ? "text-right" : ""
  }`;

  // A flat outline, not a plate: only a gameweek you can reach looks pressable.
  if (gameweek === null) {
    return (
      <span className={`${classes} border border-line text-faint opacity-40`}>{label}</span>
    );
  }

  // The bevel owns its ink, so no `text-*` here: `--muted` on the grey plate is 1.5:1.
  return (
    <Link
      href={gameweekHref(gameweek)}
      className={`cm-bevel ${classes} font-medium hover:brightness-110`}
    >
      {label}
      <span className="numeric"> · GW{gameweek}</span>
    </Link>
  );
}

