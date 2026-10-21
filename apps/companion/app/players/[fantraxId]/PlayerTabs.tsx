import TabStrip from "../../components/shell/TabStrip";
import { playerTabs } from "./tabs";
import type { PlayerTab } from "./tabs";

export { PLAYER_TAB_LABEL, type PlayerTab } from "./tabs";

export default function PlayerTabs({
  fantraxId,
  current,
  empty = [],
}: {
  fantraxId: string;
  current: PlayerTab;
  /** Views with nothing behind them for this man: greyed and still a link, so no plate moves. */
  empty?: readonly PlayerTab[];
}) {
  return (
    <TabStrip
      label="Player views"
      tabs={playerTabs(fantraxId)}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
