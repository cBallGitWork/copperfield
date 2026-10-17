import { describe, expect, it } from "vitest";
import { singleFlight } from "./singleFlight";

// Three requests finding one stale entry refreshed it three times: 3 bootstraps and 6 live reads a 30s poll (11 Oct).

function counted<T>(answer: () => Promise<T>) {
  let calls = 0;
  const read = (gameweek: number) => {
    calls += 1;
    return answer().then((value) => [gameweek, value] as const);
  };
  return { read, calls: () => calls };
}

describe("singleFlight", () => {
  it("shares one read among callers who ask while it is in flight", async () => {
    const { read, calls } = counted(() => Promise.resolve("snapshot"));
    const once = singleFlight(read);
    const answers = await Promise.all([once(6), once(6), once(6)]);
    expect(calls()).toBe(1);
    expect(answers).toEqual([[6, "snapshot"], [6, "snapshot"], [6, "snapshot"]]);
  });

  it("keeps different arguments apart", async () => {
    const { read, calls } = counted(() => Promise.resolve("round"));
    const once = singleFlight(read);
    await Promise.all([once(6), once(7)]);
    expect(calls()).toBe(2);
  });

  it("reads afresh once the last read has landed, or failed", async () => {
    let fail = true;
    const { read, calls } = counted(() => (fail ? Promise.reject(new Error("403")) : Promise.resolve("ok")));
    const once = singleFlight(read);
    await expect(once(6)).rejects.toThrow("403");
    fail = false;
    await expect(once(6)).resolves.toEqual([6, "ok"]);
    await once(6);
    expect(calls()).toBe(3);
  });

  // 16 Oct 2026: 444 of 542 production error lines carried this function's minified source, which `unstable_cache`
  // puts at the head of its key and of "revalidating cache with key: …".
  it("reads as a word, not its source, so a cache key and its error line start with the key's own parts", () => {
    const once = singleFlight(counted(() => Promise.resolve("round")).read);
    expect(String(once)).toBe("read");
  });
});
