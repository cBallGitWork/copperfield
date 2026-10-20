import { describe, expect, it } from "vitest";
import { awaitsSub, withAutoSubs, type SubsReading } from "./afterSubs";
import { minutesByMan } from "./breakdown";
import { mapBenchOrder, mapRosterSlots, type RawTeamRosterInfo } from "./fantrax/benchOrder";
import { mapBenchPlayerPoints, mapLivePlayerPoints, mapLiveRemaining, mapLiveScores, type RawLiveScoring } from "./fantrax/livescoring";
import type { LiveRemaining, LiveTeamScore } from "./points";
import type { ScoringCategory } from "./scoring";
import live from "./fantrax/__fixtures__/liveScoringAutoSub.json";
import roster from "./fantrax/__fixtures__/teamRosterInfoAutoSub.json";

// The real league's GW7, read on Monday 19 Oct 2026: Sarr (M) finished his match without a minute, and Kerkez,
// numbered first on the bench, played 90 for 3. Fantrax's board said 31.
const RACCOONS = "l5kunst8msgbirdf";
const SARR = "05748";
const KERKEZ = "06do9";
const LIMITS = { min: { G: 1, D: 3, M: 2, F: 1 }, max: { G: 1, D: 5, M: 5, F: 3 } };
const NAMES: Record<string, ScoringCategory> = {
  "5010#6120": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
  "5020#6120": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
} as Record<string, ScoringCategory>;

const raw = live as RawLiveScoring;
const info = roster as RawTeamRosterInfo;
const score = mapLiveScores(raw).find((s) => s.teamId === RACCOONS) as LiveTeamScore;
const men = mapLiveRemaining(raw).find((s) => s.teamId === RACCOONS) as LiveRemaining;
const priced = [...mapLivePlayerPoints(raw), ...mapBenchPlayerPoints(raw)].flatMap((s) => s.players);
const reading: SubsReading = {
  points: new Map(priced.map((p) => [p.fantraxId, p.points])),
  minutes: minutesByMan(priced, NAMES),
  slots: mapRosterSlots(info),
  order: mapBenchOrder(info).order,
  limits: LIMITS,
};

describe("withAutoSubs", () => {
  it("counts the reserve who comes on for a starter who did not play: GW7's 31 is 34", () => {
    expect(score.points).toBe(31);
    const after = withAutoSubs(score, men, reading);
    expect(after.subs).toEqual([{ off: SARR, on: KERKEZ, provisional: false }]);
    expect(after.score).toEqual({ teamId: RACCOONS, points: 34, toPlay: 2 });
  });

  it("subs nobody whose match is still to come", () => {
    const sarrToCome = { ...men, eleven: { ...men.eleven, [SARR]: 1 } };
    expect(withAutoSubs(score, sarrToCome, reading)).toEqual({ score, subs: [] });
    expect(awaitsSub(sarrToCome, reading)).toBe(false);
    expect(awaitsSub(men, reading)).toBe(true);
  });

  it("brings on a reserve still to play as provisional, adding nothing yet and one to play", () => {
    const kerkezToCome = { ...men, bench: { ...men.bench, [KERKEZ]: 1 } };
    const unpriced = { ...reading, points: new Map([...reading.points].filter(([id]) => id !== KERKEZ)), minutes: { ...reading.minutes, [KERKEZ]: 0 } };
    expect(withAutoSubs(score, kerkezToCome, unpriced)).toEqual({
      score: { teamId: RACCOONS, points: 31, toPlay: 3 },
      subs: [{ off: SARR, on: KERKEZ, provisional: true }],
    });
  });

  it("leaves the score alone when a starter's slot cannot be read, or Fantrax gave no total", () => {
    const { [SARR]: _, ...slots } = reading.slots;
    expect(withAutoSubs(score, men, { ...reading, slots })).toEqual({ score, subs: [] });
    expect(withAutoSubs({ ...score, points: null }, men, reading).score.points).toBeNull();
  });
});

describe("mapRosterSlots", () => {
  it("names each man's slot in the league's letters, a dual-eligible man at the one he is filed at", () => {
    expect(reading.slots[SARR]).toBe("M");
    expect(reading.slots[KERKEZ]).toBe("D");
    expect(Object.keys(reading.slots)).toHaveLength(14);
  });
});
