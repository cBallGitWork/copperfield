import { describe, expect, it } from "vitest";
import type { SheetMoment, SheetMomentKind } from "../football/premierleague/sheetMoments";
import type { MatchEvent } from "../football/types";
import type { LivePlayerCategory } from "../league/points";
import type { ScoringCategory, ScoringRules } from "../league/scoring";
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

const moment = (
  fixtureCode: number,
  kind: SheetMomentKind,
  minute: number,
  man: number | null = null,
  score?: [number, number],
  over: Partial<SheetMoment> = {},
): SheetMoment => ({
  key: `${fixtureCode}:${kind}:${minute}:${man ?? ""}`,
  fixtureCode,
  kind,
  minute: String(minute),
  seconds: minute * 60,
  half: kind === "half-time" || (kind !== "full-time" && kind !== "second-half" && minute <= 45) ? 1 : 2,
  at: KO + minute * MIN,
  man,
  score: score === undefined ? null : { home: score[0], away: score[1] },
  id: null,
  ...over,
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
const rules: ScoringRules = {
  goaliePosition: "G",
  goalie: { YC: { Default: -1 } },
  outfield: { G: { D: 6, M: 5, F: 4 }, YC: { Default: -1 } },
};
const scoring = { rules, categories: names };
/** The eleven, at the slots their managers played them in; Saliba sits on a bench. */
const slots = new Map([
  [SAKA, "M"],
  [RAYA, "G"],
  [PICKFORD, "G"],
  [PALMER, "M"],
]);
const scored = (category: string, value: string, points = 1): LivePlayerCategory => ({ category, points, value });
const drafted = new Set([SAKA, RAYA, SALIBA, PICKFORD, PALMER]);

const moments: SheetMoment[] = [
  moment(900, "kick-off", 0, null, [0, 0]),
  moment(900, "goal", 7, null, [1, 0]),
  moment(900, "booked", 30, PICKFORD),
  moment(900, "booked", 31, FREE_MAN),
  moment(900, "half-time", 45, null, [1, 0]),
  moment(900, "second-half", 45, null, [1, 0], { at: KO + 46 * MIN }),
  moment(900, "on", 70, RAYA, undefined, { id: 1 }),
  moment(900, "off", 70, SAKA, undefined, { id: 1 }),
  moment(900, "on", 71, PICKFORD, undefined, { id: 2 }),
  moment(900, "off", 71, FREE_MAN, undefined, { id: 2 }),
  moment(900, "sent-off", 80, FREE_MAN),
  moment(900, "full-time", 95, null, [1, 0]),
  moment(901, "kick-off", 120, null, [0, 0]),
  moment(901, "booked", 140, PALMER),
];

const LATER = KO + 1_000 * MIN;
const lines = vidiprinter({
  now: LATER,
  goals: [goal(900, 7, SAKA, FREE_MAN)],
  moments,
  fixtures,
  players,
  drafted,
  slots,
  scoring,
  injured: new Map([[900, new Set([FREE_MAN])]]),
  tallies: [
    { code: SAKA, categories: [scored("1#min", "70", 2), scored("1#g", "1", 5), scored("1#dfp", "1", 2)] },
    { code: RAYA, categories: [scored("1#min", "90", 2), scored("2#sv", "3"), scored("1#cs", "1", 4)] },
    { code: SALIBA, categories: [] },
    { code: PICKFORD, categories: [scored("1#min", "24", 1)] },
    { code: PALMER, categories: [scored("1#min", "20"), scored("1#yc", "1", -1), scored("1#dfp", "1", 2), scored("9#unknown", "4")] },
  ],
  names,
});

const kinds = (of: readonly PrinterLine[]) => of.map((line) => `${line.kind}${line.man === null ? "" : `:${line.man}`}`);

describe("vidiprinter", () => {
  it("runs strictly newest first across matches, a whistle above what it settles, with no match heading", () => {
    expect(kinds(lines)).toEqual([
      "booked:30",
      "kick-off",
      "full-time",
      "tally:11",
      "sent-off:21",
      "injury:20",
      "sub:11",
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

  it("prices an action for a man in an eleven at his slot, and nothing for anybody else", () => {
    const scoredBy = lines.find((line) => line.kind === "goal");
    expect([scoredBy?.points, scoredBy?.secondPoints]).toEqual([5, null]);
    expect(lines.filter((line) => line.kind === "booked").map((line) => line.points)).toEqual([-1, -1]);
    expect(lines.find((line) => line.kind === "sent-off")?.points).toBeNull();
  });

  it("prints a booking only for a drafted man, and a change when either man is, both men on one line", () => {
    expect(lines.filter((line) => line.kind === "booked").map((line) => line.man)).toEqual([PALMER, PICKFORD]);
    const change = lines.find((line) => line.kind === "sub");
    expect([change?.man, change?.second, change?.minute]).toEqual([RAYA, SAKA, "70"]);
  });

  it("marks a change the commentary says was for an injury, and only that one", () => {
    const hurt = lines.filter((line) => line.kind === "injury");
    expect(hurt.map((line) => [line.man, line.second])).toEqual([[PICKFORD, FREE_MAN]]);
  });

  it("puts the man taken off's league counts on his change, with their points, leaving out minutes and what the feed times", () => {
    expect(lines.find((line) => line.kind === "sub")?.counts).toEqual([{ name: "DefCon", value: "1", points: 2, sort: "defcon" }]);
  });

  it("settles a man who finished at the full-time whistle, and prints nobody whose only count is his minutes", () => {
    const raya = lines.find((line) => line.kind === "tally" && line.man === RAYA);
    expect(raya?.at).toBe(KO + 95 * MIN);
    expect(raya?.minute).toBeNull();
    expect(raya?.counts).toEqual([
      { name: "Saves", value: "3", points: 1, sort: "keeper" },
      { name: "Clean sheets", value: "1", points: 4, sort: null },
    ]);
    expect(lines.some((line) => line.kind === "tally" && (line.man === SALIBA || line.man === PICKFORD))).toBe(false);
  });

  it("prints no counts for a man whose match is still in play", () => {
    expect(lines.some((line) => line.kind === "tally" && line.man === PALMER)).toBe(false);
  });

  it("prints nothing for a match the feed has not started", () => {
    const quiet = vidiprinter({
      now: LATER,
      goals: [],
      moments: [],
      fixtures,
      players,
      drafted,
      slots,
      scoring,
      injured: new Map(),
      tallies: [{ code: SAKA, categories: [scored("1#dfp", "1")] }],
      names,
    });
    expect(quiet).toEqual([]);
  });
});

const arsenalEverton = moments.filter((m) => m.fixtureCode === 900);
const upTo = (now: number) => arsenalEverton.filter((m) => m.at !== null && m.at <= now);

/** The printer over Arsenal v Everton alone, at `now`, with every one of its moments unless given others. */
const printAt = (now: number, over: { goals?: MatchEvent[]; moments?: SheetMoment[] } = {}) =>
  vidiprinter({
    now,
    goals: over.goals ?? [],
    moments: over.moments ?? arsenalEverton,
    fixtures,
    players,
    drafted,
    slots,
    scoring,
    injured: new Map(),
    tallies: [],
    names,
  });

describe("vidiprinter, at a moment in time", () => {
  it("never prints what happened after now: a goal the round read holds, or a moment", () => {
    const now = KO + 20 * MIN;
    expect(kinds(printAt(now, { goals: [goal(900, 7, SAKA), goal(900, 60, SAKA)] }))).toEqual(["goal:10", "kick-off"]);
  });

  it("times a goal the feed has not filed off its half's restart, so the half-time break does not let it out early", () => {
    // 60′ is fifteen minutes into a second half that restarted at KO + 46′.
    const at = (now: number) => printAt(now, { goals: [goal(900, 60, SAKA)], moments: upTo(now) }).find((line) => line.kind === "goal");
    expect(at(KO + 60 * MIN)).toBeUndefined();
    expect(at(KO + 61 * MIN)?.at).toBe(KO + 61 * MIN);
  });

  it("gives a goal the feed has not filed the score it made, counted from the match's goals up to it", () => {
    const at = printAt(LATER, {
      goals: [goal(900, 7, SAKA), goal(900, 50, PICKFORD), goal(900, 52, SAKA), { ...goal(900, 80, PICKFORD), kind: "own-goal" }],
    });
    const scores = at.filter((line) => line.man !== null && line.score !== null).map((line) => [line.minute, line.score]);
    expect(scores).toEqual([
      ["80", { home: 3, away: 1 }],
      ["52", { home: 2, away: 1 }],
      ["50", { home: 1, away: 1 }],
      ["7", { home: 1, away: 0 }],
    ]);
  });

  it("prints no assister on an own goal", () => {
    const at = printAt(LATER, { goals: [{ ...goal(900, 80, PICKFORD, SAKA), kind: "own-goal" }] });
    expect(at.find((line) => line.kind === "own-goal")?.second).toBeNull();
  });

  it("keeps one match in match order: a stoppage-time card filed after the whistle still prints under it", () => {
    const late = moment(900, "booked", 95, PICKFORD, undefined, { minute: "90+5", seconds: 5700, at: KO + 97 * MIN });
    const firstHalf = moment(900, "booked", 45, SAKA, undefined, { minute: "45+3", seconds: 2880, half: 1, at: KO + 46 * MIN });
    const order = kinds(printAt(LATER, { moments: [...arsenalEverton, late, firstHalf] }));
    expect(order[0]).toBe("full-time");
    expect(order.indexOf("half-time")).toBeLessThan(order.indexOf("booked:10"));
    expect(order.indexOf("half-time")).toBeGreaterThan(order.indexOf("sub:11"));
  });

});
