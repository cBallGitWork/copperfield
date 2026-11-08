import TabStrip from "../components/shell/TabStrip";
import { FIXTURES, CUPS_PAGE, SECTIONS } from "./sections";

// The League tab's own views; a server component, since each page knows which one it is.

/** One gameweek's fixtures, or results once it is played. */
export function leagueFixturesHref(gameweek: number): string {
  return `${FIXTURES}?gw=${gameweek}`;
}

/** One cup's page. */
export function cupHref(cupId: string): string {
  return `${CUPS_PAGE}?${new URLSearchParams({ cup: cupId })}`;
}

export type { LeagueSection } from "./sections";
import type { LeagueSection } from "./sections";
export { TEAM_STATS } from "./sections";

export default function SectionNav({ current }: { current: LeagueSection }) {
  // On Matchups no plate is current.
  const here = SECTIONS.find((section) => section.key === current)?.key ?? null;
  // `word` labels: at 11px "Team Stats" ran its plate 34px past a 390 viewport.
  return <TabStrip label="League views" tabs={SECTIONS} current={here} labels="word" />;
}
