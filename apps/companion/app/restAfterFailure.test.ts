import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restAfterFailure } from "./restAfterFailure";

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
    const rested = restAfterFailure(read, 60_000, clock);
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
    const rested = restAfterFailure(read, 60_000, clock);
    await expect(rested(6)).rejects.toBe(refused);
    expect(await rested(5)).toBe("lines");
  });

  it("logs once per failed ask, naming the endpoint and status", async () => {
    const rested = restAfterFailure(vi.fn().mockRejectedValue(refused), 60_000, clock);
    await expect(rested()).rejects.toBe(refused);
    await expect(rested()).rejects.toBe(refused);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("FPL /event/6/live/ → 403; not asked again for 60s");
  });
});
