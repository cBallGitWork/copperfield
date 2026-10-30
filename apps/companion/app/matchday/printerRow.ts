import { type Club, type Fixture, type FootballPlayer, type PlayerOwner, type PrinterCount, type PrinterKind, type PrinterLine, DASH } from "@epl/core";

// One vidiprinter line in words: the clock, what happened, the man and his holder, and the match or his club.

/** A man on a line, and who holds him; null owner for a man on no roster. */
export interface PrinterMan {
  name: string;
  ownerTeamId: string | null;
}

export interface PrinterRow {
  key: string;
  /** `KO`, `HT`, `FT` or a minute `7′`; blank on a count line or a match's heading, which the feed gives no minute. */
  clock: string;
  /** Null on a count line, which is the man and his counts alone. */
  word: string | null;
  /** A sending-off is the one loss the line prints in red. */
  loss: boolean;
  /** A match's heading while it is played. */
  live: boolean;
  man: PrinterMan | null;
  /** The assister, on a goal. */
  second: PrinterMan | null;
  /** The match on a whistle, a goal and a heading, its score null before one stands. */
  match: { home: string; score: string | null; away: string } | null;
  /** His club, on the rest. */
  club: string | null;
  /** The league's counts in its own words, each with what he did. */
  counts: PrinterCount[];
}

const WORDS: Record<PrinterKind, string | null> = {
  "kick-off": "Kick-off",
  "half-time": "Half-time",
  "full-time": "Full time",
  goal: "Goal",
  "penalty-goal": "Penalty",
  "own-goal": "Own goal",
  booked: "Booked",
  "sent-off": "Sent off",
  on: "On",
  off: "Off",
  tally: null,
  "in-play": "In play",
};

const WHISTLES: Partial<Record<PrinterKind, string>> = { "kick-off": "KO", "half-time": "HT", "full-time": "FT" };

/** The lines that name their match rather than a man's club, besides a whistle. */
const MATCHED = new Set<PrinterKind>(["goal", "penalty-goal", "own-goal", "in-play"]);

/** The line as printed; a man the snapshot cannot name prints the dash. */
export function printerRow(
  line: PrinterLine,
  fixtures: ReadonlyMap<number, Pick<Fixture, "homeClubId" | "awayClubId">>,
  clubs: ReadonlyMap<number, Club>,
  players: ReadonlyMap<number, Pick<FootballPlayer, "name" | "clubId">>,
  owners: ReadonlyMap<number, PlayerOwner>,
): PrinterRow {
  const fixture = fixtures.get(line.fixtureCode);
  const home = fixture === undefined ? undefined : clubs.get(fixture.homeClubId)?.name;
  const away = fixture === undefined ? undefined : clubs.get(fixture.awayClubId)?.name;
  const man = (code: number | null): PrinterMan | null =>
    code === null ? null : { name: players.get(code)?.name ?? DASH, ownerTeamId: owners.get(code)?.teamId ?? null };

  const whistle = WHISTLES[line.kind];
  const matched = whistle !== undefined || MATCHED.has(line.kind);
  const score = line.kind === "kick-off" || line.score === null ? null : `${line.score.home}–${line.score.away}`;
  const clubId = matched || line.man === null ? undefined : players.get(line.man)?.clubId;

  return {
    key: line.key,
    clock: whistle ?? (line.minute === null ? "" : `${line.minute}′`),
    word: WORDS[line.kind],
    loss: line.kind === "sent-off",
    live: line.kind === "in-play",
    man: man(line.man),
    second: man(line.second),
    match: matched ? { home: home ?? DASH, score, away: away ?? DASH } : null,
    club: clubId === undefined ? null : (clubs.get(clubId)?.shortName ?? null),
    counts: line.counts,
  };
}
