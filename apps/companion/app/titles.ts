import type { Metadata } from "next";
import { COMPETITION_NAME } from "@epl/core";
import type { LeagueSection } from "./league/SectionNav";
import type { PremSection } from "./prem/PremNav";

// Every screen's name, keyed on the section its shell already knows: never a literal at a call site (DESIGN §2).
// A caption is not a tab label (`Table` against `League Table`), so this is its own table.

/** Our league's views. */
export const LEAGUE_CAPTION: Record<LeagueSection, string> = {
  table: "League Table",
  fixtures: "Fixtures",
  transfers: "Transfers",
  teamStats: "Team Stats",
  cups: "Cups",
  // Not a tab (`SectionNav` records why), but a section a route can BE on.
  matchups: "Matchups",
  waivers: "Waivers",
};

/** The fantasy deep dive's bar; the rail says the same word. */
export const SCOUT = "Data";

/** The head-to-head, a route under Matchups rather than a section of its own. */
export const HEAD_TO_HEAD = "Head-to-head";

/** The real competition's views. */
export const PREM_CAPTION: Record<PremSection, string> = {
  table: "League Table",
  fixtures: "Fixtures",
};

/** The word the inbox's bar ends with (`123 Mail`), and the whole bar for a reader with no team. */
export const NEWS = "Mail";

/** The page at the end of Read's strip. */
export const MORE_TITLE = "More";

/** The league's points table, listed on More. */
export const SCORING_TITLE = "Scoring";

/** The page that names who made the app's pictures and data. */
export const CREDITS_TITLE = "Credits";

/** The squad index's bar: the reader's own, or every team's. */
export const YOUR_SQUAD = "Your squad";
export const SQUADS = "Squads";

/** What joins a title's parts, and the league's name to the end of each (the root layout's template). */
export const TITLE_JOIN = " · ";

/** A route's `<title>`: what the screen is about, then which view of it; the root layout's template adds the league. */
export function titled(...parts: readonly (string | null | undefined)[]): Metadata {
  const title = parts.filter((part) => part !== null && part !== undefined && part !== "").join(TITLE_JOIN);
  return title === "" ? {} : { title };
}

/** `generateMetadata` for one view of a subject: his name off the route's params, then the view; no name, the view. */
export function subjectTitle<P>(named: (params: P) => Promise<string | null>, view: string | null) {
  return async ({ params }: { params: Promise<P> }): Promise<Metadata> => titled(await named(await params), view);
}

/** A Premier League view's title: the view, then the competition its bar names. */
export function premTitled(section: PremSection): Metadata {
  return titled(PREM_CAPTION[section], COMPETITION_NAME);
}

/** A tab's label off its strip's own table, so the title says what the lit tab says. */
export function labelOf<K extends string>(tabs: readonly { key: K; label: string }[], key: K): string | null {
  return tabs.find((tab) => tab.key === key)?.label ?? null;
}

/** One gameweek, as a title names it. */
export function gameweekName(gameweek: number): string {
  return `Gameweek ${gameweek}`;
}

/** Live's bar and title: the league's gameweek, not the Premier League's. */
export function draftGameweek(gameweek: number): string {
  return `Draft ${gameweekName(gameweek)}`;
}

/** Two sides meeting, as a title and a match's heading name them: `Arsenal v Leeds United`. */
export function versus(home: string, away: string): string {
  return `${home} v ${away}`;
}
