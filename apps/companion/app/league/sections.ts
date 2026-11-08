import { SQUAD } from "../squad/routes";
import { LEAGUE, WAIVERS } from "./routes";

// The League tab's views as data, so the strip (`SectionNav`) and CM's foot bar read one list.

/** The blue buttons, in Craig's order (27 Sep 2026: *"Change table to league. Move cups to 2nd"*); Schedule and Results
 *  one Fixtures, Transfers in from Mail and Scoring out to More (13 Oct: six was too many). Matchups is not a tab.
 *  The desk has room for two more (22 Oct): Waivers, which lights Transfers under a thumb, and the squad index. */
export const SECTIONS = [
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
export const CUPS_PAGE = at("cups");
export const FIXTURES = at("fixtures");

/** The tabs, plus Matchups: a section a route can be on without a plate of its own in the strip. */
export type LeagueSection = (typeof SECTIONS)[number]["key"] | "matchups";

/** The strip's next view after `current`, for CM's foot bar; none after the last, or off the strip (Matchups). */
export function nextSection(current: LeagueSection): { href: string; label: string } | null {
  const index = SECTIONS.findIndex((section) => section.key === current);
  const next = index < 0 ? undefined : SECTIONS[index + 1];
  return next === undefined ? null : { href: next.href, label: next.label };
}

