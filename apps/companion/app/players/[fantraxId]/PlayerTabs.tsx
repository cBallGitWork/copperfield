import TabStrip from "../../components/shell/TabStrip";
import { defaultRival } from "../analysis/rival";
import { getLeaguePool } from "../pool";
import { groupOf } from "./grid";
import { poolPoints } from "./poolPoints";
import { playerTabs } from "./tabs";
import type { PlayerTab } from "./tabs";

export { PLAYER_TAB_LABEL, type PlayerTab } from "./tabs";

export default async function PlayerTabs({
  fantraxId,
  current,
  empty = [],
}: {
  fantraxId: string;
  current: PlayerTab;
  /** Views with nothing behind them for this man: greyed and still a link, so no plate moves. */
  empty?: readonly PlayerTab[];
}) {
  // The cached pool every player screen keeps warm; silent or projected, Compare opens with him alone.
  const pool = await getLeaguePool();
  const points = poolPoints(pool);
  const rival = points === undefined || "unavailable" in pool ? undefined : defaultRival(pool.rows, fantraxId, points, groupOf);
  return (
    <TabStrip
      label="Player views"
      tabs={playerTabs(fantraxId, rival)}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
