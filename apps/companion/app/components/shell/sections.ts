// The app's sections as one table, read by both rails, Read's strip and the More page.
// No JSX and no `"use client"`: client and server modules both import it, and so must its imports.

import { LEAGUE, MATCHUPS } from "../../league/routes";
import { POOL } from "../../players/routes";
import { CLUB, MATCH, PREM, PREM_FIXTURES } from "../../prem/routes";
import { MY_TEAM, SQUAD } from "../../squad/routes";
import type { GlyphName } from "./glyphs";

/** The paper's front page. */
export const PAPER = "/";

/** The paper's territory: the front page and each story's own page. */
const PAPER_ROUTES = [PAPER, "/paper"];

/** The manager's inbox, labelled Mail. */
export const MAIL = "/news";

/** The page of what has no tab of its own, and the credits and the scoring it carries. */
export const MORE = "/more";
export const CREDITS = "/credits";
export const SCORING = "/scoring";

/** The Live section, there from an hour before a gameweek's first kickoff to its last whistle. */
export const LIVE = "/matchday";

/** A gameweek's own page, `/gw/[n]`: Live's, though it outlasts the gameweek. */
export const GAMEWEEK = "/gw";

/** One gameweek's page. */
export function gameweekHref(gameweek: number): string {
  return `${GAMEWEEK}/${gameweek}`;
}

/** The FPL tab. */
export const FPL = "/fpl";

/** A section owns every route under it, so a detail page still lights its tab. */
export interface Section {
  href: string;
  label: string;
  routes: string[];
  /** Pages it owns exactly and not their children: the squad index is Draft's, a rival's squad nobody's. */
  pages?: string[];
  /** Only while football is on, from an hour before the first kickoff. The Live section and nothing else. */
  onlyDuringGameweek?: boolean;
  /** The glyph over its word on the phone's rail; a section with no phone tab has none. */
  glyph?: GlyphName;
  /** Its full name where a row has room for it, as More's page does. */
  fullLabel?: string;
  /** No phone tab: listed on More's page, which Read's strip reaches; flat on the desk rail. */
  overflow?: boolean;
  /** Its strip reaches More, so on a phone it is also current on a section behind More. */
  holdsMore?: boolean;
  /** Too big a page to fetch ahead on every poll, so it is fetched once (`aheadOf`): Data's board is ~90KB, the rest ~50KB. */
  heavy?: boolean;
}

export const SECTIONS: Section[] = [
  // Mail and the paper under one tab, opening on Mail; its strip (`READ_VIEWS`) moves between them and on to More.
  { href: MAIL, label: "Read", glyph: "mail", routes: [MAIL, ...PAPER_ROUTES, MORE, CREDITS, SCORING], holdsMore: true },
  // One route, not a prefix, so it lights on the reader's own five tabs and stays dark on a rival's.
  // `Team` because `My Team` renders at 51px against a tab's 49px at 320; `fullLabel` says it where rows have room.
  { href: MY_TEAM, label: "Team", fullLabel: "My Team", glyph: "team", routes: [MY_TEAM] },
  { href: LIVE, label: "Live", glyph: "live", routes: [LIVE, GAMEWEEK], onlyDuringGameweek: true },
  // "Draft" on the bar; the URL stays `/league`. The squad index lists the league's teams, so it is Draft's too.
  { href: LEAGUE, label: "Draft", glyph: "league", routes: [LEAGUE], pages: [SQUAD] },
  // Opens on the gameweek under way, or the next once it is done (`openGameweek`); lit across the section, table included.
  { href: PREM_FIXTURES, label: "Prem", glyph: "prem", routes: [PREM] },
  // "Data" on the bar; the URL stays `/players`, because a shared URL outlives a label.
  { href: POOL, label: "Data", glyph: "data", routes: [POOL], heavy: true },
  { href: FPL, label: "FPL", routes: [FPL], overflow: true },
];

/** Read's strip: Mail and the paper a tap apart, and More, which has no tab of its own. */
export const READ_VIEWS = [
  { href: MAIL, label: "Mail", key: "mail" },
  { href: PAPER, label: "Gazetta", key: "gazetta" },
  { href: MORE, label: "More", key: "more" },
] as const;

export type ReadView = (typeof READ_VIEWS)[number]["key"];

/** The sections this gameweek has: Live only while football is on. */
export function sectionsFor(matchday: boolean): Section[] {
  return SECTIONS.filter((section) => matchday || !section.onlyDuringGameweek);
}

/** The tabs a phone's rail draws, in order. */
export function barSections(sections: readonly Section[]): Section[] {
  return sections.filter((section) => !section.overflow);
}

/** What is behind `More`, listed on its page before the squads and the credits. */
export function overflowSections(sections: readonly Section[]): Section[] {
  return sections.filter((section) => section.overflow);
}

/** Whether a section is where you are, as the desk rail lights it. */
export function sectionOwns(section: Section, pathname: string): boolean {
  return owns(section.routes, pathname) || (section.pages ?? []).includes(pathname);
}

/** Whether a phone tab is where you are: as on the desk, and More's holder on a section behind More. */
export function tabOwns(sections: readonly Section[], section: Section, pathname: string): boolean {
  return (
    sectionOwns(section, pathname) ||
    (section.holdsMore === true && overflowSections(sections).some((behind) => sectionOwns(behind, pathname)))
  );
}

/** The pages `AutoRefresh` fetches ahead so a tap draws at once: the bar's tabs and the paper, a tap from Mail, on
 *  each tick, and a heavy one only when the app opens. */
export function aheadOf(sections: readonly Section[]): { each: string[]; once: string[] } {
  const bar = barSections(sections);
  return {
    each: [...bar.filter((section) => !section.heavy).map((section) => section.href), PAPER],
    once: bar.filter((section) => section.heavy).map((section) => section.href),
  };
}

export function owns(routes: readonly string[], pathname: string): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Whether a route is newsprint rather than desk; ask here rather than keeping a list of paper routes. */
export function isPaperRoute(pathname: string): boolean {
  return owns(PAPER_ROUTES, pathname);
}

/** The routes whose subject owns the ground: a club, and a match, which takes the home club's. */
const SUBJECT_GROUND_ROUTES = [CLUB, MATCH];

/** Whether the page under this route draws its own ground, so the shell's standing one stands down: a club,
 *  a match, a head-to-head over its home team's venue and a team's screens over its own (not the lists of them). */
export function drawsOwnGround(pathname: string): boolean {
  return owns(SUBJECT_GROUND_ROUTES, pathname) || pathname.startsWith(`${MATCHUPS}/`) || pathname.startsWith(`${SQUAD}/`);
}
