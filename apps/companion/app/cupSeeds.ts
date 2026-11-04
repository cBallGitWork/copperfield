import type { CupSeeds, LeagueTeam } from "@epl/core";
import file from "../../../data/leagues/cup-seeds.json";

// Each seeded cup's entrants, off `data/leagues/cup-seeds.json`; `seed` and `how` in the file are for the reader only.

/** The league's own teams in each cup's seed order. A cup whose list names a team the league lacks stays unseeded. */
export function cupSeeds(teams: readonly LeagueTeam[]): CupSeeds {
  const byId = new Map(teams.map((team) => [team.teamId, team]));
  return Object.fromEntries(
    file.seeds.flatMap((cup) => {
      const seeded = cup.teams.map((entry) => byId.get(entry.teamId));
      return seeded.every((team): team is LeagueTeam => team !== undefined) ? [[cup.cup, seeded]] : [];
    }),
  );
}
