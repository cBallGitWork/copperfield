import { clubStats } from "@epl/core";
import ScoutShell from "../Shell";
import { ClubsBoards } from "./TeamBoard";
import { sortedTeams, teamsView } from "./columns";
import { teamRows } from "./teamRows";
import { clubSeasons } from "./clubSeasons";
import { footballNow, seasonFixtures } from "../../football";
import { lastValue } from "../routes";
import { scoutTitle } from "../title";

// Data › Clubs: the twenty clubs' football, shots to cards (Craig, 30 Sep 2026: "this page should be more pure
// stats, chances created, shots etc, errors"). The Planner owns the fixtures.

export const revalidate = 30;

export const metadata = scoutTitle("teams");

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;
  const view = teamsView({ group: lastValue(asked.group), sort: lastValue(asked.sort), dir: lastValue(asked.dir) });

  const [seasons, fixtures, snapshot] = await Promise.all([clubSeasons(), seasonFixtures(), footballNow()]);
  const squads = new Map(clubStats(fixtures, snapshot.clubs, snapshot.players).map((club) => [club.clubId, club.squad]));
  const ordered = sortedTeams(teamRows(snapshot.clubs, seasons, squads), view.sort, view.descending);

  return (
    <ScoutShell current="teams">
      <ClubsBoards view={view} rows={ordered} />
    </ScoutShell>
  );
}
