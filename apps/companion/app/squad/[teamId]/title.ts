import { leagueInfo } from "../../round";
import { myTeamId } from "../../session";
import { labelOf, subjectTitle } from "../../titles";
import { OWN } from "../routes";
import { TEAM_TABS, type TeamTab } from "./TeamTabs";

/** `generateMetadata` for one of a team's tabs: his full name, as the bar prints it, then the tab; the tab alone for
 *  `me` with nobody signed in, or a league that did not answer. */
export function teamTitle(tab: TeamTab) {
  return subjectTitle(async ({ teamId: slug }: { teamId: string }) => {
    const teams = (await leagueInfo())?.teams ?? [];
    const teamId = slug === OWN ? await myTeamId(teams) : slug;
    return teams.find((team) => team.teamId === teamId)?.name || null;
  }, labelOf(TEAM_TABS, tab));
}
