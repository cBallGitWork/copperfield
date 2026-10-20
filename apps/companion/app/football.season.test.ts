import { afterEach, describe, expect, it, vi } from "vitest";

// 20 Oct 2026: the season list's stand-in entry was never filled, so the first quiet hour of an FPL outage threw on
// every league page. Next's cache as far as this file needs it: a stale entry whose refresh throws keeps its value.

const store = new Map<string, { value: unknown; at: number }>();
let clock = Date.parse("2026-10-20T10:10:00Z");

vi.mock("next/cache", () => ({
  unstable_cache:
    (read: (...args: unknown[]) => Promise<unknown>, keys: string[], { revalidate }: { revalidate: number }) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      const held = store.get(key);
      if (held !== undefined && clock - held.at < revalidate * 1000) return held.value;
      try {
        const value = await read(...args);
        store.set(key, { value, at: clock });
        return value;
      } catch (error) {
        if (held !== undefined) return held.value;
        throw error;
      }
    },
}));
vi.mock("./clock", () => ({ now: () => new Date(clock), replayAt: () => null }));
vi.mock("./commentary", () => ({ roundGoals: async () => [] }));

let fplUp = true;
const SEASON = [{ id: 1, code: 11, event: 8, team_h: 1, team_a: 2, team_h_score: 1, team_a_score: 0, started: true,
  finished: true, finished_provisional: true, minutes: 90, kickoff_time: "2026-10-18T14:00:00Z", stats: [] }];
vi.mock("@epl/core", async (original) => {
  const real = await original<typeof import("@epl/core")>();
  const refuse = () => Promise.reject(new real.ProviderError("403", "FPL refused", "unreachable"));
  return { ...real, fetchFixtures: async () => (fplUp ? SEASON : refuse()), fetchBootstrap: refuse, fetchLive: refuse };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the season list through an FPL outage", () => {
  it("serves the last good list into the next hour, and the clock stays quiet off it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { seasonFixtures, matchOn } = await import("./football");
    expect(await seasonFixtures()).toHaveLength(1);
    clock = Date.parse("2026-10-20T11:15:00Z");
    fplUp = false;
    expect(await seasonFixtures()).toHaveLength(1);
    expect(await matchOn()).toBe(false);
  });
});
