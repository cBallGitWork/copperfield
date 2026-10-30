import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// sync-intel.sh's helpers, sourced with SYNC_INTEL_LIB=1; gh and sleep are shell functions here, so nothing leaves the box.
const SCRIPT = join(import.meta.dirname, "sync-intel.sh");

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), "sync-intel-"))));
afterEach(() => rmSync(home, { recursive: true, force: true }));

/** Runs `body` after sourcing the helpers; returns its stdout, status and the log. */
function run(body: string): { status: number | null; stdout: string; log: string } {
  const log = join(home, "intel.log");
  const script = `set +e; source "${SCRIPT}" weekly; set +eE; trap - ERR EXIT; rm -rf "$OUT"; sleep() { echo "sleep $1" >>"${home}/sleeps"; }\n${body}`;
  const out = spawnSync("bash", ["-c", script], {
    encoding: "utf8",
    env: { HOME: home, SYNC_INTEL_LIB: "1", GH_TOKEN: "test", OPEN_ALERTS: "", INTEL_LOG: log },
  });
  let text = "";
  try {
    text = readFileSync(log, "utf8");
  } catch {
    text = "";
  }
  return { status: out.status, stdout: out.stdout, log: text };
}

describe("retry", () => {
  it("logs each failure with the command's own last line, and doubles its wait", () => {
    const r = run(`n=0; flaky() { n=$((n+1)); [ $n -ge 3 ] && { echo done; return 0; }; echo "ssh: connect to host github.com port 22: Undefined error: 0" >&2; return 1; }
retry "git fetch" flaky; echo "status $?"; cat "${home}/sleeps"`);
    expect(r.stdout).toContain("done\nstatus 0\nsleep 15\nsleep 30");
    expect(r.log).toMatch(/weekly git fetch failed, try 1 of 5: ssh: connect to host github.com port 22/);
    expect(r.log).toMatch(/try 2 of 5/);
  });

  it("gives up after five tries", () => {
    const r = run(`retry "git push" false; echo "status $?"; wc -l <"${home}/sleeps"`);
    expect(r.stdout).toMatch(/status 1\n\s*4/);
    expect(r.log.match(/git push failed/g)).toHaveLength(5);
  });
});

describe("open_pr", () => {
  it("opens the PR once: a create whose answer was lost finds the PR it opened", () => {
    const r = run(`BRANCH=chore/x; TITLE=t; CHANGED=c; made=0
gh() { case "$2" in view) [ -f "${home}/pr" ] && { echo https://github.com/o/r/pull/7; return 0; }; return 1 ;;
  create) touch "${home}/pr"; made=$((made+1)); echo "read: connection reset by peer" >&2; return 1 ;; esac; }
PR=$(retry "gh pr create" open_pr); echo "pr $PR"`);
    expect(r.stdout).toContain("pr https://github.com/o/r/pull/7");
    expect(r.log.match(/gh pr create failed/g)).toHaveLength(1);
    expect(r.stdout).not.toContain("gh pr create failed");
  });
});

/** Sources the helpers with OPEN_ALERTS unset and gh an exported function that answers `gh`'s exit status. */
function sourced(ghStatus: number, body: string): string {
  const script = `set +e; source "${SCRIPT}" weekly; set +eE; trap - ERR EXIT; rm -rf "$OUT"\n${body}`;
  return spawnSync("bash", ["-c", script], {
    encoding: "utf8",
    env: {
      HOME: home,
      SYNC_INTEL_LIB: "1",
      GH_TOKEN: "test",
      RETRY_WAIT: "0",
      INTEL_REPO: "o/r",
      INTEL_LOG: join(home, "intel.log"),
      DRY_RUN: "1",
      "BASH_FUNC_gh%%": `() { [ "$1" = issue ] && echo "alert: intel-cups"; return ${ghStatus}; }`,
    },
  }).stdout;
}

describe("the open alerts", () => {
  it("when GitHub never answers, the catch-up runs and a soft ok is still sent", () => {
    const out = sourced(1, `echo "unknown $ALERTS_UNKNOWN"; catch_up_due && echo due; soft intel-cups ok fine`);
    expect(out).toContain("unknown 1\ndue");
    expect(out).toContain("would alert intel-cups ok");
  });

  it("when GitHub answers, the catch-up waits for its own alert and ok goes only to an open one", () => {
    const out = sourced(0, `echo "unknown $ALERTS_UNKNOWN"; catch_up_due || echo idle; soft intel-cups ok a; soft intel-history ok b`);
    expect(out).toContain("unknown 0\nidle");
    expect(out).toContain("would alert intel-cups ok");
    expect(out).not.toContain("intel-history");
  });

  it("names the repo off INTEL_REPO", () => {
    expect(sourced(0, `echo "repo $REPO"`)).toContain("repo o/r");
  });
});
