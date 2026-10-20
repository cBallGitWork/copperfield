import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A page reads the elevens off the branch, ahead of the deploy each of their commits starts.

vi.mock("next/cache", () => ({ unstable_cache: <F>(read: F) => read }));
const held = { manifest: { gameweek: 7 }, fetchedAt: "2026-10-16T10:07:00Z", source: "rotowire", clubs: {} };
vi.mock("./intel", () => ({ intelXi: held }));

const asked: string[] = [];
let answer: () => Response;

beforeEach(() => {
  asked.length = 0;
  vi.resetModules();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", async (url: string) => (asked.push(url), answer()));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function onVercel() {
  vi.stubEnv("VERCEL_GIT_REPO_OWNER", "owner");
  vi.stubEnv("VERCEL_GIT_REPO_SLUG", "repo");
  vi.stubEnv("VERCEL_GIT_COMMIT_REF", "main");
}

const json = (body: unknown) => () => new Response(JSON.stringify(body), { status: 200 });

// The first import loads all of core, seconds under a full parallel run.
describe("the predicted elevens", { timeout: 20_000 }, () => {
  it("are the branch's when it holds newer ones than the build", async () => {
    onVercel();
    const newer = { ...held, fetchedAt: "2026-10-16T11:07:00Z", clubs: { ARS: { formation: "4-3-3", slots: null, starters: [] } } };
    answer = json(newer);
    const { predictedElevens } = await import("./predictedXi");
    expect(await predictedElevens()).toEqual(newer);
    expect(asked).toEqual(["https://raw.githubusercontent.com/owner/repo/main/data/intel/xi/26-27.json"]);
  });

  it("are the build's when the branch will not answer, or answers with something else", async () => {
    onVercel();
    answer = () => new Response("Not Found", { status: 404 });
    const { predictedElevens } = await import("./predictedXi");
    expect(await predictedElevens()).toBe(held);
    answer = () => new Response("<!doctype html>", { status: 200 });
    vi.resetModules();
    expect(await (await import("./predictedXi")).predictedElevens()).toBe(held);
  });

  // 19 Oct 2026: the repo went private, so the raw file 404s on every read; production logged it each minute.
  it("stop asking the branch once it says the file is not there", async () => {
    onVercel();
    answer = () => new Response("Not Found", { status: 404 });
    const { predictedElevens } = await import("./predictedXi");
    expect(await predictedElevens()).toBe(held);
    expect(await predictedElevens()).toBe(held);
    expect(asked).toHaveLength(1);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("are the build's off Vercel, without asking anyone", async () => {
    vi.stubEnv("VERCEL_GIT_REPO_OWNER", "");
    const { predictedElevens } = await import("./predictedXi");
    expect(await predictedElevens()).toBe(held);
    expect(asked).toEqual([]);
  });
});
