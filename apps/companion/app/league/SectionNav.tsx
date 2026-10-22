import TabStrip from "../components/shell/TabStrip";
import { SQUAD } from "../squad/routes";
import { LEAGUE, WAIVERS } from "./routes";

// The League tab's own views; a server component, since each page knows which one it is.

/** The blue buttons, in Craig's order (27 Sep 2026: *"Change table to league. Move cups to 2nd"*); Schedule and Results
 *  one Fixtures, Transfers in from Mail and Scoring out to More (13 Oct: six was too many). Matchups is not a tab.
 *  The desk has room for two more (22 Oct): Waivers, which lights Transfers under a thumb, and the squad index. */
const SECTIONS = [
  { href: LEAGUE, label: "League", key: "table" },
  { href: `${LEAGUE}/cups`, label: "Cups", key: "cups" },
  { href: `${LEAGUE}/fixtures`, label: "Fixtures", key: "fixtures" },
  { href: `${LEAGUE}/transfers`, label: "Transfers", key: "transfers" },
  { href: WAIVERS, label: "Waivers", key: "waivers", desk: true, folds: "transfers" },
  { href: `${LEAGUE}/team-stats`, label: "Team Stats", key: "teamStats" },
  { href: SQUAD, label: "Squads", key: "squads", desk: true },
] as const;

/** A section's route, found by key and never by index: an insert would repoint an index silently. */
function at(key: (typeof SECTIONS)[number]["key"]): string {
  const found = SECTIONS.find((section) => section.key === key);
  if (found === undefined) throw new Error(`no league section keyed ${key}`);
  return found.href;
}

export const TEAM_STATS = at("teamStats");
const CUPS_PAGE = at("cups");
const FIXTURES = at("fixtures");

/** One gameweek's fixtures, or results once it is played. */
export function leagueFixturesHref(gameweek: number): string {
  return `${FIXTURES}?gw=${gameweek}`;
}

/** One cup's page. */
export function cupHref(cupId: string): string {
  return `${CUPS_PAGE}?${new URLSearchParams({ cup: cupId })}`;
}

/** The tabs, plus Matchups: a section a route can be on without a plate of its own in the strip. */
export type LeagueSection = (typeof SECTIONS)[number]["key"] | "matchups";

export default function SectionNav({ current }: { current: LeagueSection }) {
  // On Matchups no plate is current.
  const here = SECTIONS.find((section) => section.key === current)?.key ?? null;
  // `word` labels: at 11px "Team Stats" ran its plate 34px past a 390 viewport.
  return <TabStrip label="League views" tabs={SECTIONS} current={here} labels="word" />;
}
