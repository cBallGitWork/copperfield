import type { LeagueTeam } from "@epl/core";
import TabStrip from "../../../components/shell/TabStrip";
import { shortName } from "../../../teamNames";
import { STATS_OF, statsHref, type StatsOf } from "./views";

/** Stats' three sub-views, side A · side B · Fantasy, switched from the foot: its `FootFrame`'s `foot`. */
export default function StatsViews({
  teams,
  current,
  teamId,
  gameweek,
  vs,
}: {
  /** The URL's side, then his opponent. */
  teams: readonly [LeagueTeam, LeagueTeam];
  current: StatsOf;
  teamId: string;
  gameweek: number | undefined;
  vs: string | undefined;
}) {
  return (
    <TabStrip
      label="Stats views"
      current={current}
      tabs={STATS_OF.map((key) => {
        // Three tabs share 390, so a side goes by the league's short name.
        const team = teams[key === "team" ? 0 : 1];
        const label = key === "fantasy" ? "Fantasy" : shortName(team.teamId, team.name);
        return { key, label, href: statsHref(teamId, gameweek, key, undefined, vs) };
      })}
    />
  );
}
