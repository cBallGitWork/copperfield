import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextRest, restAfterFailure } from "./restAfterFailure";

let at = 0;
const clock = () => at;
const refused = new Error("FPL /event/6/live/ → 403");

beforeEach(() => {
  at = 0;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("restAfterFailure", () => {
  it("refuses without asking until the rest is over, then asks again", async () => {
    const read = vi.fn<(gameweek: number) => Promise<string>>().mockRejectedValueOnce(refused).mockResolvedValue("lines");
    const rested = restAfterFailure(read, 60_000, { clock });
    await expect(rested(6)).rejects.toBe(refused);
    at = 59_999;
    await expect(rested(6)).rejects.toBe(refused);
    expect(read).toHaveBeenCalledTimes(1);
    at = 60_000;
    expect(await rested(6)).toBe("lines");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("rests each argument apart: one round refused leaves another asked", async () => {
    const read = vi.fn(async (gameweek: number) => {
      if (gameweek === 6) throw refused;
      return "lines";
    });
    const rested = restAfterFailure(read, 60_000, { clock });
    await expect(rested(6)).rejects.toBe(refused);
    expect(await rested(5)).toBe("lines");
  });

  it("logs once per failed ask, naming the endpoint and status", async () => {
    const rested = restAfterFailure(vi.fn().mockRejectedValue(refused), 60_000, { clock });
    await expect(rested()).rejects.toBe(refused);
    await expect(rested()).rejects.toBe(refused);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("FPL /event/6/live/ → 403; not asked again for 60s");
  });

  it("doubles the rest on each refusal in a row, to its cap, and starts over after an answer", async () => {
    const read = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(refused)
      .mockRejectedValueOnce(refused)
      .mockRejectedValueOnce(refused)
      .mockRejectedValueOnce(refused)
      .mockResolvedValueOnce("lines")
      .mockRejectedValue(refused);
    const rested = restAfterFailure(read, 60_000, { maxRestMs: 240_000, clock });
    const asks: number[] = [];
    for (at = 0; at <= 900_000; at += 1_000) {
      const before = read.mock.calls.length;
      await rested().catch(() => undefined);
      if (read.mock.calls.length > before) asks.push(at / 1000);
    }
    // Refused at 0, 60, 180 and 420; answered at 660; refused from 661, the rest starts again at 60s.
    expect(asks).toEqual([0, 60, 180, 420, 660, 661, 721, 841]);
  });
});

describe("nextRest", () => {
  it("starts at the first rest, doubles, and never passes the cap", () => {
    expect(nextRest(null, 60_000, 240_000)).toBe(60_000);
    expect(nextRest(60_000, 60_000, 240_000)).toBe(120_000);
    expect(nextRest(120_000, 60_000, 240_000)).toBe(240_000);
    expect(nextRest(240_000, 60_000, 240_000)).toBe(240_000);
  });

  it("without a cap above the first, rests the first every time", () => {
    expect(nextRest(60_000, 60_000, 60_000)).toBe(60_000);
    expect(nextRest(60_000, 60_000, 0)).toBe(60_000);
  });
});
