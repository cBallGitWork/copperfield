import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// alert.sh against a fake gh that lists no open issue and prints the body it would file.
const SCRIPT = join(import.meta.dirname, "alert.sh");
const FAKE_GH = `#!/usr/bin/env bash
case "$1 $2" in
  "issue list") echo "[]" ;;
  "issue create") while [ $# -gt 0 ]; do [ "$1" = --body ] && printf '%s' "$2"; shift; done ;;
esac
`;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "alert-"));
  writeFileSync(join(dir, "gh"), FAKE_GH);
  chmodSync(join(dir, "gh"), 0o755);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function filed(message: string): string {
  const run = spawnSync("bash", [SCRIPT, "test-job", "fail", message], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_REPOSITORY: "o/r", GITHUB_REPOSITORY_OWNER: "o" },
  });
  expect(run.status).toBe(0);
  return run.stdout;
}

describe("alert.sh redaction", () => {
  it.each([
    ["a GitHub token", "ghp_abcdefABCDEF0123456789"],
    ["an Anthropic key", "sk-ant-api03-AbC_dEf-0123456789xyz"],
    ["an OpenAI key", "sk-proj-AbCdEf0123456789_-xyzXYZ"],
  ])("redacts %s", (_, secret) => {
    const body = filed(`failed with ${secret} in the log`);
    expect(body).toContain("failed with [redacted] in the log");
    expect(body).not.toContain(secret);
  });

  it("redacts the values of Fantrax's cookies and keeps their names", () => {
    const body = filed("Cookie: JSESSIONID=node0abc123.node0; FX_RM=dGVzdA==_xyz; other=1");
    expect(body).toContain("JSESSIONID=[redacted]; FX_RM=[redacted]; other=1");
  });

  it("leaves a plain sentence alone", () => {
    expect(filed("capture failed: see run 123")).toContain("capture failed: see run 123");
  });
});
