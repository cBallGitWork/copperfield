import { type Club, type Fixture, type FootballPlayer, type PlayerOwner, type PrinterCount, type PrinterKind, type PrinterLine, DASH, signed } from "@epl/core";

// One vidiprinter line in words: what happened, the men with their clubs, holders and league points.

/** A man on a line: his club for the crest, who holds him, and what the action earned him. */
export interface PrinterMan {
  name: string;
  club: Club | null;
  /** The holder's team name; null for a man on no roster. */
  owner: { teamId: string; teamName: string } | null;
  /** The league's points, signed; null where none were earned or he is in no eleven. */
  points: string | null;
}

/** One side of a match on a whistle. */
interface PrinterSide {
  club: Club | null;
  name: string;
  /** Null before a score stands, at kick-off. */
  score: number | null;
}

export interface PrinterRow {
  key: string;
  kind: PrinterKind;
  /** The event's word; null on a man's full-time counts, which sit under the whistle. */
  word: string | null;
  /** `7′` on a man's line; `KO` or `FT` on a whistle, `FT` on a man's full-time counts (Craig, 30 Oct 2026). */
  minute: string | null;
  man: PrinterMan | null;
  /** The assister, or the man taken off, and the word before him. */
  second: { word: string; man: PrinterMan } | null;
  /** Both sides, on a whistle. */
  sides: [PrinterSide, PrinterSide] | null;
  /** The league's counts in its own words, each with what he did and its points. */
  counts: { name: string; value: string | null; points: string; sort: PrinterCount["sort"] }[];
}

const WORDS: Record<PrinterKind, string | null> = {
  "kick-off": "KO",
  "half-time": "HT",
  "full-time": "FT",
  goal: "Goal",
  "penalty-goal": "Pen",
  "own-goal": "OG",
  booked: "Booked",
  "sent-off": "Red",
  sub: "Sub",
  injury: "Injury",
  tally: null,
};

/** The word before the second man: an assister, or the man taken off, read "Mfuni for Thomas" as a sub is said. */
const SECOND_WORDS: Partial<Record<PrinterKind, string>> = { goal: "As", "penalty-goal": "As", sub: "for", injury: "for" };

const WHISTLES = new Set<PrinterKind>(["kick-off", "half-time", "full-time"]);
/** A goal and its assist carry no figure (Craig, 30 Oct 2026): the word says what it was worth. */
const UNPRICED = new Set<PrinterKind>(["goal", "penalty-goal"]);

/** A figure worth printing: a nought moved nothing. */
const pointsOf = (points: number | null): string | null => (points === null || points === 0 ? null : signed(points));

/** The line as printed; a man the snapshot cannot name prints the dash. */
export function printerRow(
  line: PrinterLine,
  fixtures: ReadonlyMap<number, Pick<Fixture, "homeClubId" | "awayClubId">>,
  clubs: ReadonlyMap<number, Club>,
  players: ReadonlyMap<number, Pick<FootballPlayer, "name" | "clubId">>,
  owners: ReadonlyMap<number, PlayerOwner>,
): PrinterRow {
  const fixture = fixtures.get(line.fixtureCode);
  const home = fixture === undefined ? null : (clubs.get(fixture.homeClubId) ?? null);
  const away = fixture === undefined ? null : (clubs.get(fixture.awayClubId) ?? null);
  const man = (code: number | null, points: number | null): PrinterMan | null => {
    if (code === null) return null;
    const player = players.get(code);
    const owner = owners.get(code);
    return {
      name: player?.name ?? DASH,
      club: player === undefined ? null : (clubs.get(player.clubId) ?? null),
      owner: owner === undefined ? null : { teamId: owner.teamId, teamName: owner.teamName },
      points: pointsOf(points),
    };
  };
  const priced = !UNPRICED.has(line.kind);
  const second = man(line.second, priced ? line.secondPoints : null);
  const secondWord = SECOND_WORDS[line.kind];
  const whistle = WHISTLES.has(line.kind);
  const score = line.kind === "kick-off" ? null : line.score;

  return {
    key: line.key,
    kind: line.kind,
    word: WORDS[line.kind],
    minute: whistle ? WORDS[line.kind] : line.kind === "tally" ? WORDS["full-time"] : line.minute === null ? null : `${line.minute}′`,
    man: man(line.man, priced ? line.points : null),
    second: second === null || secondWord === undefined ? null : { word: secondWord, man: second },
    sides: whistle
      ? [
          { club: home, name: home?.shortName ?? DASH, score: score?.home ?? null },
          { club: away, name: away?.shortName ?? DASH, score: score?.away ?? null },
        ]
      : null,
    counts: line.counts.map((count) => ({ name: count.name, value: count.value, points: signed(count.points), sort: count.sort })),
  };
}
