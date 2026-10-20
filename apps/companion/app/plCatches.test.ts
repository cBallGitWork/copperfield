import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderError, type RawPlFixture } from "@epl/core";
import { roundStreams } from "./commentary";
import { matchGoalMinutes } from "./matchFeed";
import { ofFixture } from "./plFeed";

// The Premier League's blocks go absent when their API fails, and a bug of ours still throws (CODE_RULES §2).

const round = vi.fn<(gameweek: number) => Promise<unknown>>();
vi.mock("next/cache", () => ({ unstable_cache: <F>(read: F) => read }));
vi.mock("./clock", () => ({ replayAt: () => null }));
vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  fetchPlRound: (gameweek: number) => round(gameweek),
}));

const down = new ProviderError("503", "Premier League /fixtures → 503", "unreachable");
const bug = new TypeError("content is not iterable");
const fixture = { id: 9, status: "C", altIds: { opta: "g41" } } as unknown as RawPlFixture;

beforeEach(() => {
  round.mockReset();
  round.mockResolvedValue({ content: [fixture] });
});

describe("the round's commentary streams", () => {
  it("are none when their API is down", async () => {
    round.mockRejectedValue(down);
    expect(await roundStreams(6)).toEqual(new Map());
  });

  it("throw a bug of our own", async () => {
    round.mockRejectedValue(bug);
    await expect(roundStreams(6)).rejects.toThrow(TypeError);
  });
});

describe("one fixture's block", () => {
  it("is absent when either hop's provider fails", async () => {
    expect(await ofFixture(6, 41, "absent", async () => Promise.reject(down))).toBe("absent");
    round.mockRejectedValue(down);
    expect(await ofFixture(6, 41, "absent", async () => "read")).toBe("absent");
  });

  it("throws a bug in its mapper", async () => {
    await expect(ofFixture(6, 41, "absent", async () => Promise.reject(bug))).rejects.toThrow(TypeError);
  });
});

describe("a fixture's goal minutes", () => {
  it("keep the log when their API is down, and throw a bug of our own", async () => {
    const logged = new Map([[7, [12]]]);
    round.mockRejectedValue(down);
    expect(await matchGoalMinutes(6, 41, [], logged)).toEqual(logged);
    round.mockRejectedValue(bug);
    await expect(matchGoalMinutes(6, 41, [], logged)).rejects.toThrow(TypeError);
  });
});
