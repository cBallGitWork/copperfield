import { describe, expect, it, vi } from "vitest";

const reads = vi.hoisted(() => ({ signedIn: vi.fn(), roundLive: vi.fn(), redirect: vi.fn() }));
vi.mock("../session", () => ({ signedIn: reads.signedIn }));
vi.mock("../football", () => ({ roundLive: reads.roundLive }));
vi.mock("next/navigation", () => ({ redirect: reads.redirect }));

import { GET } from "./route";

/** A promise and the hand that settles it. */
function held<T>() {
  let settle!: (value: T) => void;
  return { promise: new Promise<T>((resolve) => (settle = resolve)), settle };
}

describe("/start", () => {
  it("asks for the session and the round at once, not one after the other", async () => {
    const session = held<boolean>();
    reads.signedIn.mockReturnValue(session.promise);
    reads.roundLive.mockResolvedValue(true);

    const done = GET();
    // The session has not answered, and the round has already been asked.
    expect(reads.roundLive).toHaveBeenCalledTimes(1);

    session.settle(true);
    await done;
    expect(reads.redirect).toHaveBeenCalledWith("/matchday");
  });
});
