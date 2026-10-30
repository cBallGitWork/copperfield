import { describe, expect, it, vi } from "vitest";
import { FantraxError, ProviderError } from "@epl/core";
import { fantraxTimedOut, restAfterTimeout } from "./fantraxRest";

const hung = new ProviderError("TIMEOUT", "www.fantrax.com /fxpa/req → TIMEOUT", "unreachable");

/** A clock the test moves by hand. */
function clock(): { now: () => number; at: number } {
  const time = { at: 0, now: () => time.at };
  return time;
}

describe("fantraxTimedOut", () => {
  it("is a deadline Fantrax let pass, and nothing else", () => {
    expect(fantraxTimedOut(hung)).toBe(true);
    expect(fantraxTimedOut(new ProviderError("TIMEOUT", "fantasy.premierleague.com /api/bootstrap-static/ → TIMEOUT", "unreachable"))).toBe(false);
    expect(fantraxTimedOut(new FantraxError("getStandings", "503", "down", "unreachable"))).toBe(false);
    expect(fantraxTimedOut(new TypeError("x"))).toBe(false);
  });
});

// 30 Oct 2026: a hanging Fantrax cost `/` 45 s, three reads that each waited out their own deadline one after another.
describe("restAfterTimeout", () => {
  it("fails every read at once for the rest after one timed out, without asking", async () => {
    const time = clock();
    const rest = restAfterTimeout(15_000, time.now);
    const first = rest(vi.fn().mockRejectedValue(hung));
    const second = vi.fn().mockResolvedValue("rosters");
    await expect(first()).rejects.toBe(hung);
    time.at = 14_999;
    await expect(rest(second)()).rejects.toBe(hung);
    expect(second).not.toHaveBeenCalled();
  });

  it("asks again once the rest is over", async () => {
    const time = clock();
    const rest = restAfterTimeout(15_000, time.now);
    await rest(vi.fn().mockRejectedValue(hung))().catch(() => null);
    time.at = 15_000;
    await expect(rest(async () => "rosters")()).resolves.toBe("rosters");
  });

  it("rests after a timeout only: a refusal or an outage that answered fast costs nothing to ask again", async () => {
    const rest = restAfterTimeout(15_000, clock().now);
    await rest(vi.fn().mockRejectedValue(new FantraxError("getStandings", "503", "down", "unreachable")))().catch(() => null);
    await expect(rest(async () => "table")()).resolves.toBe("table");
  });

  it("ends the rest when a read already in flight answers, as Fantrax is back", async () => {
    const rest = restAfterTimeout(15_000, clock().now);
    let answer: (value: string) => void = () => {};
    const inFlight = rest(() => new Promise<string>((resolve) => (answer = resolve)))();
    await rest(vi.fn().mockRejectedValue(hung))().catch(() => null);
    answer("rosters");
    await inFlight;
    await expect(rest(async () => "table")()).resolves.toBe("table");
  });
});
