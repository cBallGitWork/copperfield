import type { Tab } from "../../components/shell/TabStrip";
import { playerCompareHref, playerDataHref, playerHref, playerNewsHref } from "../routes";

// The views of one player, all inside his shell: Profile, Data (his record, a season at a time), News, and Compare
// (him against his last season or a rival).

export type PlayerTab = "profile" | "data" | "news" | "compare";

/** Each view's word, on its tab and in its title. */
export const PLAYER_TAB_LABEL: Record<PlayerTab, string> = { profile: "Profile", data: "Data", news: "News", compare: "Compare" };

/** His strip's plates. */
export function playerTabs(fantraxId: string): readonly (Tab & { key: PlayerTab })[] {
  return [
    { key: "profile", href: playerHref(fantraxId), label: PLAYER_TAB_LABEL.profile },
    { key: "data", href: playerDataHref(fantraxId), label: PLAYER_TAB_LABEL.data },
    { key: "news", href: playerNewsHref(fantraxId), label: PLAYER_TAB_LABEL.news },
    { key: "compare", href: playerCompareHref(fantraxId), label: PLAYER_TAB_LABEL.compare },
  ];
}
