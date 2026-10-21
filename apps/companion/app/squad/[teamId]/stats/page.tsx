import TabEmpty from "../../../components/league/TabEmpty";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { getPlayerStats } from "../../../players/playerStats";
import { statsLeagueSeason } from "../../../statsLeague";
import StatBoard from "./StatBoard";
import { rosterFacts } from "./roster";
import { defconPricing } from "../../../defcon";
import { STATS_LEAGUE_KEYS } from "./statViews";
import { teamTitle } from "../title";

// Every man this manager owns and what each has done: the served league's counts off the Player Stats board's warm
// read, filtered on owner, and the stats league's beneath them. One figure of ours: DefCon points at his slot.

export const revalidate = 30;

export const generateMetadata = teamTitle("stats");

export default async function StatsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [{ team, squad }, all, statsLeague, pricing] = await Promise.all([
    leagueTeams(slug),
    getPlayerStats(),
    statsLeagueSeason(STATS_LEAGUE_KEYS),
    defconPricing(),
  ]);

  // `team.teamId` and not the slug, which on the front door is the word `me`.
  const his = all.filter((line) => line.ownerTeamId === team.teamId);
  const ids = new Set(his.map((line) => line.fantraxId));

  const { footballers, names, slots } = rosterFacts(squad.players);

  return (
    <TeamShell
      team={team}
      current="stats"
      empty={his.length === 0 ? ["stats"] : []}
    >
      {his.length === 0 ? (
        <TabEmpty>No stats yet.</TabEmpty>
      ) : (
        <StatBoard
          lines={his}
          footballers={footballers}
          names={names}
          served={[...new Set(all.flatMap((line) => Object.keys(line.stats)))]}
          statsLeague={Object.fromEntries(statsLeague.filter(([id]) => ids.has(id)))}
          statsColumns={[...new Set(statsLeague.flatMap(([, counts]) => Object.keys(counts)))]}
          defcon={pricing === null ? null : pricing(slots)}
        />
      )}
    </TeamShell>
  );
}

