import { notFound } from "next/navigation";
import { clubById, nextFixtures, squadOf } from "@epl/core";
import type { Club, FootballSnapshot, Fixture, Opposition, SquadPlayerDetail } from "@epl/core";
import { footballNow, seasonFixtures } from "../../../football";
import { wholeNumber } from "../../../wholeNumber";
import { minutesFrom } from "../../../xmins";
import type { LeagueOpinion } from "../../leagueOpinions";
import { clubCards } from "../../premCards";

// What every club tab reads, in one place; `squad/[teamId]/team.ts` is the fantasy twin.

/** One club by its FPL `code`, never `clubId` (recycled each season), with the snapshot and fixtures. */
export async function clubOr404(
  code: string,
): Promise<{ club: Club; snapshot: FootballSnapshot; fixtures: Fixture[] }> {
  // Refused before FPL is asked for it.
  const wanted = wholeNumber(code);
  if (wanted === null) notFound();

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const club = snapshot.clubs.find((entry) => entry.code === wanted);
  if (club === undefined) notFound();

  // The whole snapshot, so no tab calls `footballNow()` a second time.
  return { club, snapshot, fixtures };
}

/** The club's next match, and each man our league lists as the one player card takes him against it. */
export function nextAndCards(
  { club, snapshot, fixtures }: { club: Club; snapshot: FootballSnapshot; fixtures: Fixture[] },
  league: ReadonlyMap<number, LeagueOpinion>,
): { next: Opposition | undefined; cards: Map<number, SquadPlayerDetail> } {
  // The season's fixtures, not the round in view: a blank gameweek can put the next match weeks off.
  const [next] = nextFixtures(fixtures, clubById(snapshot), club.id, 1);
  const minutes = minutesFrom(next?.fixture.gameweek ?? null);
  return { next, cards: clubCards(squadOf(snapshot, club.id), league, { club, next, minutes }) };
}
