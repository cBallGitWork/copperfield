import TabEmpty from "../../../components/league/TabEmpty";
import { type CompetitionTie, seasonOrder } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import Season from "../../../league/schedule/Season";
import { getSchedule, getSeasonResults, type ScheduleRound } from "../../../league/schedule/schedule";
import { seasonRows } from "../../../league/schedule/teamSeason";
import { roundTies } from "../../../league/fixtures/roundTies";
import { cupsDecided } from "../../../league/cups/standing";
import { PANEL } from "@/app/desk";
import { UNAVAILABLE } from "../../../config";
import { teamTitle } from "../title";

// Every gameweek this side plays, the next first, then the rest to come, then the played, newest first: the only
// view of one team's whole season, its cup ties among them once the draw names it (seeds, then settled ties).

export const revalidate = 30;

export const generateMetadata = teamTitle("fixtures");

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [{ team }, read] = await Promise.all([leagueTeams(slug), getSchedule()]);
  // The id the slug resolved to: `me` is a front door and not a team.
  const teamId = team.teamId;

  if ("unavailable" in read) {
    return (
      <TeamShell team={team} current="fixtures" empty={["fixtures"]}>
        <TabEmpty>{UNAVAILABLE}</TabEmpty>
      </TeamShell>
    );
  }

  const { info } = read;
  // Finished gameweeks included, unlike the schedule screen, which hands them to Results.
  const decided = await cupsDecided();
  const tiesIn = (at: ScheduleRound): CompetitionTie[] => roundTies(info, at, decided);

  const rows = seasonRows(read.rounds, tiesIn, await getSeasonResults(), teamId);

  return (
    <TeamShell
      team={team}
      current="fixtures"
      empty={rows.length === 0 ? ["fixtures"] : []}
    >
      <section className={PANEL}>
        {rows.length === 0 ? (
          <p className="px-1 py-6 text-center text-2xs text-muted">No fixtures.</p>
        ) : (
          <Season
            // A gameweek under way is still to come; `seasonRows` is in gameweek order already.
            order={seasonOrder(rows, (row) => row.round.status === "finished", (a, b) => a.round.gameweek - b.round.gameweek)}
            teamId={teamId}
          />
        )}
      </section>
    </TeamShell>
  );
}
