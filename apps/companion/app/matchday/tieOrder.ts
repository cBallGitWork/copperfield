import { type CompetitionTie, LEAGUE_COMPETITION, LEAGUE_NAME } from "@epl/core";
import { yoursFirst } from "../mine";

/** The reader's own tie first, so it clears the tab bar; the rest, and a signed-out reader's list, keep their order. */
export function readerFirst(ties: readonly CompetitionTie[], mine: string | null): CompetitionTie[] {
  return yoursFirst(ties, (tie) => mine !== null && [tie.home, tie.away].some((side) => side.team?.teamId === mine));
}

/** A group's head: the league's full name, not `LEAGUE_COMPETITION.name` (Craig, 21 Sep 2026), or the cup and its round. */
export function tieGroupTitle(group: Pick<CompetitionTie, "competition" | "round">): string {
  if (group.competition.id === LEAGUE_COMPETITION.id) return LEAGUE_NAME;
  return group.round === null ? group.competition.name : `${group.competition.name} · ${group.round}`;
}
