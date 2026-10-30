import type { SheetMoment, SheetMomentKind } from "../football/premierleague/sheetMoments";
import type { Fixture, FootballPlayer, MatchEvent, MatchEventKind } from "../football/types";
import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  DEFCON,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_WORK,
  MINUTES,
  OWN_GOALS,
  RED_CARDS,
  YELLOW_CARDS,
  meaningOf,
} from "../league/categoryNames";
import { wordsOf } from "../league/categoryWords";
import type { LivePlayerCategory } from "../league/points";
import type { LeagueScoring, ScoringCategory } from "../league/scoring";
import { HALF, goalLines, halfAt, placeIn } from "./printerGoals";
import { actionPoints } from "./printerPoints";

// Live's vidiprinter: the match feed's timed moments for everyone, and the league's points for drafted men.

/** `sub` and `injury` are one change with both men; `tally` is one drafted man's counts at his full time. */
export type PrinterKind = Exclude<SheetMomentKind, "goal" | "second-half" | "on" | "off"> | MatchEventKind | "sub" | "injury" | "tally";

/** One of a drafted man's league categories, in plain words, with what he did and the league's points for it. */
export interface PrinterCount {
  name: string;
  value: string | null;
  points: number;
  /** Which family it is, for its icon; null for the rest. */
  sort: "defcon" | "keeper" | null;
}

export interface PrinterLine {
  key: string;
  fixtureCode: number;
  kind: PrinterKind;
  /** Null on a count line, which the feed gives no minute. */
  minute: string | null;
  at: number | null;
  /** FPL `code`: the scorer, the booked man, the man coming on; null on a whistle. */
  man: number | null;
  /** What the action earned him at his slot; null for a man in no eleven or an action the league does not price. */
  points: number | null;
  /** The assister on a goal; the man taken off on a change. */
  second: number | null;
  secondPoints: number | null;
  score: { home: number; away: number } | null;
  /** The league's counts the feed does not time: the man taken off's on his change, else his own at full time. */
  counts: PrinterCount[];
}

/** A drafted man's categories this period, as the league priced them. */
export interface PrinterTally {
  code: number;
  categories: readonly LivePlayerCategory[];
}

/** What the feed prints with a minute of its own, or what is every man's, so the counts never say it. */
const UNCOUNTED = [GOALS, ASSISTS_TOTAL, ASSISTS_OFFICIAL, ASSISTS_FANTASY, YELLOW_CARDS, RED_CARDS, OWN_GOALS, MINUTES];
/** Goals conceded never print (Craig, 30 Oct 2026: "remove goals conceded rows"). */
const UNPRINTED = [GOALS_AGAINST, GOALS_AGAINST_OUTFIELD];

/** A whistle's place in its match: kick-off first, half-time after the first half's last event, full time after all. */
const WHISTLE_PLACE: Partial<Record<SheetMomentKind, number>> = { "kick-off": 0, "half-time": 1.5 * HALF, "full-time": 2.5 * HALF };
/** Counts the full-time whistle settles print under it. */
const SETTLED_PLACE = 2.5 * HALF - 1;

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
  /** The elevens: FPL code → the slot his manager played him in. */
  slots: ReadonlyMap<number, string>;
  scoring: LeagueScoring | null;
  /** By fixture, the men the commentary says went off injured. */
  injured: ReadonlyMap<number, ReadonlySet<number>>;
  /** The elevens' counts. */
  tallies: readonly PrinterTally[];
  names: Record<string, ScoringCategory> | undefined;
}): PrinterLine[] {
  const { drafted, slots, scoring } = input;
  const moments = input.moments.filter((m) => m.at !== null && m.at <= input.now);
  const clubOf = new Map(input.players.map((player) => [player.code, player.clubId]));
  const fixtures = new Map(input.fixtures.map((fixture) => [fixture.code, fixture]));
  const priced = (line: PrinterLine): PrinterLine => ({
    ...line,
    points: line.man === null ? null : actionPoints(line.kind, "first", slots.get(line.man), scoring),
    secondPoints: line.second === null ? null : actionPoints(line.kind, "second", slots.get(line.second), scoring),
  });
  const placed: Placed[] = goalLines({ now: input.now, goals: input.goals, moments, fixtures, clubOf }).map((p) => ({ ...p, line: priced(p.line) }));
  const blank = { man: null, points: null, second: null, secondPoints: null, score: null, counts: [] };

  const tallies = new Map(input.tallies.map((tally) => [tally.code, tally.categories]));
  const counted = new Set<number>();
  // A change's ON and OFF share the feed's id: one line, the man coming on first.
  const changes = Map.groupBy(
    moments.filter((m) => m.kind === "on" || m.kind === "off"),
    (m) => (m.id === null ? m.key : `${m.fixtureCode}:${m.id}`),
  );
  for (const halves of changes.values()) {
    const on = halves.find((m) => m.kind === "on")?.man ?? null;
    const off = halves.find((m) => m.kind === "off")?.man ?? null;
    if (!(on !== null && drafted.has(on)) && !(off !== null && drafted.has(off))) continue;
    const m = halves[0] as SheetMoment;
    if (off !== null) counted.add(off);
    const kind = off !== null && input.injured.get(m.fixtureCode)?.has(off) === true ? "injury" : "sub";
    const counts = off === null ? [] : countsOf(tallies.get(off), input.names);
    const line: PrinterLine = { ...blank, key: m.key, fixtureCode: m.fixtureCode, kind, minute: m.minute, at: m.at, man: on, second: off, counts };
    placed.push({ line, place: placeIn(halfAt(m.half, m.seconds), m.seconds) });
  }
  for (const m of moments) {
    if (m.kind === "goal" || m.kind === "second-half" || m.kind === "on" || m.kind === "off") continue;
    // A booking is a drafted man's news; a red card is everybody's.
    if (m.kind === "booked" && (m.man === null || !drafted.has(m.man))) continue;
    if (m.kind === "sent-off" && m.man === null) continue;
    const place = WHISTLE_PLACE[m.kind] ?? placeIn(halfAt(m.half, m.seconds), m.seconds);
    placed.push({ line: priced({ ...blank, key: m.key, fixtureCode: m.fixtureCode, kind: m.kind, minute: m.minute, at: m.at, man: m.man, score: m.score }), place });
  }

  const byFixture = Map.groupBy(moments, (m) => m.fixtureCode);
  for (const [code, categories] of tallies) {
    if (counted.has(code)) continue;
    const club = clubOf.get(code);
    // His club's latest match the feed has started, once it is over: a double gameweek's counts are both matches'.
    const fixture = input.fixtures.filter((f) => (f.homeClubId === club || f.awayClubId === club) && byFixture.has(f.code)).at(-1);
    const whistle = fixture === undefined ? undefined : byFixture.get(fixture.code)?.find((m) => m.kind === "full-time");
    if (fixture === undefined || whistle === undefined) continue;
    const counts = countsOf(categories, input.names);
    if (counts.length === 0) continue;
    const line: PrinterLine = { ...blank, key: `tally:${fixture.code}:${code}`, fixtureCode: fixture.code, kind: "tally", minute: null, at: whistle.at, man: code, counts };
    placed.push({ line, place: SETTLED_PLACE });
  }

  return printOrder(placed);
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

/** The league categories that moved his total and that no line of the feed prints; read once he is off or it is over. */
function countsOf(categories: readonly LivePlayerCategory[] | undefined, names: Record<string, ScoringCategory> | undefined): PrinterCount[] {
  return (categories ?? []).flatMap((category) => {
    const named = names?.[category.category];
    if (named === undefined || category.points === 0) return [];
    if (meaningOf(named, UNCOUNTED) !== null || meaningOf(named, UNPRINTED) !== null) return [];
    const sort = meaningOf(named, DEFCON) !== null ? "defcon" : meaningOf(named, KEEPER_WORK) !== null ? "keeper" : null;
    // Either DefCon tier is DefCon here (Craig, 30 Oct 2026: "remove + from defcon"); its points say which.
    return [{ name: sort === "defcon" ? "DefCon" : wordsOf(named).name, value: category.value, points: category.points, sort }];
  });
}
