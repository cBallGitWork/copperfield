import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// sister-export.py's stale_reason, called through python3; the sister repo is never imported (main() alone reads it).
const SCRIPT = join(import.meta.dirname, "sister-export.py");
const DRIVER = `
import importlib.util, json, sys
from datetime import datetime
spec = importlib.util.spec_from_file_location("sister_export", sys.argv[1])
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
report, mode, now, due = json.loads(sys.argv[2])
print(json.dumps(mod.stale_reason(report, mode, datetime.fromisoformat(now), datetime.fromisoformat(due) if due else None)))
`;

function staleReason(report: object | null, mode: string, now: string, due: string | null = null): string | null {
  const run = spawnSync("python3", ["-I", "-B", "-c", DRIVER, SCRIPT, JSON.stringify([report, mode, now, due])], { encoding: "utf8" });
  expect(run.stderr).toBe("");
  return JSON.parse(run.stdout) as string | null;
}

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
