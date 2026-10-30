import { type Club, type Fixture, type FootballPlayer, type PlayerOwner, type PrinterCount, type PrinterKind, type PrinterLine, DASH } from "@epl/core";

// One vidiprinter line in words: the clock, what happened, the man and his holder, and the match or his club.

/** A man on a line, and who holds him; null owner for a man on no roster. */
export interface PrinterMan {
  name: string;
  ownerTeamId: string | null;
}

export interface PrinterRow {
  key: string;
  /** `KO`, `HT`, `FT`, a minute `7′`, or the dash for a count the feed gives no minute. */
  clock: string;
  /** Null on a count line, which is the man and his counts alone. */
  word: string | null;
  /** A sending-off is the one loss the line prints in red. */
  loss: boolean;
  man: PrinterMan | null;
  /** The assister, on a goal. */
  second: PrinterMan | null;
  /** The match and its score on a whistle and a goal; his club on the rest. */
  where: string | null;
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
  off: "Off",
  tally: null,
};

const WHISTLES: Partial<Record<PrinterKind, string>> = { "kick-off": "KO", "half-time": "HT", "full-time": "FT" };

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

  const scored = line.kind === "goal" || line.kind === "penalty-goal" || line.kind === "own-goal";
  const whistle = WHISTLES[line.kind];
  let where: string | null = null;
  if (whistle !== undefined || scored) {
    const score = line.kind === "kick-off" || line.score === null ? " v " : ` ${line.score.home}–${line.score.away} `;
    where = `${home ?? DASH}${score}${away ?? DASH}`;
  } else if (line.man !== null) {
    const club = players.get(line.man)?.clubId;
    where = club === undefined ? null : (clubs.get(club)?.shortName ?? null);
  }

  return {
    key: line.key,
    clock: whistle ?? (line.minute === null ? DASH : `${line.minute}′`),
    word: WORDS[line.kind],
    loss: line.kind === "sent-off",
    man: man(line.man),
    second: man(line.second),
    where,
    counts: line.counts,
  };
}
