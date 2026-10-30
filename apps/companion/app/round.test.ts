import { describe, expect, it, vi } from "vitest";
import { leagueInfo, readCalendar } from "./round";

// Next's cache as the calendar meets it: a read nested inside another's skips its own cache and goes live.
const { inCache, ownCache, nested } = await vi.hoisted(async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  const inCache = new AsyncLocalStorage<string>();
  const nested: string[] = [];
  /** A read with a cache of its own, which notes being asked from inside another's. */
  const ownCache = <R,>(name: string, answer: R) => async () => {
    if (inCache.getStore() !== undefined) nested.push(name);
    return answer;
  };
  return { inCache, ownCache, nested };
});

// Which league is served, and whether Fantrax describes it: refused unless a test says otherwise.
const served = vi.hoisted(() => ({ league: "", describes: false }));

vi.mock("./leagueCache", () => ({
  leagueCache:
    <A extends unknown[], R>(key: string, read: (...args: A) => Promise<R>) =>
    (...args: A) => {
      if (inCache.getStore() !== undefined) nested.push(key);
      return inCache.run(key, () => read(...args));
    },
}));
vi.mock("../../../data/leagues/roster-limits.json", () => ({
  default: { leagues: { recorded: { minimumsInForce: true, positions: [{ shortName: "D", minActive: 3 }, { shortName: "F", minActive: 1 }] } } },
}));
vi.mock("./football", () => ({ seasonKickoffs: ownCache("season-fixtures", []) }));
vi.mock("@epl/core", async (actual) => {
  const core = await actual<typeof import("@epl/core")>();
  return {
    ...core,
    get FANTRAX_LEAGUE_ID() {
      return served.league;
    },
    fetchLeagueInfo: async () => {
      if (served.describes) return {};
      throw new core.FantraxError("getLeagueInfo", "INVALID_LEAGUE", "no such league");
    },
  };
});

describe("readCalendar", () => {
  it("asks the league and FPL's kickoffs each from its own cache, never from inside another", async () => {
    // Nested, an FPL refusal emptied the calendar for a window and every refresh asked FPL live.
    expect(await readCalendar()).toEqual([]);
    expect(nested).toEqual([]);
  });
});

describe("leagueInfo", () => {
  it("carries the formation floors on record for the served league", async () => {
    Object.assign(served, { league: "recorded", describes: true });
    expect((await leagueInfo())?.roster.minActiveByPosition).toEqual({ D: 3, F: 1 });
  });

  it("carries no floor for a league with none on record", async () => {
    Object.assign(served, { league: "unrecorded", describes: true });
    expect((await leagueInfo())?.roster.minActiveByPosition).toEqual({});
  });
});
