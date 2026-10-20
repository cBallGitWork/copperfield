import {
  type AssistKinds,
  type Fixture,
  type FixtureStream,
  type FootballPlayer,
  type FootballSnapshot,
  type MatchEvent,
  type PlayerMatchStats,
  before,
  creditRoundAssists,
  mapRoundGoals,
  plFixtureCode,
  withPlState,
} from "@epl/core";
import { replayAt } from "./clock";
import { plRound, plStream, playerCodes } from "./plFeed";
import { orDegraded } from "./refusals";

// The round's questions, from the Premier League's own feed, whose round read carries every goal
// in one request; FPL publishes no minute for a goal. One match's questions are in `matchFeed.ts`,
// and the reads and identity join in `plFeed.ts`.

/** Every event when live; under `REPLAY_AT`, those before it, so an undated event is dropped. */
function asOf<T extends { absolute: number | null }>(events: readonly T[]): T[] {
  const at = replayAt();
  return at === null ? [...events] : before(events, at);
}

/** Every goal in the round joined to FPL players, newest first by `absolute` (kickoff plus elapsed),
 *  not the match clock, which starts at nought in every match. `[]` when their API fails. */
export async function roundGoals(
  gameweek: number,
  players: readonly FootballPlayer[],
  codes: Map<number, number> = playerCodes(players),
): Promise<MatchEvent[]> {
  const round = await orDegraded(plRound(gameweek), () => null);
  if (round === null) return [];
  const goals = asOf(mapRoundGoals(round.content, codes));
  return goals.sort((a, b) => (b.absolute ?? 0) - (a.absolute ?? 0));
}

/** Each kicked-off fixture's commentary this round, keyed by FPL's fixture code, never its id, which
 *  the Premier League numbers differently. Up to ten reads a window; empty, never a throw. */
export async function roundStreams(gameweek: number): Promise<Map<number, FixtureStream>> {
  const round = await plRound(gameweek).catch(() => null);
  if (round === null) return new Map();
  const entries = await Promise.all(
    round.content.map(async (fixture) => {
      const code = plFixtureCode(fixture);
      if (code === null || fixture.status === "U") return null;
      const stream = await plStream(fixture).catch(() => null);
      if (stream === null) return null;
      return [code, { events: stream.events.content, kickoffMillis: fixture.kickoff?.millis ?? null }] as const;
    }),
  );
  return new Map(entries.filter((entry) => entry !== null));
}

/** The round's goals with the assists FPL pays and Opta never placed (`creditRoundAssists`).
 *  The streams are `roundStreams`' own; the kinds are the stats league's (`roundAssistKinds`). */
export function creditAssists(
  goals: readonly MatchEvent[],
  snapshot: FootballSnapshot,
  stats: readonly PlayerMatchStats[],
  streams: ReadonlyMap<number, FixtureStream>,
  kinds: ReadonlyMap<number, AssistKinds>,
  codes: Map<number, number> = playerCodes(snapshot.players),
): MatchEvent[] {
  return creditRoundAssists(goals, snapshot.players, snapshot.fixtures, stats, streams, codes, kinds);
}

/** The round's fixtures with the Premier League's score, minute and state, off the read its goals come from, so a
 *  scoreline never trails its own goals; FPL's as they are under `REPLAY_AT` or when their API fails. */
export async function withRoundState(fixtures: readonly Fixture[], gameweek: number): Promise<Fixture[]> {
  const round = replayAt() === null ? await orDegraded(plRound(gameweek), () => null) : null;
  if (round === null) return [...fixtures];
  const byCode = new Map(round.content.map((entry) => [plFixtureCode(entry), entry]));
  return fixtures.map((fixture) => withPlState(fixture, byCode.get(fixture.code) ?? null));
}
