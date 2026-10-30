import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 11 Oct 2026: a 403 on FPL's live read was cached as a reading with no lines, so every card lost its figures for the
// window, and a stale entry asked a refusing FPL again on every page view. Next's cache as far as this file can see
// it: a stale entry is served while it refreshes, and a refresh that throws leaves it as it was.

const stored = new Map<string, { value: unknown; stale: boolean; at: number }>();
const refreshes: Promise<unknown>[] = [];

vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(read: (...args: A) => Promise<R>, keys: string[], { revalidate }: { revalidate: number }) =>
    async (...args: A): Promise<R> => {
      const key = JSON.stringify([...keys, ...args]);
      const held = stored.get(key);
      const store = (value: R) => stored.set(key, { value, stale: false, at: Date.parse(clockAt) });
      if (held === undefined) return read(...args).then((value) => (store(value), value));
      if (held.stale || Date.parse(clockAt) - held.at > revalidate * 1000) refreshes.push(read(...args).then(store, () => undefined));
      return held.value as R;
    },
}));
vi.mock("./commentary", () => ({ roundGoals: async () => [] }));
/** The app's clock: mid-match on the day fixture 41 kicks off (13:00 UTC), unless a test moves it. */
const MID_MATCH = "2026-10-11T14:30:00Z";
let clockAt = MID_MATCH;
vi.mock("./clock", () => ({ replayAt: () => null, now: () => new Date(clockAt) }));

const FIXTURES = join(import.meta.dirname, "..", "..", "..", "packages", "core", "src", "football", "fpl", "__fixtures__");
const bootstrap = JSON.parse(readFileSync(join(FIXTURES, "bootstrap.json"), "utf8"));
const live = JSON.parse(readFileSync(join(FIXTURES, "liveGw5.json"), "utf8"));
const roundFixtures = [{ id: 41, code: 1, event: 5, team_h: 1, team_a: 2, team_h_score: 1, team_a_score: 0, started: true, finished: false, finished_provisional: false, minutes: 60, kickoff_time: "2026-10-11T13:00:00Z", stats: [] }];

/** The season as its slower read last saw it: fixture 41 not yet under way. */
const seasonList = [{ ...roundFixtures[0], team_h_score: null, team_a_score: null, started: false, minutes: 0 }, { ...roundFixtures[0], id: 42, event: 6 }];

/** FPL as this test runs it: each path answers its JSON, or the status `refusing` names. */
let refusing: Record<string, number> = {};
const asked: string[] = [];

function answer(path: string): unknown {
  if (path.startsWith("/bootstrap-static/")) return bootstrap;
  if (path.startsWith("/event/")) return live;
  return path.includes("?event=") ? roundFixtures : seasonList;
}

beforeEach(() => {
  stored.clear();
  refreshes.length = 0;
  asked.length = 0;
  refusing = {};
  clockAt = MID_MATCH;
  vi.resetModules();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", async (url: string) => {
    const path = new URL(url).pathname.replace(/^\/api/, "") + new URL(url).search;
    asked.push(path);
    const status = Object.entries(refusing).find(([prefix]) => path.startsWith(prefix))?.[1];
    if (status !== undefined) return new Response("Forbidden", { status });
    return new Response(JSON.stringify(answer(path)), { status: 200, headers: { "content-type": "application/json" } });
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Every entry gone stale, as when its window has passed. */
function expire() {
  for (const entry of stored.values()) entry.stale = true;
}

async function settled() {
  await Promise.all(refreshes.splice(0));
}

describe("a round's reading when FPL refuses", () => {
  it("keeps the last whole reading through a 403 on the live read", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(MID_MATCH));
    const { gameweekSnapshot } = await import("./football");
    const good = await gameweekSnapshot(5);
    expect(good.stats.length).toBeGreaterThan(0);

    refusing = { "/event/": 403 };
    vi.setSystemTime(new Date(Date.parse(MID_MATCH) + 60_000));
    expire();
    await gameweekSnapshot(5);
    await settled();

    const after = await gameweekSnapshot(5);
    expect(after.statsUnavailable).toBe(false);
    expect(after.stats).toEqual(good.stats);
    expect(after.fetchedAt).toBe(good.fetchedAt);
  });

  it("falls back to the fixtures alone only when no reading was ever held", async () => {
    refusing = { "/event/": 403 };
    const { gameweekSnapshot } = await import("./football");
    const cold = await gameweekSnapshot(5);
    expect(cold.statsUnavailable).toBe(true);
    expect(cold.fixtures.map((fixture) => fixture.id)).toEqual([41]);
  });

  it("does not ask a refusing endpoint again on every view", async () => {
    const { gameweekSnapshot } = await import("./football");
    await gameweekSnapshot(5);
    refusing = { "/event/": 403 };
    for (let view = 0; view < 5; view++) {
      expire();
      await gameweekSnapshot(5);
      await settled();
    }
    expect(asked.filter((path) => path.startsWith("/event/")).length).toBe(2);
  });
});

describe("a round's fixtures when FPL refuses them on a cold key", () => {
  // 11 and 12 Oct 2026: `/` and `/prem/match/41` answered 500 on "FPL /fixtures/?event= → 403".
  it("draws the season list's fixtures for the round, with no lines, stamped by that list", async () => {
    refusing = { "/fixtures/?event=": 403 };
    const { gameweekSnapshot } = await import("./football");
    const snapshot = await gameweekSnapshot(5);
    expect(snapshot.fixtures.map((fixture) => [fixture.id, fixture.status])).toEqual([[41, "upcoming"]]);
    expect(snapshot.statsUnavailable).toBe(true);
    expect(Number.isNaN(Date.parse(snapshot.fetchedAt))).toBe(false);
  });

  it("gives a match no sheet rather than a throw", async () => {
    refusing = { "/fixtures/?event=": 403 };
    const { gameweekSheets, roundFigures } = await import("./football");
    expect(await gameweekSheets(5)).toEqual([]);
    expect(await roundFigures(4)).toEqual([]);
  });

  it("never caches the refusal: the round is read once FPL answers again", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(MID_MATCH));
    refusing = { "/fixtures/?event=": 403 };
    const { gameweekSnapshot } = await import("./football");
    await gameweekSnapshot(5);
    refusing = {};
    vi.setSystemTime(new Date(Date.parse(MID_MATCH) + 61_000));
    const after = await gameweekSnapshot(5);
    expect(after.fixtures.map((fixture) => fixture.homeScore)).toEqual([1]);
  });
});

describe("the season's fixtures", () => {
  it("carry the round in view from the round's own reading, so a slow season read never holds an old score", async () => {
    const { seasonFixtures } = await import("./football");
    const season = await seasonFixtures();
    expect(season.map((fixture) => [fixture.id, fixture.homeScore])).toEqual([[41, 1], [42, 1]]);
  });
});

/** The live feed's reads so far. */
const liveReads = () => asked.filter((path) => path.startsWith("/event/")).length;

describe("FPL on the football clock", () => {
  it("asks nothing live at 02:00 on a day with no match, and a lines reader at most once an hour", async () => {
    clockAt = "2026-10-14T01:05:00Z";
    const { footballNow, roundFigures } = await import("./football");
    await footballNow();
    expect(liveReads()).toBe(0);
    await roundFigures(5);
    clockAt = "2026-10-14T01:55:00Z";
    await roundFigures(5);
    expect(liveReads()).toBe(1);
    clockAt = "2026-10-14T02:06:00Z";
    await roundFigures(5);
    expect(liveReads()).toBe(2);
  });

  it("reads live ten minutes before a kickoff, and not sixteen", async () => {
    clockAt = "2026-10-11T12:40:00Z";
    const { roundFigures } = await import("./football");
    await roundFigures(5);
    expect(liveReads()).toBe(1);
    clockAt = "2026-10-11T12:50:00Z";
    await roundFigures(5);
    await settled();
    expect(liveReads()).toBe(2);
  });

  it("reads afresh after the window closes, never the reading from before the match", async () => {
    clockAt = "2026-10-11T11:10:00Z";
    const { gameweekSnapshot } = await import("./football");
    await gameweekSnapshot(5);
    clockAt = "2026-10-11T15:20:00Z";
    await gameweekSnapshot(5);
    expect(liveReads()).toBe(2);
  });

  it("serves the last live reading when FPL refuses a quiet hour's read", async () => {
    const { gameweekSnapshot } = await import("./football");
    const good = await gameweekSnapshot(5);
    clockAt = "2026-10-14T01:05:00Z";
    refusing = { "/event/": 403 };
    const night = await gameweekSnapshot(5);
    await settled();
    expect(night.stats).toEqual(good.stats);
    expect(liveReads()).toBe(2);
  });

  it("has the shell poll fast inside the day's match window only, not until the gameweek's last whistle", async () => {
    const { liveIn } = await import("./football");
    expect(await liveIn()).toBe(0);
    // Fixture 41 never finished in this FPL, so the round is still under way at 16:00; the window shut at 15:15.
    clockAt = "2026-10-11T16:00:00Z";
    expect(await liveIn()).toBeNull();
    clockAt = "2026-10-11T12:00:00Z";
    expect(await liveIn()).toBe(45 * 60);
  });

  it("never asks for the live feed for a page that needs only the fixtures, even mid-match", async () => {
    const { footballNow, seasonFixtures } = await import("./football");
    const snapshot = await footballNow();
    await seasonFixtures();
    expect(snapshot.fixtures.map((fixture) => fixture.id)).toEqual([41]);
    expect(liveReads()).toBe(0);
  });
});
