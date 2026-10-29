import type {
  FootballPlayer,
  PlGoal,
  PlManMatch,
  PlMatchFacts,
  RawPlFixture,
  StreamCredit,
} from "@epl/core";
import {
  injuryMinutes,
  plGoals,
  plManMatches,
  plMatchFacts,
  plPlayerCodes,
  plTeamSheets,
  streamCredits,
} from "@epl/core";
import {
  ofFixture,
  optaToCode,
  plFixture,
  plStream,
} from "./plFeed";


// One match's detail read (`/fixtures/{id}`), resolved from our fixture code by `ofFixture` (`plFeed.ts`): the
// facts, the team sheets, the men's events and names, the injuries, the goals and the stream's
// assist credits. The match's other reads are in `matchFeed.ts`.

/** One match's detail read joined to our players by Opta code, or `absent` at any step that fails. */
function ofTeamSheet<T>(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
  absent: T,
  read: (fixture: RawPlFixture, codes: Map<string, number>) => T,
): Promise<T> {
  return ofFixture(gameweek, fixtureCode, absent, async (round) => read(await plFixture(round), optaToCode(players)));
}

/** Where a match was played, how many watched and who refereed, off the detail read: the round read
 *  carries no officials. Null when they will not answer, and the caller falls back to `clubGround`. */
export async function matchFacts(
  gameweek: number | null,
  fixtureCode: number,
): Promise<PlMatchFacts | null> {
  return ofFixture(gameweek, fixtureCode, null, async (round) => plMatchFacts(await plFixture(round)));
}

/** Both sides' team sheets for one of our fixtures, or null at any step that fails. */
export async function teamSheets(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<ReturnType<typeof plTeamSheets>> {
  return ofTeamSheet(gameweek, fixtureCode, players, null, plTeamSheets);
}

/** What each man did in one match, by FPL player code, off `teamSheets`' cached detail read.
 *  Empty before kickoff, the same answer as their API refusing. */
export async function matchManEvents(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<Map<number, PlManMatch>> {
  return ofTeamSheet(gameweek, fixtureCode, players, new Map<number, PlManMatch>(), plManMatches);
}

/** Every goal in the commentary with the man FPL's rules would credit, the detail read joining ids.
 *  A proposal: `streamCredited` discards it unless FPL's per-man counts agree. */
export async function matchStreamCredits(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<StreamCredit[]> {
  return ofFixture(gameweek, fixtureCode, [] as StreamCredit[], async (round) => {
    const [fixture, stream] = await Promise.all([plFixture(round), plStream(round)]);
    return streamCredits(stream.events.content, plPlayerCodes(fixture, optaToCode(players)));
  });
}

/** Every man on either team sheet by Opta's `name.display`, the form the commentary prints, so
 *  `proseSpans` can look names up; `plTeamSheets` maps to our short names, which never match. */
export async function matchPlayerNames(
  gameweek: number | null,
  fixtureCode: number,
): Promise<string[]> {
  return ofFixture(gameweek, fixtureCode, [] as string[], async (round) => {
    const fixture = await plFixture(round);
    return (fixture.teamLists ?? []).flatMap((list) =>
      list === null ? [] : [...list.lineup, ...list.substitutes].map((man) => man.name.display),
    );
  });
}

/** The minute each man was taken off injured in this match, by FPL code: the Line Ups board asks
 *  whether, the scoresheet prints when. */
export async function matchInjuries(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<Map<number, number>> {
  return ofFixture(gameweek, fixtureCode, new Map<number, number>(), async (round) => {
    const [fixture, stream] = await Promise.all([plFixture(round), plStream(round)]);
    return injuryMinutes(stream.events.content, plPlayerCodes(fixture, optaToCode(players)));
  });
}

export async function matchGoals(
  gameweek: number | null,
  fixtureCode: number,
  players: readonly FootballPlayer[],
): Promise<PlGoal[]> {
  return ofTeamSheet(gameweek, fixtureCode, players, [] as PlGoal[], plGoals);
}
