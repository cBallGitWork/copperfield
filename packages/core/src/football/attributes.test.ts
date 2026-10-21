import { describe, expect, it } from "vitest";
import { ATTRIBUTE_ROWS, attributes, divisionAttributes, ratedLine, ratedRunning } from "./attributes";
import type { Scouted } from "./attributes";
import { LINE_COUNTS } from "./intel/lines";
import type { Running, PlayerLine } from "./intel/lines";

const line = (over: Partial<PlayerLine> = {}): PlayerLine => ({
  code: 1,
  minutes: 900,
  starts: 10,
  fplMinutes: 900,
  ratings: [],
  running: null,
  ...(Object.fromEntries(LINE_COUNTS.map((key) => [key, 0])) as Record<(typeof LINE_COUNTS)[number], number>),
  ...over,
});

const man = (over: Partial<PlayerLine> = {}, rest: Partial<Scouted> = {}): Scouted => ({
  code: 1,
  keeper: false,
  line: line(over),
  running: null,
  penaltyShare: 0,
  setPieceShare: 0,
  ...rest,
});

/** Ten men on a spread of tackle counts, so a percentile has something to rank against. */
const league = Array.from({ length: 10 }, (_, i) => man({ tackles: i }));

const ratingOf = (grid: ReturnType<typeof attributes>, name: string) => grid.find((a) => a.name === name)?.rating ?? null;

describe("attributes", () => {
  it("rates on Championship Manager's 1–20 and never outside it", () => {
    for (const subject of league) {
      for (const attribute of attributes(subject, league)) {
        if (attribute.rating === null) continue;
        expect(attribute.rating).toBeGreaterThanOrEqual(1);
        expect(attribute.rating).toBeLessThanOrEqual(20);
      }
    }
  });

  it("orders the league — better figure, better rating, all the way down", () => {
    const ratings = league.map((subject) => ratingOf(attributes(subject, league), "Tackling"));
    expect(ratings).toEqual([...ratings].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(ratings[9]).toBeGreaterThan(ratings[0] ?? 0);
  });

  it("reaches both ends of the scale on a real-sized league", () => {
    const big = Array.from({ length: 225 }, (_, i) => man({ tackles: i }));
    expect(ratingOf(attributes(big[224], big), "Tackling")).toBe(20);
    expect(ratingOf(attributes(big[0], big), "Tackling")).toBe(1);
  });

  it("gives men on the same figure the same rating, at the bottom of a block of noughts", () => {
    const level = Array.from({ length: 6 }, () => man({ tackles: 0 }));
    const grid = level.map((subject) => ratingOf(attributes(subject, level), "Tackling"));
    expect(new Set(grid)).toEqual(new Set([1]));
  });

  it("rates per 90 of his minutes, not on his total", () => {
    const busy = man({ minutes: 900, tackles: 20 });
    const sharp = man({ minutes: 450, tackles: 15 });
    const cohort = [busy, sharp, ...league];
    expect(ratingOf(attributes(sharp, cohort), "Tackling")).toBeGreaterThan(ratingOf(attributes(busy, cohort), "Tackling") ?? 0);
  });

  it("rates FPL's figures per 90 of the minutes FPL covered", () => {
    const covered = man({ minutes: 900, fplMinutes: 450, influence: 200 });
    const whole = man({ minutes: 900, fplMinutes: 900, influence: 300 });
    const cohort = [covered, whole];
    expect(ratingOf(attributes(covered, cohort), "Influence")).toBeGreaterThan(ratingOf(attributes(whole, cohort), "Influence") ?? 0);
  });

  it("rates nothing on FPL's bonus-points score, which belongs on the FPL tab alone", () => {
    expect(attributes(man(), [man()]).map((attribute) => attribute.from).join(" ")).not.toMatch(/bonus/i);
  });

  it("rates finishing on expected goals on target, so the striker who hits the target most rates highest", () => {
    const striker = man({ xgot: 20 });
    const centreHalf = man({ xgot: 1 });
    const cohort = [striker, centreHalf, ...league];
    expect(ratingOf(attributes(striker, cohort), "Finishing")).toBeGreaterThan(ratingOf(attributes(centreHalf, cohort), "Finishing") ?? 0);
  });

  it("rates work rate, pace and acceleration on this season's running", () => {
    const run = (km: number, sprints: number, topSpeed: number): Running => ({ minutes: 450, km, sprints, topSpeed });
    const runner = man({}, { running: run(55, 100, 33) });
    const walker = man({}, { running: run(45, 60, 35) });
    const cohort = [runner, walker];
    expect(ratingOf(attributes(runner, cohort), "Work Rate")).toBeGreaterThan(ratingOf(attributes(walker, cohort), "Work Rate") ?? 0);
    expect(ratingOf(attributes(walker, cohort), "Pace")).toBeGreaterThan(ratingOf(attributes(runner, cohort), "Pace") ?? 0);
    expect(ratingOf(attributes(man(), cohort), "Work Rate")).toBeNull();
  });

  it("rates consistency on how good his bad days are, not on how much his rating swings", () => {
    // A striker's rating swings with his goals; his worst games still count as good.
    const striker = man({ ratings: [9.5, 8.8, 7.4, 7.2, 9.1, 7.3, 8.9, 7.5] });
    const plodder = man({ ratings: [6.6, 6.5, 6.7, 6.6, 6.5, 6.6, 6.7, 6.5] });
    const cohort = [striker, plodder];
    expect(ratingOf(attributes(striker, cohort), "Consistency")).toBeGreaterThan(ratingOf(attributes(plodder, cohort), "Consistency") ?? 0);
    expect(ratingOf(attributes(man({ ratings: [7, 7, 7] }), cohort), "Consistency")).toBeNull();
  });

  it("rates a keeper against keepers only, on a keeper's rows", () => {
    // Handling is his save share, so a keeper behind a tight defence is not marked down for idleness.
    const keeper = man({ saves: 60, conceded: 20 }, { keeper: true });
    const other = man({ saves: 30, conceded: 5 }, { keeper: true });
    const grid = attributes(keeper, [keeper, other, ...league]);
    expect(ratingOf(grid, "Handling")).toBe(1);
    expect(grid.map((a) => a.name)).toEqual(ATTRIBUTE_ROWS.filter((row) => row.for !== "outfield").map((row) => row.name));
    expect(grid.some((a) => a.name === "Finishing")).toBe(false);
    expect(attributes(league[0], league).some((a) => a.name === "Handling")).toBe(false);
  });

  it("says nothing about a man with no season to rate", () => {
    const grid = attributes(man({}, { line: null, penaltyShare: null, setPieceShare: null }), league);
    expect(grid.every((a) => a.rating === null)).toBe(true);
    expect(grid.length).toBeGreaterThan(0);
  });

  it("says nothing of his club's set pieces when he has no season to rate", () => {
    const unseen = man({}, { line: null, penaltyShare: 0, setPieceShare: 0 });
    const grid = attributes(unseen, [unseen, ...league]);
    expect(ratingOf(grid, "Penalty Taking")).toBeNull();
    expect(ratingOf(grid, "Set Pieces")).toBeNull();
  });

  it("leaves set pieces blank when the sister repo has no file for his club", () => {
    const untold = man({}, { setPieceShare: null });
    expect(ratingOf(attributes(untold, [untold, ...league]), "Set Pieces")).toBeNull();
  });

  it("says nothing of penalties or set pieces he does not take, and rates a taker among takers", () => {
    const none = man({}, { code: 1, penaltyShare: 0, setPieceShare: 0 });
    const second = man({}, { code: 2, penaltyShare: 0.2, setPieceShare: 0.3 });
    const first = man({}, { code: 3, penaltyShare: 0.8, setPieceShare: 1.2 });
    const cohort = [none, second, first, ...Array.from({ length: 30 }, () => none)];
    expect(ratingOf(attributes(none, cohort), "Penalty Taking")).toBeNull();
    expect(ratingOf(attributes(none, cohort), "Set Pieces")).toBeNull();
    expect(ratingOf(attributes(second, cohort), "Penalty Taking")).toBe(1);
    expect(ratingOf(attributes(first, cohort), "Penalty Taking")).toBe(11);
  });

  it("reads anticipation at either end, so a striker who lives in their box rates as high as a ball-winner", () => {
    const ballWinners = Array.from({ length: 10 }, (_, i) => man({ recoveries: i, boxTouches: 0 }));
    const striker = man({ recoveries: 0, boxTouches: 50 });
    const centreHalf = man({ recoveries: 0, boxTouches: 0, interceptions: 40 });
    const cohort = [striker, centreHalf, ...ballWinners];
    const anticipation = (subject: Scouted) => ratingOf(attributes(subject, cohort), "Anticipation") ?? 0;
    const top = Math.max(...cohort.map(anticipation));
    expect(anticipation(striker)).toBe(top);
    expect(anticipation(centreHalf)).toBe(top);
    expect(anticipation(ballWinners[9])).toBeGreaterThan(anticipation(ballWinners[8]));
    expect(anticipation(ballWinners[0])).toBe(1);
  });

  it("reads a keeper's anticipation on his recoveries alone, never on his clearances", () => {
    const sweeper = man({ recoveries: 30, clearances: 0 }, { keeper: true });
    const clearer = man({ recoveries: 5, clearances: 60 }, { keeper: true });
    const cohort = [sweeper, clearer];
    expect(ratingOf(attributes(sweeper, cohort), "Anticipation")).toBeGreaterThan(ratingOf(attributes(clearer, cohort), "Anticipation") ?? 0);
  });

  it("gives a keeper no Influence, which reads his defence's quiet afternoons as his own", () => {
    const keeper = man({ saves: 40, conceded: 10 }, { keeper: true });
    expect(attributes(keeper, [keeper]).some((a) => a.name === "Influence")).toBe(false);
    expect(attributes(league[0], league).some((a) => a.name === "Influence")).toBe(true);
  });

  it("gives each of the twenty ratings an equal slice of the cohort, the ends included", () => {
    const big = Array.from({ length: 200 }, (_, i) => man({ tackles: i }));
    const counts = new Map<number | null, number>();
    for (const subject of big) {
      const rating = ratingOf(attributes(subject, big), "Tackling");
      counts.set(rating, (counts.get(rating) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual(Array.from({ length: 20 }, () => 10));
  });

  it("rates the whole division exactly as it rates one man at a time", () => {
    const keeper = man({ saves: 40, conceded: 10 }, { code: 99, keeper: true });
    const cohort = [...league.map((m, i) => ({ ...m, code: i })), keeper];
    const grids = divisionAttributes(cohort);
    for (const subject of cohort) expect(grids.get(subject.code)).toEqual(attributes(subject, cohort));
  });

  it("gives every attribute a provenance, and is pure", () => {
    for (const attribute of attributes(league[0], league)) expect(attribute.from).toBeTruthy();
    expect(attributes(league[3], league)).toEqual(attributes(league[3], league));
  });
});

describe("ratedLine", () => {
  const floors = { last: 1140, now: 150 };

  it("rates on last season when he played enough of it", () => {
    const last = line({ minutes: 2953 });
    expect(ratedLine(last, line({ minutes: 450 }), floors)).toBe(last);
  });

  it("rates a new man, or a bit-part one last season, on this season", () => {
    const now = line({ minutes: 450 });
    expect(ratedLine(undefined, now, floors)).toBe(now);
    expect(ratedLine(line({ minutes: 600 }), now, floors)).toBe(now);
  });

  it("rates nobody who has played enough of neither", () => {
    expect(ratedLine(line({ minutes: 600 }), line({ minutes: 100 }), floors)).toBeNull();
  });

  it("counts this season's running once he has run enough of it", () => {
    const running = { minutes: 400, km: 44, sprints: 80, topSpeed: 34 };
    expect(ratedRunning(line({ running }), floors)).toBe(running);
    expect(ratedRunning(line({ running: { ...running, minutes: 100 } }), floors)).toBeNull();
    expect(ratedRunning(undefined, floors)).toBeNull();
  });
});
