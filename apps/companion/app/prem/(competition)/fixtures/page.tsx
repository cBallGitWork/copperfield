import { clubById, gameweekStarted, gameweekStatus } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { beside, openGameweek } from "../../../components/shell/gameweekStep";
import PremShell from "../../Shell";
import { clubPlaces } from "../../places";
import RoundMatches, { byRound } from "../../Rounds";
import { premFixturesHref } from "../../routes";
import { footballNow, seasonFixtures } from "../../../football";
import { marks } from "../../../involvement";
import { readerTeamId } from "../../../squads";
import { wholeNumber } from "../../../wholeNumber";
import { premTitled } from "../../../titles";

// One gameweek of football at a time, played or to come (Craig, 13 Oct 2026: Results and Fixtures were two rows of
// the same thing). `?gw=` picks it; without one, the latest under way, or the next once that one is done. A match in
// play scores here as on Live.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const metadata = premTitled("fixtures");

export default async function FixturesPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const [{ gw }, snapshot, fixtures, reader] = await Promise.all([
    searchParams,
    footballNow(),
    seasonFixtures(),
    readerTeamId(),
  ]);

  const rounds = byRound(fixtures);
  const gameweek = openGameweek(
    rounds.map(({ gameweek }) => ({
      gameweek,
      started: gameweekStarted(fixtures, gameweek),
      finished: gameweekStatus(fixtures, gameweek) === "finished",
    })),
    wholeNumber(gw),
  );
  const round = rounds.find((each) => each.gameweek === gameweek);

  if (round === undefined) {
    return (
      <PremShell current="fixtures">
        <Nothing title="No fixtures yet" code="no dated fixture" />
      </PremShell>
    );
  }

  // His men in each match, off today's squads; the league's squads are read only for a reader with a team.
  const yours = reader === null ? undefined : (await marks(round.fixtures)).mine;

  return (
    // Its matches and the round's head: the panel fits the gameweek, not the table's twenty.
    <PremShell current="fixtures" rows={round.fixtures.length + 1}>
      <RoundMatches
        round={round}
        clubs={clubById(snapshot)}
        places={clubPlaces(fixtures, snapshot.clubs)}
        step={{ ...beside(rounds.map((each) => each.gameweek), round.gameweek), href: premFixturesHref }}
        yours={yours}
      />
    </PremShell>
  );
}
