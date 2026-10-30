import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  type Fixture,
  type FootballBase,
  type FootballSnapshot,
  type RoundReads,
  datedKickoffs,
  duringGameweek,
  gameweekOpened,
  fetchBootstrap,
  fetchFixtures,
  inMatchWindow,
  isDated,
  LIVE_LEAD_MINUTES,
  liveGameweek,
  type MatchSheet,
  type PlayerMatchStats,
  fetchLive,
  fetchRegions,
  mapBase,
  mapFixtures,
  mapLiveStats,
  mapMatchSheets,
  gameweekStarts,
  type NoteCalendar,
  nextRound,
  portraitUrl,
  rewindRound,
  secondsToWindow,
  snapshotOf,
  withRoundFixtures,
} from "@epl/core";
import { now, replayAt } from "./clock";
import { roundGoals } from "./commentary";
import { onTheClock } from "./fplClock";
import { restAfterFailure } from "./restAfterFailure";
import { singleFlight } from "./singleFlight";
import {
  BASE_REVALIDATE,
  FPL_REST_MAX_MS,
  FPL_REST_MS,
  LIVE_REVALIDATE,
  MATCH_WINDOW,
  POLL,
  QUIET_REVALIDATE,
  SEASON_CODE_LIFE,
} from "./config";

// One football snapshot per window, shared by every reader, from caches on the football clock (`fplClock.ts`): FPL's
// 1.3 MB bootstrap, which moves with news, and the round's fixtures and live lines, which move with the match. Nothing
// about who is asking may cross into any of them.

// FPL's endpoints, each resting in this process after a failure (longer for each in a row), not asked on every view.
const fplRest = { maxRestMs: FPL_REST_MAX_MS };
const fplBootstrap = restAfterFailure(fetchBootstrap, FPL_REST_MS, fplRest);
const fplFixtures = restAfterFailure(fetchFixtures, FPL_REST_MS, fplRest);
/** FPL's live read for a round; shared with the FPL tab, so both rest together. */
export const fplLive = restAfterFailure(fetchLive, FPL_REST_MS, fplRest);

/** The season's list, stamped: it stands in for a round FPL will not read (`roundSnapshot`). */
const readSeason = async (): Promise<{ fixtures: Fixture[]; fetchedAt: string }> => ({
  fixtures: mapFixtures(await fplFixtures()),
  fetchedAt: new Date().toISOString(),
});

/** The season's list, one reading an hour that a refused refresh leaves in place: the clock's kickoffs too. The round
 *  in view comes from its own reading, so this carries only dates and finished rounds. */
const seasonList = unstable_cache(singleFlight(readSeason), ["fpl-season-list"], { revalidate: QUIET_REVALIDATE });

/** Whether FPL is read on the live clock: inside a match window, or when no list was ever held. Once per request. */
export const matchOn = cache(async (): Promise<boolean> => {
  try {
    const kickoffs = (await seasonList()).fixtures.filter(isDated).map((fixture) => fixture.kickoff);
    return inMatchWindow(kickoffs, now().toISOString(), MATCH_WINDOW);
  } catch {
    return true;
  }
});

/** The bootstrap as a snapshot keeps it: players, clubs and the calendar. */
const footballBase = onTheClock("football-base", async () => mapBase(await fplBootstrap()), BASE_REVALIDATE, matchOn);

/** One round's fixtures, stamped: every screen's reading of the round's scores. */
const roundFixtures = onTheClock(
  "fpl-round-fixtures",
  async (gameweek: number): Promise<Pick<RoundReads, "fixtures" | "fetchedAt">> => ({
    fixtures: await fplFixtures(gameweek),
    fetchedAt: new Date().toISOString(),
  }),
  LIVE_REVALIDATE,
  matchOn,
);

/** One round's per-player lines, stamped, for the readers that need them. A failed read throws, so the cache keeps
 *  serving the last whole reading instead of storing a gap for the window. */
const roundLines = onTheClock(
  "fpl-round-lines",
  async (gameweek: number): Promise<{ stats: PlayerMatchStats[]; fetchedAt: string }> => ({
    stats: mapLiveStats(await fplLive(gameweek)),
    fetchedAt: new Date().toISOString(),
  }),
  LIVE_REVALIDATE,
  matchOn,
);

/** The round's reading, its lines only when asked for. Lines never held are null, never `[]`: "nobody has scored" and
 *  "we cannot see" are opposite claims. Stamped with the older of its two reads; null when FPL refuses the fixtures
 *  with nothing held, caught out here so the refusal is never cached. */
async function roundOf(gameweek: number, lines: boolean): Promise<RoundReads | null> {
  const [round, held] = await Promise.all([
    roundFixtures(gameweek).catch(() => null),
    lines ? roundLines(gameweek).catch(() => null) : null,
  ]);
  if (round === null) return null;
  const fetchedAt = held === null || held.fetchedAt > round.fetchedAt ? round.fetchedAt : held.fetchedAt;
  return { fixtures: round.fixtures, stats: held?.stats ?? null, fetchedAt };
}

/** One round's snapshot; without its own reading, the season list's fixtures for it, no lines, stamped by that list. */
async function roundSnapshot(base: FootballBase, gameweek: number, round: RoundReads | null): Promise<FootballSnapshot> {
  if (round !== null) return snapshotOf(base, gameweek, round);
  const season = await seasonList();
  const fixtures = season.fixtures.filter((fixture) => fixture.gameweek === gameweek);
  return { ...snapshotOf(base, gameweek, { fixtures: [], stats: null, fetchedAt: season.fetchedAt }), fixtures };
}

async function currentRound(lines: boolean): Promise<FootballSnapshot> {
  const base = await footballBase();
  return roundSnapshot(base, base.focus, await roundOf(base.focus, lines));
}

/** The snapshot without per-player lines (`statsUnavailable`), read once per request: what every screen but the few
 *  that print a man's match figures needs, so those alone ask for FPL's live feed. */
export const footballNow = cache(async (): Promise<FootballSnapshot> => {
  const at = replayAt();
  return at === null ? currentRound(false) : rewound(at);
});

/** The snapshot with the round's per-player lines, read once per request: a stale entry refreshed mid-render must not
 *  give one screen two rounds. */
export const footballLinesNow = cache(async (): Promise<FootballSnapshot> => {
  const at = replayAt();
  return at === null ? currentRound(true) : rewound(at);
});

/** The round `REPLAY_AT` falls in as it stood then, Live's own (`liveGameweek`), or the live round before the season.
 *  Outside `currentRound`: `roundGoals` has its own cache, and a nested `unstable_cache` bypasses it. */
const rewound = cache(async (at: string): Promise<FootballSnapshot> => {
  const gameweek = liveGameweek(datedKickoffs(await seasonFixtures()), at);
  if (gameweek === null) return currentRound(true);
  const snapshot = await gameweekSnapshot(gameweek);
  return rewindRound(snapshot, await roundGoals(gameweek, snapshot.players), at);
});

/** The round Live shows, `liveGameweek`'s: FPL's own turns at its deadline, which may be after Live's. Once per request. */
export const liveNow = cache(async (): Promise<FootballSnapshot> => {
  const [focus, season] = await Promise.all([footballNow(), seasonFixtures()]);
  const gameweek = liveGameweek(datedKickoffs(season), now().toISOString());
  return gameweek === null || gameweek === focus.gameweek ? focus : gameweekSnapshot(gameweek);
});

/** One named round of football with its lines, off the same caches as the current one. */
export async function gameweekSnapshot(gameweek: number): Promise<FootballSnapshot> {
  const [base, round] = await Promise.all([footballBase(), roundOf(gameweek, true)]);
  return roundSnapshot(base, gameweek, round);
}

/** Every fixture in the season, as FPL dates them (a snapshot holds one gameweek), the round in focus as fresh as its
 *  own reading; once per request. Without a round to lay over it, the season list alone. */
export const seasonFixtures: () => Promise<Fixture[]> = cache(async () => {
  const [season, base] = await Promise.all([seasonList(), footballBase().catch(() => null)]);
  const round = base === null ? null : await roundFixtures(base.focus).catch(() => null);
  return round === null ? season.fixtures : withRoundFixtures(season.fixtures, mapFixtures(round.fixtures));
});

/** The calendar a row's fitness note reads: the gameweek of the next kickoff, whose lineups are being picked, and every
 *  gameweek's first kickoff date; an open of null and no starts when FPL cannot be read. */
export async function noteCalendar(): Promise<NoteCalendar> {
  try {
    const fixtures = await seasonFixtures();
    return { open: nextRound(fixtures, now().toISOString())?.gameweek ?? null, starts: gameweekStarts(fixtures) };
  } catch {
    return { open: null, starts: [] };
  }
}

/** FPL's country list, which a `region` id points into. It does not change within a season. */
export const regions = unstable_cache(async () => fetchRegions(), ["fpl-regions"], {
  revalidate: SEASON_CODE_LIFE,
});

/** One round's match sheets, off the round's fixtures: the whole season's list nears 1 MB by May. None when FPL refuses. */
export async function gameweekSheets(gameweek: number): Promise<MatchSheet[]> {
  const round = await roundFixtures(gameweek).catch(() => null);
  return round === null ? [] : mapMatchSheets(round.fixtures);
}

/** One round's per-player lines: the snapshot's own for the round in view (rewound under `REPLAY_AT`), else that
 *  round's reading; empty only when FPL's live read has never answered for it. */
export async function roundFigures(gameweek: number): Promise<PlayerMatchStats[]> {
  const snapshot = await footballLinesNow();
  if (snapshot.gameweek === gameweek) return snapshot.stats;
  return (await roundOf(gameweek, true))?.stats ?? [];
}
/** The season's kickoffs as plain data for the league layer, never as a `Fixture`. */
export async function seasonKickoffs() {
  return datedKickoffs(await seasonFixtures());
}

/** Seconds until a match window opens as this render sees it, for the shell's poller to count down
 *  (`components/shell/cadence.ts`): nought inside a London day's window, its gaps included, never overnight. */
export async function liveIn(): Promise<number | null> {
  const kickoffs = (await seasonFixtures()).filter(isDated).map((fixture) => fixture.kickoff);
  return secondsToWindow(kickoffs, now().toISOString(), MATCH_WINDOW);
}

/** Whether the round in view is under way: first kickoff to last whistle, gaps included. */
export function roundUnderway(snapshot: FootballSnapshot): boolean {
  return duringGameweek(snapshot, now().toISOString());
}

/** Enough faces to read as a crowd, few enough to stay one request each and to
 *  keep the composite legible. */
const GROUND_FACES = 6;

/** Portrait URLs for the desk's ground, spaced evenly because FPL orders players by club, and fixed
 *  so the crowd holds still between polls. Empty rather than a throw: a ground is decoration. */
export async function groundFaces(): Promise<string[]> {
  try {
    const { players } = await footballNow();
    const step = Math.floor(players.length / GROUND_FACES);
    if (step < 1) return players.map((player) => portraitUrl(player));
    return Array.from({ length: GROUND_FACES }, (_, at) => portraitUrl(players[at * step]));
  } catch {
    return [];
  }
}

/** Whether Live is open: from `LIVE_LEAD_MINUTES` before the round's first kickoff to its last whistle. */
export function liveOpen(snapshot: FootballSnapshot): boolean {
  return duringGameweek(snapshot, now().toISOString(), LIVE_LEAD_MINUTES);
}

/** Whether Live's round has opened; true after its last whistle too, until `liveNow` turns to the next. */
export function liveOpened(snapshot: FootballSnapshot): boolean {
  return gameweekOpened(snapshot, now().toISOString(), LIVE_LEAD_MINUTES);
}

/** Whether the shell offers its Live section. Fails open, so an FPL outage never hides Live mid-match. */
export async function offerLive(): Promise<boolean> {
  return (await roundLive()) ?? true;
}

/** Whether Live is open; null when FPL could not be read, so each caller picks its own failure. */
export async function roundLive(): Promise<boolean | null> {
  try {
    return liveOpen(await liveNow());
  } catch {
    return null;
  }
}

/** How stale a snapshot may be and still speak in the present tense, in live poll windows: three
 *  absorbs jitter, and `unstable_cache` sets no upper bound on a stale entry's age. */
const PRESENT_TENSE_WINDOW = 3;

/** Whether this snapshot is recent enough to speak of *now*: `fixture.status` has no clock, so a
 *  stale mid-match snapshot keeps saying "Live 45'". When false, scores render without the tense. */
export function speaksForNow(snapshot: FootballSnapshot): boolean {
  return takenLately(snapshot.fetchedAt);
}

/** Whether a reading taken at `fetchedAt` may still speak in the present tense. */
export function takenLately(fetchedAt: string): boolean {
  const taken = Date.parse(fetchedAt);
  if (Number.isNaN(taken)) return false;
  return now().getTime() - taken <= POLL.live * PRESENT_TENSE_WINDOW * 1000;
}
