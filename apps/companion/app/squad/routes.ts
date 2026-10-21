import { LEAGUE } from "../league/routes";
import { wholeNumber } from "../wholeNumber";

// A team's routes, named once, in a module the client rail can import without the league read.

/** The route a team's five screens hang off. */
export const SQUAD = "/squad";

/** One team's squad, at a named round when there is one. */
export function teamHref(teamId: string, gameweek?: number): string {
  return gameweek === undefined ? `${SQUAD}/${teamId}` : `${SQUAD}/${teamId}?gw=${gameweek}`;
}

/** Where the squad's team picker goes: the picked team at the week on screen, or null with no team picked. */
export function teamPick(team: string | undefined, gw: string | undefined): string | null {
  if (team === undefined || team === "") return null;
  return teamHref(encodeURIComponent(team), wholeNumber(gw) ?? undefined);
}

/** The segment meaning the reader's own team: the URL says whose screen it is, so the rail lights My Team without a
 *  cookie read. Two letters, so never a Fantrax id. */
export const OWN = "me";

/** The reader's own team. */
export const MY_TEAM = `${SQUAD}/${OWN}`;

/** Where a squad's back plate goes with no history: the league table for a rival, none on your own team's tab. */
export function teamBack(slug: string): string | undefined {
  return slug === OWN ? undefined : LEAGUE;
}
