import { beforeEach, describe, expect, it, vi } from "vitest";
import { benchRanks } from "./benchOrders";

// Next's cache as far as this file can see it: one entry per key and arguments.
const stored = new Map<string, unknown>();

vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(read: (...args: A) => Promise<R>, keys: string[]) =>
    async (...args: A): Promise<R> => {
      const key = JSON.stringify([...keys, ...args]);
      if (!stored.has(key)) stored.set(key, await read(...args));
      return stored.get(key) as R;
    },
}));

// Fantrax's roster read, counted: the period it answers for and the bench in the order it will come on.
const roster = vi.hoisted(() => vi.fn(async (_league: string, _team: string, period: number) => ({ period, order: ["elanga", "foden", "minteh"] })));

vi.mock("@epl/core", async (original) => ({
  ...(await original<typeof import("@epl/core")>()),
  fetchTeamRosterInfo: roster,
  mapLineupState: (raw: { period: number }) => ({ period: raw.period }),
  mapBenchOrder: (raw: { order: string[] }) => ({ order: raw.order }),
}));

beforeEach(() => {
  stored.clear();
  roster.mockClear();
});

describe("benchRanks", () => {
  it("ranks the open period's bench from 1", async () => {
    expect(await benchRanks("atl", 7)).toEqual({ elanga: 1, foden: 2, minteh: 3 });
  });

  it("asks Fantrax once for every view and poll of the same team's week", async () => {
    await benchRanks("atl", 7);
    await benchRanks("atl", 7);
    expect(roster).toHaveBeenCalledTimes(1);
  });
});
