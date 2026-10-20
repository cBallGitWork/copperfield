import TabEmpty from "../../../components/league/TabEmpty";
import { isResolved, playerName, type FootballPlayer } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import { getPlayerStats } from "../../../players/playerStats";
import { statsLeagueSeason } from "../../../statsLeague";
import StatBoard from "./StatBoard";
import { defconPricing } from "../../../defcon";
import { STATS_LEAGUE_KEYS } from "./statViews";
import { rosterOrder, squadTabOrder } from "./order";
import { getLeagueSquads, readableOr404, readerTeamId, teamDisplay } from "../../../squads";
import { planningRound } from "../../../round";
import { benchOrder } from "../../../benchOrders";
import { SQUAD } from "../../routes";
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
  const [{ team, squad }, squads, reader, all, statsLeague, pricing] = await Promise.all([
    leagueTeams(slug),
    planningRound().then(getLeagueSquads),
    readerTeamId(),
    getPlayerStats(),
    statsLeagueSeason(STATS_LEAGUE_KEYS),
    defconPricing(),
  ]);

  // Opens in the Squad tab's order, under its gate: a rival's eleven only once his lineups lock.
  const display = teamDisplay(readableOr404(squads, SQUAD), reader === team.teamId);
  const bench = display.show === "lineup" ? await benchOrder(team.teamId, display.period, false) : [];
  // `team.teamId` and not the slug, which on the front door is the word `me`.
  const his = rosterOrder(
    all.filter((line) => line.ownerTeamId === team.teamId),
    squadTabOrder(squad, display.show, bench),
  );
  const ids = new Set(his.map((line) => line.fantraxId));

  // The footballer behind each resolved slot, for his availability.
  const footballers: Record<string, FootballPlayer> = {};
  for (const rostered of squad.players) {
    if (isResolved(rostered)) footballers[rostered.slot.fantraxId] = rostered.player;
  }

  // The roster's spelling, by id: Fantrax's stat rows say "Schade, Kevin". And the slot each fills, which DefCon prices.
  const names: Record<string, string> = {};
  const slots: Record<string, string[]> = {};
  for (const rostered of squad.players) {
    names[rostered.slot.fantraxId] = playerName(rostered);
    slots[rostered.slot.fantraxId] = rostered.slot.position === null ? [] : [rostered.slot.position];
  }

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

