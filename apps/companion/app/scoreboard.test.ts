import { describe, expect, it, vi } from "vitest";
import { POLL } from "./config";

// The lifetime each league read is filed under, as `leagueCache` was asked for it.
const lifetimes = vi.hoisted(() => new Map<string, number | undefined>());

vi.mock("./leagueCache", () => ({
  leagueCache: (key: string, read: unknown, ...rest: [unknown, number?]) => {
    lifetimes.set(key, rest[1]);
    return read;
  },
}));

vi.mock("@epl/core", async (actual) => ({
  ...(await actual<object>()),
  fetchLiveScoring: async () => ({}),
  mapLiveScores: () => [{ teamId: "a", points: 3 }],
  mapLivePlayerPoints: () => [],
  mapBenchPlayerPoints: () => [],
  mapLiveRemaining: () => [],
}));
vi.mock("./round", () => ({ leagueInfo: async () => null }));

const { liveScores } = await import("./scoreboard");

describe("the live scoreboard's read", () => {
  // Craig, 19 Oct 2026: "live scores still a little slow to update". At 30 against a 30s poll, a lone reader's
  // poll found the entry fresh every other time, so the head-to-head moved once a minute.
  it("goes stale inside one poll, so every poll fetches behind it", () => {
    const lifetime = lifetimes.get("live-scores");
    expect(lifetime).toBeDefined();
    expect(lifetime).toBeLessThan(POLL.live);
  });
});

describe("the live scores", () => {
  // Live and the layout's strip share one request's reading, so neither may hold Maps the other can change.
  it("hands every caller Maps of its own", async () => {
    const [one, two] = await Promise.all([liveScores(8), liveScores(8)]);
    expect(one.scores).not.toBe(two.scores);
    expect(one.subs).not.toBe(two.subs);
    expect(one.scores.get("a")?.points).toBe(3);
  });
});
