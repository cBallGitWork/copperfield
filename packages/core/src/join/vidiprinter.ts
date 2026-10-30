import type { SheetMoment, SheetMomentKind } from "../football/premierleague/sheetMoments";
import type { Fixture, FootballPlayer, MatchEvent, MatchEventKind } from "../football/types";
import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  MINUTES,
  OWN_GOALS,
  RED_CARDS,
  YELLOW_CARDS,
  meaningOf,
} from "../league/categoryNames";
import { wordsOf } from "../league/categoryWords";
import type { LivePlayerCategory } from "../league/points";
import type { ScoringCategory } from "../league/scoring";
import { HALF, goalLines, halfAt, placeIn } from "./printerGoals";

// Live's vidiprinter: the match feed's timed moments for everyone, and the league's scoring counts for drafted men.

/** `in-play` heads a match's counts while it is played; `tally` is one drafted man's counts. */
export type PrinterKind = Exclude<SheetMomentKind, "goal" | "second-half"> | MatchEventKind | "tally" | "in-play";

/** One of a drafted man's league categories, in plain words, with what he did. */
export interface PrinterCount {
  name: string;
  value: string | null;
}

export interface PrinterLine {
  key: string;
  fixtureCode: number;
  kind: PrinterKind;
  /** Null on a count the feed gives no minute for. */
  minute: string | null;
  at: number | null;
  /** FPL `code`; null on a whistle. */
  man: number | null;
  /** The assister, on a goal. */
  second: number | null;
  score: { home: number; away: number } | null;
  /** The league's counts the feed does not time: on his change, or on a line of their own. */
  counts: PrinterCount[];
}

/** A drafted man's categories this period, as the league priced them. */
export interface PrinterTally {
  code: number;
  categories: readonly LivePlayerCategory[];
}

/** What the feed prints with a minute of its own, so the counts never say it twice. */
const TIMED = [GOALS, ASSISTS_TOTAL, ASSISTS_OFFICIAL, ASSISTS_FANTASY, YELLOW_CARDS, RED_CARDS, OWN_GOALS];
/** What only stands once he leaves the pitch. */
const UNSETTLED = [MINUTES, CLEAN_SHEETS, GOALS_AGAINST, GOALS_AGAINST_OUTFIELD];

/** A whistle's place in its match: kick-off first, half-time after the first half's last event, full time after all. */
const WHISTLE_PLACE: Partial<Record<SheetMomentKind, number>> = { "kick-off": 0, "half-time": 1.5 * HALF, "full-time": 2.5 * HALF };
/** Counts the full-time whistle settles print under it. */
const SETTLED_PLACE = 2.5 * HALF - 1;
/** A match in play's counts sit above its newest line, under their heading. */
const IN_PLAY_PLACE = 3 * HALF;

interface Placed {
  line: PrinterLine;
  place: number;
}

/** Every line of the round up to `now`, newest first across matches and in match order within one; a match the
 *  feed has not started prints nothing. */
export function vidiprinter(input: {
  /** Epoch ms: nothing after it prints. */
  now: number;
  goals: readonly MatchEvent[];
  moments: readonly SheetMoment[];
  fixtures: readonly Pick<Fixture, "code" | "homeClubId" | "awayClubId">[];
  players: readonly Pick<FootballPlayer, "code" | "clubId">[];
  /** FPL codes on any roster. */
  drafted: ReadonlySet<number>;
  tallies: readonly PrinterTally[];
  names: Record<string, ScoringCategory> | undefined;
}): PrinterLine[] {
  const { drafted } = input;
  const moments = input.moments.filter((m) => m.at !== null && m.at <= input.now);
  const clubOf = new Map(input.players.map((player) => [player.code, player.clubId]));
  const fixtures = new Map(input.fixtures.map((fixture) => [fixture.code, fixture]));
  const placed: Placed[] = goalLines({ now: input.now, goals: input.goals, moments, fixtures, clubOf });
  const blank = { second: null, score: null, counts: [] };

  const tallies = new Map(input.tallies.map((tally) => [tally.code, tally.categories]));
  const counted = new Set<number>();
  for (const m of moments) {
    if (m.kind === "goal" || m.kind === "second-half") continue;
    const man = m.man;
    // A booking and a change are a drafted man's news; a red card is everybody's.
    if ((m.kind === "booked" || m.kind === "off" || m.kind === "on") && (man === null || !drafted.has(man))) continue;
    if (m.kind === "sent-off" && man === null) continue;
    const counts = m.kind === "off" && man !== null ? countsOf(tallies.get(man), input.names, true) : [];
    if (m.kind === "off" && man !== null) counted.add(man);
    const place = WHISTLE_PLACE[m.kind] ?? placeIn(halfAt(m.half, m.seconds), m.seconds);
    placed.push({ line: { ...blank, key: m.key, fixtureCode: m.fixtureCode, kind: m.kind, minute: m.minute, at: m.at, man, score: m.score, counts }, place });
  }

  const byFixture = Map.groupBy(moments, (m) => m.fixtureCode);
  const playing = new Set<number>();
  for (const [code, categories] of tallies) {
    if (counted.has(code)) continue;
    const club = clubOf.get(code);
    // His club's latest match the feed has started: a double gameweek's counts are both matches'.
    const fixture = input.fixtures.filter((f) => (f.homeClubId === club || f.awayClubId === club) && byFixture.has(f.code)).at(-1);
    const own = fixture === undefined ? undefined : byFixture.get(fixture.code);
    if (fixture === undefined || own === undefined) continue;
    const whistle = own.find((m) => m.kind === "full-time");
    const counts = countsOf(categories, input.names, whistle !== undefined);
    if (counts.length === 0) continue;
    const line = { ...blank, key: `tally:${fixture.code}:${code}`, fixtureCode: fixture.code, kind: "tally" as const, minute: null, man: code, counts };
    if (whistle === undefined) playing.add(fixture.code);
    placed.push(
      whistle === undefined
        ? { line: { ...line, at: Math.max(...own.map((m) => m.at ?? 0)) }, place: IN_PLAY_PLACE }
        : { line: { ...line, at: whistle.at }, place: SETTLED_PLACE },
    );
  }
  for (const code of playing) placed.push(inPlay(code, placed));

  return printOrder(placed);
}

/** The heading over a match's counts while it is played, with the score its latest line made. */
function inPlay(fixtureCode: number, placed: readonly Placed[]): Placed {
  const own = placed.filter((p) => p.line.fixtureCode === fixtureCode && p.line.score !== null).sort((a, b) => a.place - b.place);
  const score = own.at(-1)?.line.score ?? null;
  const line: PrinterLine = { key: `in-play:${fixtureCode}`, fixtureCode, kind: "in-play", minute: null, at: null, man: null, second: null, score, counts: [] };
  return { line, place: IN_PLAY_PLACE + 1 };
}

/** Newest first across matches. Within one, a line never rises above what follows it in the match: each takes the
 *  latest clock of anything before it, and a match's lines on one instant keep together. */
function printOrder(placed: readonly Placed[]): PrinterLine[] {
  const timed = [...Map.groupBy(placed, (p) => p.line.fixtureCode).values()].flatMap((own) => {
    let latest = -Infinity;
    return own
      .map((p, index) => ({ ...p, index }))
      .sort((a, b) => a.place - b.place || a.index - b.index)
      .map((p) => {
        latest = Math.max(latest, p.line.at ?? -Infinity);
        return { ...p, shown: latest };
      });
  });
  return timed
    .sort((a, b) => b.shown - a.shown || a.line.fixtureCode - b.line.fixtureCode || b.place - a.place || b.index - a.index)
    .map(({ line }) => line);
}

/** The league categories that moved his total and that the feed does not time; while he plays, only what is done. */
function countsOf(
  categories: readonly LivePlayerCategory[] | undefined,
  names: Record<string, ScoringCategory> | undefined,
  settled: boolean,
): PrinterCount[] {
  return (categories ?? []).flatMap((category) => {
    const named = names?.[category.category];
    if (named === undefined || category.points === 0) return [];
    if (meaningOf(named, TIMED) !== null) return [];
    if (!settled && meaningOf(named, UNSETTLED) !== null) return [];
    return [{ name: wordsOf(named).name, value: category.value }];
  });
}
