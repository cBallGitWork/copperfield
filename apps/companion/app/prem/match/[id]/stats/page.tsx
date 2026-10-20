import { londonDayOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import TabStrip from "../../../../components/shell/TabStrip";
import MatchShell from "../Shell";
import MatchStats from "../MatchStats";
import ClubStats from "../ClubStats";
import Fantasy from "../Fantasy";
import { readMatch } from "../match";
import { sheetReads } from "../sheetReads";
import type { Match } from "../match";
import { DEFAULT_SORT, isStatSort } from "../statColumns";
import { statsView, viewHref, type StatsView } from "../statsSort";
import { matchStatsBoard } from "../../../../matchFeed";
import { teamSheets } from "../../../../matchDetail";
import { leagueScoring } from "../../../../scoring";
import { scoringDay } from "../../../../scoringDay";
import { matchTitle } from "../title";
import { beforeKickOff } from "../matchState";

// Both sides against each other, one club's men, or the Fantasy Report — CM 01/02's Match Stats with its foot row.

export const revalidate = 30;

export const generateMetadata = matchTitle("stats");

export default async function MatchStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; sort?: string; dir?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const view = statsView(query.view);
  const match = await readMatch(id);

  return (
    <MatchShell match={match} current="stats" foot={<Foot match={match} view={view} />}>
      {view === "match" ? (
        <BothSides match={match} />
      ) : view === "fantasy" ? (
        <FantasyReport match={match} />
      ) : (
        <OneClub
          match={match}
          side={view}
          sort={isStatSort(query.sort) ? query.sort : DEFAULT_SORT}
          descending={query.dir !== "asc"}
        />
      )}
    </MatchShell>
  );
}

/** `Brentford · Match · Chelsea` the way `cm0102/02.jpg` puts a club's stats either side of the match, then Fantasy.
 *  Club codes under a thumb, as `ClubLabel` picks, so no plate wraps; full names from lg. */
function Foot({ match, view }: { match: Match; view: StatsView }) {
  const id = match.fixture.id;
  const strip = (home: string | undefined, away: string | undefined, labels: "phrase" | "word") => (
    <TabStrip
      label="Stats views"
      tabs={[
        { key: "home", label: home ?? "Home", href: viewHref(id, "home") },
        { key: "match", label: "Match", href: viewHref(id, "match") },
        { key: "away", label: away ?? "Away", href: viewHref(id, "away") },
        { key: "fantasy", label: "Fantasy", href: viewHref(id, "fantasy") },
      ]}
      current={view}
      labels={labels}
    />
  );
  return (
    <>
      <div className="lg:hidden">{strip(match.home?.shortName, match.away?.shortName, "word")}</div>
      <div className="max-lg:hidden">{strip(match.home?.name, match.away?.name, "phrase")}</div>
    </>
  );
}

/** What the match meant in our league's categories, a page of its own (Craig, 23 Sep 2026), counted by the real league. */
async function FantasyReport({ match }: { match: Match }) {
  const day = londonDayOf(match.fixture.kickoff);
  const [sheets, scoring, counts] = await Promise.all([
    teamSheets(match.fixture.gameweek, match.fixture.code, match.snapshot.players),
    leagueScoring(),
    day === null ? null : scoringDay(day),
  ]);
  return sheets === null ? <NoSheet match={match} /> : <Fantasy match={match} sheets={sheets} scoring={scoring} day={counts} />;
}

async function OneClub({
  match,
  side,
  sort,
  descending,
}: {
  match: Match;
  side: "home" | "away";
  sort: Parameters<typeof ClubStats>[0]["sort"];
  descending: boolean;
}) {
  const { sheets, events, injured, league, cards } = await sheetReads(match);
  if (sheets === null) return <NoSheet match={match} />;
  return (
    <ClubStats
      match={match}
      side={side}
      club={side === "home" ? match.home : match.away}
      sheet={sheets[side]}
      events={events}
      injured={injured}
      league={league}
      cards={cards}
      sort={sort}
      descending={descending}
    />
  );
}

/** Both sides against each other; where they shot from is on Action Zones. */
async function BothSides({ match }: { match: Match }) {
  const rows = await matchStatsBoard(match.fixture.gameweek, match.fixture.code);
  if (rows === null || rows.length === 0) return <TabEmpty>{beforeKickOff(match) ?? "No stats yet"}</TabEmpty>;
  return <MatchStats rows={rows} home={match.home} away={match.away} />;
}

/** A club's board and the Fantasy Report both read the team sheet, which a match has only once its sides are named. */
function NoSheet({ match }: { match: Match }) {
  return <TabEmpty>{beforeKickOff(match) ?? "No team sheet yet"}</TabEmpty>;
}
