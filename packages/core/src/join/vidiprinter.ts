import { bareMinute } from "../football/premierleague/fixtureEvents";
import type { SheetMoment } from "../football/premierleague/sheetMoments";
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

// Live's vidiprinter: the match feed's timed moments for everyone, and the league's scoring counts for drafted men.

export type PrinterKind = Exclude<SheetMoment["kind"], "goal"> | MatchEventKind | "tally";

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

/** On one instant: a live count first, then the whistle, the event, and last the counts a whistle settles. */
const RANK: Partial<Record<PrinterKind, number>> = { "kick-off": 1, "half-time": 1, "full-time": 1, tally: 3 };
const LIVE_TALLY = 0;
const EVENT = 2;

/** Every line of the round, newest first; a match the feed has not started prints nothing. */
export function vidiprinter(input: {
  goals: readonly MatchEvent[];
  moments: readonly SheetMoment[];
  fixtures: readonly Pick<Fixture, "code" | "homeClubId" | "awayClubId">[];
  players: readonly Pick<FootballPlayer, "code" | "clubId">[];
  /** FPL codes on any roster. */
  drafted: ReadonlySet<number>;
  tallies: readonly PrinterTally[];
  names: Record<string, ScoringCategory> | undefined;
}): PrinterLine[] {
  const { goals, moments, drafted } = input;
  const ranked: { line: PrinterLine; rank: number }[] = [];
  const push = (line: PrinterLine, rank = RANK[line.kind] ?? EVENT) => ranked.push({ line, rank });
  const blank = { second: null, score: null, counts: [] };

  const sheetGoal = new Map(moments.filter((m) => m.kind === "goal").map((m) => [`${m.fixtureCode}:${m.seconds}`, m]));
  for (const event of goals) {
    const stamp = sheetGoal.get(`${event.fixtureCode}:${event.seconds}`);
    push({
      key: `goal:${event.id}`,
      fixtureCode: event.fixtureCode,
      kind: event.kind,
      minute: bareMinute(event.minute),
      at: stamp?.at ?? event.absolute,
      man: event.players[0] ?? null,
      second: event.players[1] ?? null,
      score: stamp?.score ?? null,
      counts: [],
    });
  }

  const tallies = new Map(input.tallies.map((tally) => [tally.code, tally.categories]));
  const counted = new Set<number>();
  for (const m of moments) {
    if (m.kind === "goal") continue;
    const man = m.man;
    // A booking and a change are a drafted man's news; a red card is everybody's.
    if ((m.kind === "booked" || m.kind === "off") && (man === null || !drafted.has(man))) continue;
    if (m.kind === "sent-off" && man === null) continue;
    const counts = m.kind === "off" && man !== null ? countsOf(tallies.get(man), input.names, true) : [];
    if (m.kind === "off" && man !== null) counted.add(man);
    push({ ...blank, key: m.key, fixtureCode: m.fixtureCode, kind: m.kind, minute: m.minute, at: m.at, man, score: m.score, counts });
  }

  const byFixture = Map.groupBy(moments, (m) => m.fixtureCode);
  const clubOf = new Map(input.players.map((player) => [player.code, player.clubId]));
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
    const latest = Math.max(...own.map((m) => m.at ?? 0));
    const line = { ...blank, key: `tally:${fixture.code}:${code}`, fixtureCode: fixture.code, kind: "tally" as const, minute: null, man: code, counts };
    if (whistle === undefined) push({ ...line, at: latest }, LIVE_TALLY);
    else push({ ...line, at: whistle.at });
  }

  return ranked
    .sort((a, b) => (b.line.at ?? 0) - (a.line.at ?? 0) || a.rank - b.rank)
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
