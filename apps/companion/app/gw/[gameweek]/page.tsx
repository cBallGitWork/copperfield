import { notFound } from "next/navigation";
import { hasGameweek } from "@epl/core";
import GameweekView from "../../components/football/GameweekView";
import { footballLinesNow, gameweekSnapshot } from "../../football";
import { marks } from "../../involvement";
import { lockAhead } from "../../lockAhead";
import { wholeNumber } from "../../wholeNumber";
import type { Metadata } from "next";
import { gameweekName, titled } from "../../titles";

// Any round of the season, addressable. Last week's results on Monday morning is
// the second thing anyone wants after this week's score.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ gameweek: string }> }): Promise<Metadata> {
  const requested = wholeNumber((await params).gameweek);
  return requested === null ? {} : titled(gameweekName(requested));
}

export default async function GameweekPage({
  // Next 16 hands route params as a promise.
  params,
}: {
  params: Promise<{ gameweek: string }>;
}) {
  const { gameweek } = await params;
  // Refused before FPL is asked for it.
  const requested = wholeNumber(gameweek);
  if (requested === null) notFound();

  // With the round's lines: the match list prints each man's goals and assists off them.
  const current = await footballLinesNow();
  const snapshot = requested === current.gameweek ? current : await gameweekSnapshot(requested);
  if (!hasGameweek(snapshot, requested)) notFound();

  // Marked from today's squads, even on a past round: rosters by period are unproven (PLATFORM_NOTES).
  const [league, locksAt] = await Promise.all([marks(snapshot.fixtures), lockAhead(requested)]);
  return <GameweekView snapshot={snapshot} mine={league.mine} owners={league.owners} locksAt={locksAt} />;
}
