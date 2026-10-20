import {
  type Deadline,
  type Deal,
  type FootballSnapshot,
  type PublishedStory,
  type Story,
  type LeagueInfo,
  type RosteredTeam,
  type LeagueTeam,
  type TeamOfTheWeek,
  deals,
  composePaper,
  nextDeadline,
  stories,
  teamOfTheWeek,
  wasFielded,
  weekOfBusiness,
  withReportFace,
} from "@epl/core";
import { now } from "./clock";
import { readBoard } from "./board";
import { readDeals } from "./business";
import { periodPoints } from "./scoreboard";
import { seasonKickoffs } from "./football";
import { filed } from "./paper";
import { type LeagueSquads, getLeagueSquads, readable } from "./squads";

// What today's paper is made of: core's builders decide what is true, this decides what runs. No live scores: those are the
// Live tab's (Craig, 11 Oct 2026), so the head-to-head board is read only once the gameweek is over, for the desk's stories.

/** Why the paper has nothing to print: three different sentences, so never one flag. */
export type Silence =
  | { kind: "unavailable"; code: string }
  | { kind: "undrafted"; code: string }
  | { kind: "quiet" };

export interface Edition {
  /** Null when there is something to print. */
  silence: Silence | null;
  snapshot: FootballSnapshot | null;
  /** The season's deals: the desk's stories pick their own week, and silence counts them all. */
  deals: Deal[];
  /** The sidebar's week: the newest period that has deals, plus any Fantrax gave no period. */
  business: Deal[];
  deadline: Deadline | null;
  teams: LeagueTeam[];
  /** Null until somebody has actually played. */
  eleven: TeamOfTheWeek | null;
  /** Football still to come this gameweek: the eleven says "so far" and the desk's own stories wait. */
  partial: boolean;
  /** The lineup on hand is the one fielded (Fantrax rolls its period forward early); false withholds who STARTED. */
  fielded: boolean;
  /** The rolling paper in print order; `composePaper` owns expiry, supersession and order. */
  filed: PublishedStory[];
  /** The desk's own stories for the week, strongest first; empty most of the week. */
  stories: Story[];
  /** The reader's own team, when they have signed in. */
  mine: string | null;
}

export async function edition(mine: string | null): Promise<Edition> {
  const [squads, feed, kickoffs] = await Promise.all([
    getLeagueSquads(),
    readDeals(),
    seasonKickoffs(),
  ]);
  const drafted = readable(squads);
  const at = now().toISOString();

  // Any dated fixture still to finish; an undated one cannot hold a gameweek open.
  const partial =
    drafted?.snapshot.fixtures.some(
      (fixture) => fixture.kickoff !== null && fixture.status !== "finished",
    ) ?? false;
  const fielded = drafted !== null && wasFielded(drafted.period, drafted.roundPeriod);

  /** The period the paper is about, and the only one anything here may ask for. */
  const roundPeriod = drafted?.roundPeriod ?? null;

  const business = deals(feed.rows);
  const picked = eleven(drafted, roundPeriod === null ? new Map() : await periodPoints(roundPeriod));
  // The desk's own stories carry no dateline, so they wait for the gameweek to finish, and so does their read.
  const board = drafted === null || partial ? null : await readBoard(drafted);
  const told = board === null ? [] : stories(board.pairings, board.scores, fielded ? picked : null, business, roundPeriod);

  const paper = {
    snapshot: drafted?.snapshot ?? null,
    deals: business,
    business: weekOfBusiness(business),
    deadline: drafted?.info ? nextDeadline(drafted.info.rosterPeriods, kickoffs, at) : null,
    teams: drafted?.info?.teams ?? [],
    eleven: picked,
    partial,
    fielded,
    stories: told,
    // Composed here because the clock is the app edge's to read.
    // A Prem Report filed before its picture was stored is pictured here, from its headline.
    filed: composePaper(drafted ? filed.map((story) => withReportFace(story, drafted.snapshot)) : filed, at),
    mine,
  };

  return { ...paper, silence: silenceOf(squads, paper) };
}

/** What the paper is short of, only when there is nothing at all to print; a quiet week is not an outage. */
function silenceOf(squads: LeagueSquads, paper: Omit<Edition, "silence">): Silence | null {
  const empty =
    paper.eleven === null &&
    paper.deals.length === 0 &&
    paper.deadline === null &&
    paper.filed.length === 0;
  if (!empty) return null;

  if ("unavailable" in squads) return { kind: "unavailable", code: squads.unavailable };
  if ("undrafted" in squads) return { kind: "undrafted", code: squads.undrafted };
  return { kind: "quiet" };
}

/** The week's eleven, or null before anybody has played. */
function eleven(
  drafted: { period: { teams: RosteredTeam[] }; info: LeagueInfo | null } | null,
  points: ReadonlyMap<string, number>,
) {
  if (!drafted?.info) return null;
  const picked = teamOfTheWeek(drafted.period.teams, drafted.info.roster, points);
  return picked.picks.length === 0 ? null : picked;
}

