import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// edition-reason.sh against logs shaped as the editions runs printed them.
const SCRIPT = join(import.meta.dirname, "edition-reason.sh");

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "edition-reason-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function reason(log: string | null): string {
  const path = join(dir, "edition.log");
  if (log !== null) writeFileSync(path, log);
  const run = spawnSync("bash", [SCRIPT, path], { encoding: "utf8" });
  expect(run.status).toBe(0);
  return run.stdout.trim();
}

describe("the edition alert's reason", () => {
  // Run 39838480211, 22 Oct 2026: every story refused at login.
  it("names the fix when Claude Code's login is refused", () => {
    const log = [
      ".env.local not found. Continuing without it.",
      "presser (presser:gw8:2026-10-22) failed: Error: Claude Code exited 1: Failed to authenticate. API Error: 401 Invalid bearer token",
      "Error: All 1 attempted stories failed; nothing filed.",
    ].join("\n");
    expect(reason(log)).toMatch(/^401: .*claude setup-token/);
  });

  it("quotes the first failure otherwise, cut to 200 characters", () => {
    const log = `.env.local not found.\nmatch-report (match-report:gw6:2026-10-10) failed: Error: Stopped on max_tokens, not a finished column.\nError: All 1 attempted stories failed; nothing filed.\n`;
    expect(reason(log)).toBe("failed: Error: Stopped on max_tokens, not a finished column.");
    expect(reason(`x failed: ${"y".repeat(400)}`)).toHaveLength(200);
  });

  it("says nothing for a log with no failure, or none at all", () => {
    expect(reason("Nothing new to report.\n")).toBe("");
    expect(reason(null)).toBe("");
  });
});
