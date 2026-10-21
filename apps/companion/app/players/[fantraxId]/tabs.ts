import type { Tab } from "../../components/shell/TabStrip";
import { compareHref, playerDataHref, playerHref, playerNewsHref } from "../routes";

// The views of one player: Profile, Data (his record, a season at a time), News and Transfer inside his shell, and
// Compare, which leaves it for the one Compare page with him as A.

export type PlayerTab = "profile" | "data" | "news" | "transfer";

/** Each view's word, on its tab and in its title. */
export const PLAYER_TAB_LABEL: Record<PlayerTab, string> = { profile: "Profile", data: "Data", news: "News", transfer: "Transfer" };

/** His strip's plates; Compare opens beside `rival` when one was found, alone otherwise. */
export function playerTabs(fantraxId: string, rival: string | undefined): readonly (Tab & { key: PlayerTab | "compare" })[] {
  return [
    { key: "profile", href: playerHref(fantraxId), label: PLAYER_TAB_LABEL.profile },
    { key: "data", href: playerDataHref(fantraxId), label: PLAYER_TAB_LABEL.data },
    { key: "news", href: playerNewsHref(fantraxId), label: PLAYER_TAB_LABEL.news },
    { key: "transfer", href: `${playerHref(fantraxId)}/transfer`, label: PLAYER_TAB_LABEL.transfer },
    { key: "compare", href: compareHref({ a: fantraxId, b: rival }), label: "Compare" },
  ];
}
