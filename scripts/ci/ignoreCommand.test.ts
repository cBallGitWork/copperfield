import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// vercel.json's ignoreCommand against a throwaway repo, run from the project's root directory as Vercel runs it, with
// `ignore-build.sh` where the repo keeps it: exit 0 skips the production build, 1 builds.
const ROOT = join(import.meta.dirname, "..", "..");
const PROJECT = join("apps", "companion");
const SCRIPT = join("scripts", "ci", "ignore-build.sh");
const ignore = (JSON.parse(readFileSync(join(ROOT, PROJECT, "vercel.json"), "utf8")) as { ignoreCommand: string })
  .ignoreCommand;

/** Vercel refuses a longer ignoreCommand outright, "project-configuration" in 0 s (#531). */
const VERCEL_COMMAND_LIMIT = 256;

let repo: string;
let env: NodeJS.ProcessEnv;

function git(...args: string[]): void {
  execFileSync("git", args, { cwd: repo, env, stdio: "pipe" });
}

/** One commit touching these paths. */
function commit(...paths: string[]): void {
  for (const path of paths) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), `${path} ${Math.random()}\n`);
    git("add", path);
  }
  git("commit", "--quiet", "-m", paths.join(" "));
}

/** Whether Vercel would build production for the commit at HEAD. */
function builds(): boolean {
  const run = spawnSync("bash", ["-c", ignore], { cwd: join(repo, PROJECT), env: { ...env, VERCEL_ENV: "production" } });
  return run.status === 1;
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "ignore-command-"));
  const kept = Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_"));
  env = { ...Object.fromEntries(kept), HOME: repo, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: join(repo, ".gitconfig") };
  writeFileSync(join(repo, ".gitconfig"), "[user]\n\tname = Test\n\temail = test@example.invalid\n[init]\n\tdefaultBranch = main\n");
  git("init", "--quiet");
  mkdirSync(dirname(join(repo, SCRIPT)), { recursive: true });
  copyFileSync(join(ROOT, SCRIPT), join(repo, SCRIPT));
  commit("apps/companion/app/page.tsx");
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe("the ignoreCommand", () => {
  it("fits under Vercel's limit", () => {
    expect(ignore.length).toBeLessThan(VERCEL_COMMAND_LIMIT);
  });

  it("skips every build that is not production's", () => {
    const run = spawnSync("bash", ["-c", ignore], { cwd: join(repo, PROJECT), env: { ...env, VERCEL_ENV: "preview" } });
    expect(run.status).toBe(0);
  });
});

describe("production builds", () => {
  it("for a change to what the app serves, a data file it bakes in included", () => {
    commit("apps/companion/app/page.tsx");
    expect(builds()).toBe(true);
    commit("data/intel/squads/26-27.json");
    expect(builds()).toBe(true);
    commit("docs/ui/squad.md", "packages/core/src/index.ts");
    expect(builds()).toBe(true);
  });

  it("not for captures and probes, which the app never reads", () => {
    commit("data/snapshots/fantrax/a.json", "data/probes/b.json");
    expect(builds()).toBe(false);
  });

  // 22 Oct 2026: the repo is public again, so the club page reads them off the branch; each build fired an FPL 403 burst.
  it("not for the predicted elevens alone", () => {
    commit("data/intel/xi/26-27.json");
    expect(builds()).toBe(false);
    commit("data/intel/xi/26-27.json", "data/intel/squads/26-27.json");
    expect(builds()).toBe(true);
  });

  // 16 Oct 2026: a docs-only commit built production (1ee08603), and so did each change to the crew's own files.
  it("not for the docs, the crew or any Markdown file, which cannot change what the app serves", () => {
    commit("docs/rules/PRODUCT.md");
    expect(builds()).toBe(false);
    commit("CLAUDE.md", "data/README.md", ".claude/skills/verify/SKILL.md", ".claude/hooks/guard.sh");
    expect(builds()).toBe(false);
  });
});
