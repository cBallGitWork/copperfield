import TabStrip from "../../../components/shell/TabStrip";
import { MATCH_TABS, matchHref, type MatchTab } from "./matchRoutes";

export default function MatchTabs({
  id,
  current,
  dim,
}: {
  id: number;
  current: MatchTab;
  /** Views with nothing behind them for this match, greyed in place (a match with no highlights). */
  dim: readonly MatchTab[];
}) {
  return (
    <TabStrip
      label="Match views"
      tabs={MATCH_TABS.map((tab) => ({ ...tab, href: matchHref(id, tab.key) }))}
      current={current}
      dim={dim}
      labels="word"
    />
  );
}
