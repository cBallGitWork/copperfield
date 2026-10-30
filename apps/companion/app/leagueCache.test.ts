import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FantraxError, ProviderError } from "@epl/core";
import { leagueCache, leagueRead } from "./leagueCache";

// Next's cache as far as this file can see it: what a read stored, keyed as asked.
const stored = new Map<string, unknown>();

vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(read: (...args: A) => Promise<R>, keys: string[]) =>
    async (...args: A): Promise<R> => {
      const key = JSON.stringify([...keys, ...args]);
      if (stored.has(key)) return stored.get(key) as R;
      const answer = await read(...args);
      stored.set(key, answer);
      return answer;
    },
}));

beforeEach(() => stored.clear());

/** A read that fails with `error` whatever gameweek it is asked for. */
const failing = (error: Error) => vi.fn<(gameweek: number) => Promise<object>>().mockRejectedValue(error);

const unavailable = (error: ProviderError, gameweek: number) => ({ unavailable: `${error.code} in ${gameweek}` });

describe("leagueCache", () => {
  it("serves the read, and keeps it", async () => {
    const cached = leagueCache("squads", async (gameweek: number): Promise<object> => ({ gameweek }), unavailable);
    expect(await cached(6)).toEqual({ gameweek: 6 });
    expect([...stored.values()]).toEqual([{ gameweek: 6 }]);
  });

  it("degrades a cold key when Fantrax cannot answer, and never stores the degraded answer", async () => {
    const down = new FantraxError("getTeamRosters", "503", "Service Unavailable", "unreachable");
    const cached = leagueCache("squads", failing(down), unavailable);
    expect(await cached(6)).toEqual({ unavailable: "503 in 6" });
    expect(stored.size).toBe(0);
  });

  it("degrades a provider the read leaned on, whichever layer it was", async () => {
    const fpl = new ProviderError("TIMEOUT", "fantasy.premierleague.com / → TIMEOUT", "unreachable");
    const cached = leagueCache("squads", failing(fpl), unavailable);
    expect(await cached(6)).toEqual({ unavailable: "TIMEOUT in 6" });
  });

  it("logs one line per cold-key fallback: the key, the reason and the wait, and nothing of the session", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const hung = new ProviderError("TIMEOUT", "www.fantrax.com /fxpa/req → TIMEOUT", "unreachable");
    await leagueCache("live-scores", failing(hung), unavailable)(6);
    expect(warn).toHaveBeenCalledOnce();
    const line = String(warn.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toEqual({ event: "fantrax-fallback", key: "live-scores", reason: "timeout", code: "TIMEOUT", ms: expect.any(Number) });
    expect(line).not.toMatch(/cookie|session|leagueId|fantrax\.com/i);
    warn.mockRestore();
  });

  it("logs nothing for a read that answered", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await leagueCache("squads", async (gameweek: number): Promise<object> => ({ gameweek }), unavailable)(6);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws a bug of our own rather than dressing it as an outage", async () => {
    const cached = leagueCache("squads", failing(new TypeError("cannot read teams of undefined")), unavailable);
    await expect(cached(6)).rejects.toThrow(TypeError);
  });

  // 30 Oct 2026: with Fantrax hanging, `/` asked the reader's team, then the edition, then the tables, 15 s each.
  it("degrades a second cold read at once after Fantrax timed out, rather than wait out a deadline of its own", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(0);
    const hung = new ProviderError("TIMEOUT", "www.fantrax.com /fxea/general/getLeagueInfo → TIMEOUT", "unreachable");
    expect(await leagueCache("league-described", failing(hung), unavailable)(6)).toEqual({ unavailable: "TIMEOUT in 6" });
    const rosters = vi.fn(async (gameweek: number): Promise<object> => ({ gameweek }));
    expect(await leagueCache("squads", rosters, unavailable)(6)).toEqual({ unavailable: "TIMEOUT in 6" });
    expect(rosters).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("leagueRead", () => {
  /** What a read answers here: its mapped raw, or the absence a failure stands for. */
  type Answer = { raw?: unknown; absent?: string };
  const absent = (error: ProviderError): Answer => ({ absent: error.code });

  it("caches a refusal Fantrax meant as the league's answer", async () => {
    const read = failing(new FantraxError("getTeamStats", "WARNING", "not drafted"));
    const cached = leagueRead("team-stats", read, (raw) => ({ raw }), absent);
    expect(await cached(6)).toEqual({ absent: "WARNING" });
    expect(await cached(6)).toEqual({ absent: "WARNING" });
    expect(read).toHaveBeenCalledTimes(1);
    expect([...stored.values()]).toEqual([{ absent: "WARNING" }]);
  });

  it("answers an outage with the same absence, and never stores it", async () => {
    const read = failing(new FantraxError("getTeamStats", "503", "Service Unavailable", "unreachable"));
    const cached = leagueRead("team-stats", read, (raw) => ({ raw }), absent);
    expect(await cached(6)).toEqual({ absent: "503" });
    expect(await cached(6)).toEqual({ absent: "503" });
    expect(read).toHaveBeenCalledTimes(2);
    expect(stored.size).toBe(0);
  });

  it("maps and keeps an answer", async () => {
    const cached = leagueRead("team-stats", async (gameweek: number) => gameweek, (raw) => ({ raw }), absent);
    expect(await cached(6)).toEqual({ raw: 6 });
    expect([...stored.values()]).toEqual([{ raw: 6 }]);
  });
});

/** Every source file under `app/`, found by walking it; tests excepted. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("a write", () => {
  // 9 Oct: a save Fantrax took expired the squads outright, the refetch failed, and the page had nothing left to show.
  it("never expires a read outright: `updateTag` drops the last good answer that `markStale` keeps", () => {
    const callers = sources(import.meta.dirname).filter((path) => /\bupdateTag\(/.test(readFileSync(path, "utf8")));
    expect(callers).toEqual([]);
  });
});
