import { describe, expect, it } from "vitest";
import type { SheetMoment, SheetMomentKind } from "../football/premierleague/sheetMoments";
import type { MatchEvent } from "../football/types";
import type { LivePlayerCategory } from "../league/points";
import type { ScoringCategory } from "../league/scoring";
import { type PrinterLine, vidiprinter } from "./vidiprinter";

// Arsenal (club 1) v Everton (club 2), fixture code 900; Chelsea (3) v Spurs (4), code 901, still in play.
const KO = 1_000_000;
const MIN = 60_000;
const SAKA = 10;
const RAYA = 11;
const SALIBA = 12;
const PICKFORD = 20;
const FREE_MAN = 21;
const PALMER = 30;
const players = [
  { code: SAKA, clubId: 1 },
  { code: RAYA, clubId: 1 },
  { code: SALIBA, clubId: 1 },
  { code: PICKFORD, clubId: 2 },
  { code: FREE_MAN, clubId: 2 },
  { code: PALMER, clubId: 3 },
];
const fixtures = [
  { code: 900, homeClubId: 1, awayClubId: 2 },
  { code: 901, homeClubId: 3, awayClubId: 4 },
];

const moment = (fixtureCode: number, kind: SheetMomentKind, minute: number, man: number | null = null, score?: [number, number]): SheetMoment => ({
  key: `${fixtureCode}:${kind}:${minute}:${man ?? ""}`,
  fixtureCode,
  kind,
  minute: String(minute),
  seconds: minute * 60,
  at: KO + minute * MIN,
  man,
  score: score === undefined ? null : { home: score[0], away: score[1] },
});

const goal = (fixtureCode: number, minute: number, scorer: number, assister: number | null = null): MatchEvent => ({
  id: fixtureCode * 100_000 + minute * 60,
  fixtureCode,
  kind: "goal",
  minute: String(minute).padStart(2, "0"),
  seconds: minute * 60,
  // The round read's own stamp, which the sheet's wall clock overrides.
  absolute: KO,
  players: [scorer, assister],
});

const names: Record<string, ScoringCategory> = {
  "1#min": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
  "1#g": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
  "1#yc": { code: "YC", name: "Yellow Cards", longCode: "INDIVIDUAL_YELLOW_CARDS" },
  "1#dfp": { code: "DFP", name: "Defensive Points", longCode: "INDIVIDUAL_DEFENSIVE_POINTS" },
  "1#cs": { code: "CS", name: "Clean Sheets On Field", longCode: "INDIVIDUAL_SHUTOUTS_ON_FIELD" },
  "2#sv": { code: "Sv", name: "Saves", longCode: "INDIVIDUAL_SAVES" },
};
const scored = (category: string, value: string, points = 1): LivePlayerCategory => ({ category, points, value });

const moments: SheetMoment[] = [
  moment(900, "kick-off", 0, null, [0, 0]),
  moment(900, "goal", 7, null, [1, 0]),
  moment(900, "booked", 30, PICKFORD),
  moment(900, "booked", 31, FREE_MAN),
  moment(900, "half-time", 45, null, [1, 0]),
  moment(900, "off", 70, SAKA),
  moment(900, "off", 71, FREE_MAN),
  moment(900, "sent-off", 80, FREE_MAN),
  moment(900, "full-time", 95, null, [1, 0]),
  moment(901, "kick-off", 120, null, [0, 0]),
  moment(901, "booked", 140, PALMER),
];

const lines = vidiprinter({
  goals: [goal(900, 7, SAKA, FREE_MAN)],
  moments,
  fixtures,
  players,
  drafted: new Set([SAKA, RAYA, SALIBA, PICKFORD, PALMER]),
  tallies: [
    { code: SAKA, categories: [scored("1#min", "70", 2), scored("1#g", "1", 5), scored("1#dfp", "1", 2)] },
    { code: RAYA, categories: [scored("1#min", "90", 2), scored("2#sv", "3"), scored("1#cs", "1", 4)] },
    { code: SALIBA, categories: [] },
    { code: PALMER, categories: [scored("1#min", "20"), scored("1#yc", "1", -1), scored("1#dfp", "1", 2), scored("9#unknown", "4")] },
  ],
  names,
});

const kinds = (of: readonly PrinterLine[]) => of.map((line) => `${line.kind}${line.man === null ? "" : `:${line.man}`}`);

describe("vidiprinter", () => {
  it("runs newest first across matches, a whistle above what it settles", () => {
    expect(kinds(lines)).toEqual([
      "tally:30",
      "booked:30",
      "kick-off",
      "full-time",
      "tally:11",
      "sent-off:21",
      "off:10",
      "half-time",
      "booked:20",
      "goal:10",
      "kick-off",
    ]);
  });

  it("prints every man's goal, assist and red card, drafted or not", () => {
    const scoredBy = lines.find((line) => line.kind === "goal");
    expect(scoredBy?.second).toBe(FREE_MAN);
    expect(lines.some((line) => line.kind === "sent-off" && line.man === FREE_MAN)).toBe(true);
  });

  it("stamps a goal with the sheet's clock and score, not the round read's", () => {
    const scoredBy = lines.find((line) => line.kind === "goal");
    expect(scoredBy?.at).toBe(KO + 7 * MIN);
    expect(scoredBy?.score).toEqual({ home: 1, away: 0 });
    expect(scoredBy?.minute).toBe("7");
  });

  it("prints a booking and a change only for a drafted man", () => {
    expect(lines.filter((line) => line.kind === "booked").map((line) => line.man)).toEqual([PALMER, PICKFORD]);
    expect(lines.filter((line) => line.kind === "off").map((line) => line.man)).toEqual([SAKA]);
  });

  it("puts a substituted man's league counts on his change, leaving out what the feed already times", () => {
    const off = lines.find((line) => line.kind === "off");
    expect(off?.counts).toEqual([
      { name: "Minutes", value: "70" },
      { name: "DefCon", value: "1" },
    ]);
  });

  it("settles a man who finished at the full-time whistle, with nothing for a man who scored nothing", () => {
    const raya = lines.find((line) => line.kind === "tally" && line.man === RAYA);
    expect(raya?.at).toBe(KO + 95 * MIN);
    expect(raya?.minute).toBeNull();
    expect(raya?.counts.map((count) => count.name)).toEqual(["Minutes", "Saves", "Clean sheets"]);
    expect(lines.some((line) => line.man === SALIBA)).toBe(false);
  });

  it("gives a man still on the pitch what he has done so far, not his minutes, and drops a category the league never named", () => {
    const palmer = lines.find((line) => line.kind === "tally" && line.man === PALMER);
    expect(palmer?.counts).toEqual([{ name: "DefCon", value: "1" }]);
    expect(palmer?.at).toBe(KO + 140 * MIN);
  });

  it("prints nothing for a match the feed has not started", () => {
    const quiet = vidiprinter({ goals: [], moments: [], fixtures, players, drafted: new Set([SAKA]), tallies: [{ code: SAKA, categories: [scored("1#dfp", "1")] }], names });
    expect(quiet).toEqual([]);
  });
});
