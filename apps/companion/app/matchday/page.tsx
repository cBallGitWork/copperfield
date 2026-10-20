import {
  type Fixture,
  type FootballSnapshot,
  FANTRAX_MATCHUPS_PATH,
  MS_PER_MINUTE,
  datedKickoffs,
  fixturesInOrder,
  nextRound,
  roundState,
  londonTime,
  nextDeadline,
} from "@epl/core";
import type { ReactNode } from "react";
import { footballNow, liveOpen, roundFigures, seasonFixtures } from "../football";
import RoundWord from "../components/league/RoundWord";
import PageHeader from "../components/shell/PageHeader";
import TabStrip from "../components/shell/TabStrip";
import { getLeagueSquads, readable, readerTeamId } from "../squads";
import TopStats, { STATS_VIEW, TOP_STATS, statsHref } from "./TopStats";
import { gameweekBoards } from "./boards";
import LiveScores from "./LiveScores";
import { lockAhead } from "../lockAhead";
import { now } from "../clock";
import { BetweenGameweeks } from "./Between";
import OutLink from "../components/shell/OutLink";
import { fantraxPage } from "../fantraxPages";
import Link from "@/app/components/shell/Link";
import { LIVE } from "../components/shell/sections";
import { MY_TEAM } from "../squad/routes";
import type { Metadata } from "next";
import { orDegraded } from "../refusals";
import { draftGameweek, titled } from "../titles";

// The live centre: your head-to-head first, the real football under it. The football half runs
// off FPL's public API alone, so it works with no Fantrax, no draft and no credential.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

/** The bar's words, off the page's own cached snapshot; the league's name alone when FPL could not be asked. */
export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await orDegraded(footballNow(), () => null);
  return snapshot === null ? {} : titled(draftGameweek(snapshot.gameweek));
}

/** The snapshot and whether there is football on; the clock is read here so a render reproduces. */
async function matchday(): Promise<{
  snapshot: FootballSnapshot;
  /** The whole season's fixtures, kept because the real table is built from them. */
  season: Fixture[];
  during: boolean;
  up: { gameweek: number; kickoff: string } | null;
}> {
  // The season, because the snapshot holds one round and cannot name the next.
  const [snapshot, season] = await Promise.all([footballNow(), seasonFixtures()]);
  return { snapshot, season, during: liveOpen(snapshot), up: nextRound(season, now().toISOString()) };
}

export default async function MatchdayPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stat?: string; day?: string }>;
}) {
  // Scores is the landing view (Craig, 21 Sep 2026); the top stats are a tap away.
  const query = await searchParams;
  const leading = query.view === STATS_VIEW;
  const [{ snapshot, season, during, up }, mine, squads] = await Promise.all([matchday(), readerTeamId(), getLeagueSquads()]);
  const drafted = readable(squads);
  const period = drafted?.roundPeriod ?? null;

  // The hour before the first kickoff (Craig, 8 Oct 2026: "build the hype"): the minutes to go, and the lock if ahead.
  const first = fixturesInOrder(snapshot).find((fixture) => fixture.kickoff !== null)?.kickoff ?? null;
  const toGo = during && first !== null ? Date.parse(first) - now().getTime() : 0;
  const lock = drafted?.info == null ? null : nextDeadline(drafted.info.rosterPeriods, datedKickoffs(season), now().toISOString());
  const locksAt = lock !== null && first !== null && Date.parse(lock.locksAt) < Date.parse(first) ? lock.locksAt : null;
  const buildUp = toGo > 0 ? <BuildUp ms={toGo} locksAt={locksAt} /> : null;
  const state = roundState(snapshot, now().toISOString());

  // Each view asks only for its own reads: the gameweek's leaders, the scores, or the coming lock between gameweeks.
  let view: ReactNode;
  if (leading) {
    const top = await gameweekBoards(snapshot, await roundFigures(snapshot.gameweek), period);
    view = <TopStats boards={top.boards} stat={query.stat} teamNames={top.teamNames} reader={mine} />;
  } else if (during) {
    view = <LiveScores snapshot={snapshot} season={season} drafted={drafted} mine={mine} day={query.day} />;
  } else {
    view = <BetweenGameweeks snapshot={snapshot} up={up} locksAt={up === null ? null : await lockAhead(up.gameweek)} />;
  }

  // Between gameweeks the route still answers, saying where the football went.
  return (
    <div className="flex flex-col gap-4">
      {/* The round and its state are the page's title (Craig, 5 Sep 2026: "gameweek 3 LIVE as the
          title"); the sub line carries "Full time" or "Final", never LIVE twice. */}
      <PageHeader
        title={`${draftGameweek(snapshot.gameweek)}${state === "live" ? " LIVE" : ""}`}
        sub={buildUp ?? (state === null || state === "live" ? undefined : <RoundWord state={state} />)}
        competition
      />
      <TabStrip
        label="Which view"
        tabs={[
          { key: "scores", label: "Scores", href: LIVE },
          { key: STATS_VIEW, label: TOP_STATS, href: statsHref() },
        ]}
        current={leading ? STATS_VIEW : "scores"}
      />
      {view}
      {/* Fantrax's Matchups for this gameweek's period; its current one when we could not read it. */}
      <OutLink href={fantraxPage(FANTRAX_MATCHUPS_PATH, period)}>
        Matchups on Fantrax
      </OutLink>
    </div>
  );
}

/** The build-up's line: whole minutes to the first kickoff, rounded up, then the lineup lock while it is ahead, as a
 *  way to his team, whose tab Live has taken on a phone. */
function BuildUp({ ms, locksAt }: { ms: number; locksAt: string | null }) {
  const kickoff = `Kick-off in ${Math.ceil(ms / MS_PER_MINUTE)} min`;
  if (locksAt === null) return kickoff;
  // One span: the sub line is a flex row, which drops the space between bare text and a link.
  return (
    <span>
      {kickoff} ·{" "}
      <Link href={MY_TEAM} className="underline">
        line-ups lock {londonTime(locksAt)}
      </Link>
    </span>
  );
}
