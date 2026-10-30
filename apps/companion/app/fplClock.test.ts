import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 30 Oct 2026: 44 of a day's 105 FPL refusals came in the first two minutes of an hour, when every quiet key went cold,
// and a refused read fell back to the last match window's reading, days old. Next's cache as this file needs it: a
// stale entry is served while it refreshes behind, a refresh that throws keeps it, and each call names its lifetime.

const store = new Map<string, { value: unknown; at: number }>();
const refreshes: Promise<unknown>[] = [];

vi.mock("next/cache", () => ({
  unstable_cache:
    (read: (...args: unknown[]) => Promise<unknown>, keys: string[], { revalidate }: { revalidate: number }) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      const held = store.get(key);
      const keep = (value: unknown) => store.set(key, { value, at: Date.now() });
      if (held === undefined) return read(...args).then((value) => (keep(value), value));
      if (Date.now() - held.at > revalidate * 1000) refreshes.push(read(...args).then(keep, () => undefined));
      return held.value;
    },
}));
vi.mock("./clock", () => ({ now: () => new Date() }));

/** FPL as this file runs it: each ask answers the next numbered reading, or refuses. */
let asks = 0;
let refusing = false;
const fpl = async (gameweek: number) => {
  asks += 1;
  if (refusing) throw new Error("FPL → 403");
  return `gameweek ${gameweek}, reading ${asks}`;
};

let inPlay = false;
const at = (iso: string) => vi.setSystemTime(new Date(iso));

beforeEach(() => {
  store.clear();
  refreshes.length = 0;
  asks = 0;
  refusing = false;
  inPlay = false;
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

async function clocked() {
  const { onTheClock } = await import("./fplClock");
  return onTheClock("round", fpl, 20, async () => inPlay);
}

describe("a read on the football clock", () => {
  it("draws FPL's reading now on a match window's first view, not the last window's", async () => {
    const read = await clocked();
    inPlay = true;
    at("2026-10-24T14:00:00Z");
    expect(await read(8)).toBe("gameweek 8, reading 1");
    inPlay = false;
    at("2026-10-27T10:00:00Z");
    expect(await read(8)).toBe("gameweek 8, reading 2");
    inPlay = true;
    at("2026-10-31T12:20:00Z");
    expect(await read(8)).toBe("gameweek 8, reading 3");
  });

  it("serves the newest reading held when FPL refuses, whichever clock took it", async () => {
    const read = await clocked();
    inPlay = true;
    at("2026-10-24T14:00:00Z");
    await read(8);
    inPlay = false;
    at("2026-10-24T20:30:00Z");
    expect(await read(8)).toBe("gameweek 8, reading 2");
    refusing = true;
    at("2026-10-24T22:00:00Z");
    expect(await read(8)).toBe("gameweek 8, reading 2");
  });

  it("asks nothing at the top of the hour while the last quiet reading is under an hour old", async () => {
    const read = await clocked();
    at("2026-10-29T18:59:00Z");
    await read(8);
    at("2026-10-29T19:00:05Z");
    await read(8);
    await Promise.all(refreshes);
    expect(asks).toBe(1);
  });

  it("asks at most once a quiet hour, and again once the reading is an hour old", async () => {
    const read = await clocked();
    at("2026-10-29T01:05:00Z");
    await read(8);
    at("2026-10-29T01:55:00Z");
    await read(8);
    expect(asks).toBe(1);
    at("2026-10-29T02:06:00Z");
    expect(await read(8)).toBe("gameweek 8, reading 2");
  });

  it("serves a match window's last reading while it refreshes, so a view never waits on FPL", async () => {
    const read = await clocked();
    inPlay = true;
    at("2026-10-24T14:00:00Z");
    await read(8);
    at("2026-10-24T14:00:30Z");
    expect(await read(8)).toBe("gameweek 8, reading 1");
    await Promise.all(refreshes);
    expect(await read(8)).toBe("gameweek 8, reading 2");
  });

  it("throws when FPL refuses a read never held, so each caller picks its own failure", async () => {
    const read = await clocked();
    refusing = true;
    await expect(read(9)).rejects.toThrow("403");
  });
});
