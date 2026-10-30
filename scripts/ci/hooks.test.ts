import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The PreToolUse hooks fed a JSON payload, as Claude Code feeds them. Dangerous strings are built, never written whole.
const HOOKS = join(import.meta.dirname, "..", "..", ".claude", "hooks");
const G = "git";

type Verdict = "deny" | "ask" | "allow";

function verdict(hook: string, toolInput: object, env: NodeJS.ProcessEnv = {}): Verdict {
  const run = spawnSync("bash", [join(HOOKS, hook)], {
    input: JSON.stringify({ tool_input: toolInput }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: tree, GUARD_PROC_LIST: "", ...env },
    encoding: "utf8",
  });
  expect(run.status).toBe(0);
  if (!run.stdout.trim()) return "allow";
  return JSON.parse(run.stdout).hookSpecificOutput.permissionDecision ?? "allow";
}

const bash = (command: string, env?: NodeJS.ProcessEnv) => verdict("guard_bash.sh", { command }, env);

let tree: string;

function gitIn(...args: string[]): void {
  execFileSync(G, args, { cwd: tree, stdio: "pipe" });
}

beforeAll(() => {
  tree = mkdtempSync(join(tmpdir(), "hooks-"));
  gitIn("init", "--quiet", "-b", "feat/x");
  gitIn("-c", "user.name=T", "-c", "user.email=t@example.invalid", "commit", "--quiet", "--allow-empty", "-m", "root");
});
afterAll(() => rmSync(tree, { recursive: true, force: true }));

describe("guard_bash.sh", () => {
  it.each([
    [`${G} add -` + "A"],
    [`${G} add --` + "all"],
    [`${G} add` + " ."],
    [`${G} mer` + "ge origin/main"],
    [`${G} push --for` + "ce origin feat/x"],
    [`${G} push --for` + "ce-with-lease"],
    [`${G} push -` + "f origin feat/x"],
    [`${G} push origin ` + "+feat/x"],
    [`${G} push origin ` + "+HEAD:feat/x"],
  ])("denies %s", (command) => {
    expect(bash(command)).toBe("deny");
  });

  it.each([
    [`${G} push origin feat/x`],
    [`${G} push -u origin fix/a+b`],
    [`${G} add scripts/a.ts`],
    [`${G} mer` + "ge --abort"],
    ["npm test"],
  ])("allows %s", (command) => {
    expect(bash(command)).toBe("allow");
  });

  it("asks before a capture", () => {
    expect(bash("npm run capture")).toBe("ask");
  });

  it("asks before cutting a branch from another branch, not from origin/main", () => {
    expect(bash(`${G} switch -c feat/y feat/x`)).toBe("ask");
    expect(bash(`${G} switch -c feat/y origin/main`)).toBe("allow");
  });

  it("denies a commit on main", () => {
    gitIn("switch", "--quiet", "-c", "main");
    try {
      expect(bash(`${G} commit -m x`)).toBe("deny");
    } finally {
      gitIn("switch", "--quiet", "feat/x");
    }
    expect(bash(`${G} commit -m x`)).toBe("allow");
  });

  it.each([
    [`${G} push origin HEAD:` + "main"],
    [`${G} push origin feat/x:` + "main"],
    [`${G} push origin feat/x:refs/heads/` + "main"],
    [`${G} push origin ` + "main"],
    [`${G} push -u origin ` + "main && echo done"],
  ])("denies a push to main from a feature branch: %s", (command) => {
    expect(bash(command)).toBe("deny");
  });

  it.each([[`${G} push origin feat/main-menu`], [`${G} push -u origin fix/maintain`]])(
    "allows a branch whose name only contains main: %s",
    (command) => {
      expect(bash(command)).toBe("allow");
    },
  );

  it("asks before a staged file past 300 lines", () => {
    writeFileSync(join(tree, "big.ts"), "x\n".repeat(301));
    gitIn("add", "big.ts");
    try {
      expect(bash(`${G} commit -m x`)).toBe("ask");
    } finally {
      gitIn("rm", "--quiet", "--cached", "big.ts");
    }
  });

  describe("a second build or server", () => {
    const procs = (cwd: string, command: string) => ({ GUARD_PROC_LIST: `${cwd}\t${command}` });

    it("asks when a build or server runs in this tree", () => {
      expect(bash("npm run build", procs(join(tree, "apps"), "node next build"))).toBe("ask");
      expect(bash("npm run start", procs(tree, "next-server (v16)"))).toBe("ask");
    });

    it("allows a build beside this tree's server", () => {
      expect(bash("npm run build", procs(tree, "next-server (v16)"))).toBe("allow");
    });

    it("ignores another tree's build or server", () => {
      expect(bash("npm run build", procs("/elsewhere", "node next build"))).toBe("allow");
      expect(bash("npm run start", procs(`${tree}-sibling`, "next-server (v16)"))).toBe("allow");
    });
  });
});

describe("protect_snapshots.sh", () => {
  const write = (rel: string) => verdict("protect_snapshots.sh", { file_path: join(tree, rel) });

  it("asks before editing snapshots or mappings, and allows the rest", () => {
    expect(write("data/snapshots/2026-10-01/x.json")).toBe("ask");
    expect(write("data/mappings/fantrax.json")).toBe("ask");
    expect(write("scripts/a.ts")).toBe("allow");
    expect(verdict("protect_snapshots.sh", { file_path: "/elsewhere/data/snapshots/x" })).toBe("allow");
  });
});

describe("line_ceiling.sh", () => {
  const note = (lines: number) => {
    const file = join(tree, `f${lines}.ts`);
    writeFileSync(file, "x\n".repeat(lines));
    const run = spawnSync("bash", [join(HOOKS, "line_ceiling.sh")], {
      input: JSON.stringify({ tool_input: { file_path: file } }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: tree },
      encoding: "utf8",
    });
    return run.stdout;
  };

  it("notes past 250 and past 300, and is silent below", () => {
    expect(note(200)).toBe("");
    expect(note(260)).toContain("soft ceiling");
    expect(note(301)).toContain("HARD ceiling");
  });
});
