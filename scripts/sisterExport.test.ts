import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// sister-export.py's stale_reason, called through python3; the sister repo is never imported (main() alone reads it).
const SCRIPT = join(import.meta.dirname, "sister-export.py");
const LOAD = `
import importlib.util, json, sys
from datetime import datetime
spec = importlib.util.spec_from_file_location("sister_export", sys.argv[1])
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
args = json.loads(sys.argv[2])
`;

// One call into sister-export.py: `call` is a Python expression over `mod` and `args`, printed as JSON.
function py<T>(call: string, args: unknown[]): T {
  const run = spawnSync("python3", ["-I", "-B", "-c", `${LOAD}print(json.dumps(${call}))`, SCRIPT, JSON.stringify(args)], { encoding: "utf8" });
  expect(run.stderr).toBe("");
  return JSON.parse(run.stdout) as T;
}

const staleReason = (report: object | null, mode: string, now: string, due: string | null = null) =>
  py<string | null>(
    "mod.stale_reason(args[0], args[1], datetime.fromisoformat(args[2]), datetime.fromisoformat(args[3]) if args[3] else None)",
    [report, mode, now, due],
  );

const sweep = (finished: string, green = true) => ({ run_id: "R", green, finished_at: finished });

describe("the weekly's sweep", () => {
  it("takes Tuesday morning's sweep on Tuesday", () => {
    expect(staleReason(sweep("2026-10-13T06:24:00+00:00"), "weekly", "2026-10-13T07:00:00+00:00")).toBeNull();
  });

  // 21 Oct 2026: Tuesday's 06:09Z sweep was red, the sister re-ran it green at 23:50Z, and Wednesday's run refused it.
  it("takes a later re-run of the week's sweep on Wednesday", () => {
    expect(staleReason(sweep("2026-10-20T23:50:00+00:00"), "weekly", "2026-10-21T11:37:00+00:00")).toBeNull();
  });

  it("refuses last week's sweep, and Monday's before this Tuesday's", () => {
    expect(staleReason(sweep("2026-10-13T06:24:00+00:00"), "weekly", "2026-10-20T07:00:00+00:00")).toMatch(/before 2026-10-20 05:00Z/);
    expect(staleReason(sweep("2026-10-19T23:00:00+00:00"), "weekly", "2026-10-21T08:00:00+00:00")).toMatch(/before 2026-10-20 05:00Z/);
  });

  it("before 05:00 on a Tuesday, still wants last Tuesday's or later", () => {
    expect(staleReason(sweep("2026-10-13T06:24:00+00:00"), "weekly", "2026-10-20T04:00:00+00:00")).toBeNull();
  });

  it("refuses a red sweep and a missing report", () => {
    expect(staleReason(sweep("2026-10-20T06:41:00+00:00", false), "weekly", "2026-10-20T07:00:00+00:00")).toMatch(/not green/);
    expect(staleReason(null, "weekly", "2026-10-20T07:00:00+00:00")).toMatch(/no sweep report/);
  });
});

describe("the pressers' sweep", () => {
  it("wants the one the schedule says was due, else the last 26 hours", () => {
    const due = "2026-10-22T14:30:00+00:00";
    expect(staleReason(sweep("2026-10-22T15:29:00+00:00"), "pressers", "2026-10-22T16:15:00+00:00", due)).toBeNull();
    expect(staleReason(sweep("2026-10-21T14:05:00+00:00"), "pressers", "2026-10-22T16:15:00+00:00", due)).toMatch(/before/);
    expect(staleReason(sweep("2026-10-21T14:05:00+00:00"), "pressers", "2026-10-22T12:00:00+00:00")).toBeNull();
  });
});

// 27-29 Oct 2026: the sweep minted Sharman-Lowe's 26-27 file in R2, the restore skips curated identity, and the depth export died on him.
describe("the new identity files", () => {
  const unheld = (remote: string[], held: string[], skipped: string[] = []) =>
    py<string[]>("mod.unheld(args[0], set(args[1]), lambda key: key in args[2])", [remote, held, skipped]);
  const signing = "players/seasons/26-27/sharman-lowe_teddy_26-27_player_3a2eda.json";
  const held = "players/seasons/26-27/abbott_zach_26-27_player_c491b9.json";

  it("takes the bucket's files this Mac lacks, never one it holds", () => {
    expect(unheld([held, signing], [held])).toEqual([signing]);
  });

  it("leaves what the sister's own rules skip", () => {
    expect(unheld([signing], [], [signing])).toEqual([]);
  });
});
