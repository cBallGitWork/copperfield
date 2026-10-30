import { type FootballPlayer, type SheetMoment, plFixtureCode, sheetMoments } from "@epl/core";
import { optaToCode, plFixture, plRound } from "../plFeed";
import { orDegraded } from "../refusals";
import { replayAt } from "../clock";

// The round's whistles, cards and changes, off the detail reads Scores' goals already make; none when their API is down.

/** Every started match's moments; under `REPLAY_AT`, those before it. */
export async function roundMoments(gameweek: number, players: readonly FootballPlayer[]): Promise<SheetMoment[]> {
  const round = await orDegraded(plRound(gameweek), () => null);
  if (round === null) return [];
  const opta = optaToCode(players);
  const each = await Promise.all(
    round.content.map(async (fixture) => {
      const code = plFixtureCode(fixture);
      if (code === null || fixture.status === "U") return [];
      const detail = await orDegraded(plFixture(fixture), () => null);
      return detail === null ? [] : sheetMoments(detail, code, opta);
    }),
  );
  const at = replayAt();
  const until = at === null ? Infinity : Date.parse(at);
  return each.flat().filter((moment) => moment.at !== null && moment.at <= until);
}
