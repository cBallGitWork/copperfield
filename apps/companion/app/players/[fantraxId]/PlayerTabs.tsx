import TabStrip from "../../components/shell/TabStrip";
import type { Tab } from "../../components/shell/TabStrip";
import { playerDataHref, playerHref, playerNewsHref } from "../routes";

// The four views of one player: Profile, Data (his record, a season at a time), News and Transfer.

export type PlayerTab = "profile" | "data" | "news" | "transfer";

/** Each view's word, on its tab and in its title. */
export const PLAYER_TAB_LABEL: Record<PlayerTab, string> = { profile: "Profile", data: "Data", news: "News", transfer: "Transfer" };

const TABS = (fantraxId: string): readonly (Tab & { key: PlayerTab })[] => [
  { key: "profile", href: playerHref(fantraxId), label: PLAYER_TAB_LABEL.profile },
  { key: "data", href: playerDataHref(fantraxId), label: PLAYER_TAB_LABEL.data },
  { key: "news", href: playerNewsHref(fantraxId), label: PLAYER_TAB_LABEL.news },
  { key: "transfer", href: `${playerHref(fantraxId)}/transfer`, label: PLAYER_TAB_LABEL.transfer },
];

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
      tabs={TABS(fantraxId)}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
