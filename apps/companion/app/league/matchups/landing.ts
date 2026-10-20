import { LEAGUE } from "../routes";

/** Where a bare old Matchups link lands: the gameweek Matchups showed (the one in focus), else Fixtures' default.
 *  Spelt as SectionNav's leagueFixturesHref, which a test cannot load (its TabStrip import needs Next's `@/` alias). */
export function matchupsLanding(gameweek: number | null): string {
  const fixtures = `${LEAGUE}/fixtures`;
  return gameweek === null ? fixtures : `${fixtures}?gw=${gameweek}`;
}
