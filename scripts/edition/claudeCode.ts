import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { MODEL_TIMEOUT_MS } from "@epl/core";

// One model call through Claude Code on the Max subscription (Craig, 14 Oct 2026: "we use max claude from now on"):
// headless, no tools, settings, MCP or skills, the voice the whole system prompt, run from a scratch directory so no
// CLAUDE.md loads. Locally the CLI's own login pays; in CI, CLAUDE_CODE_OAUTH_TOKEN from `claude setup-token`.

/** What a call returns, in the API's own words, so the newsroom reads both routes alike. */
export interface Reply {
  text: string;
  stopReason: string | undefined;
  usage: Record<string, number> | undefined;
}

/** The CLI's flags for one call; `effort` null leaves the CLI's default. */
export function claudeArgs(system: string, model: string, effort: string | null): string[] {
  return [
    "-p", "--model", model, "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--disable-slash-commands",
    "--no-session-persistence", "--output-format", "json", "--system-prompt", system,
    ...(effort === null ? [] : ["--effort", effort]),
  ];
}

/** The CLI's one JSON result, or a throw naming what it said instead. */
export function readResult(stdout: string): Reply {
  const line = stdout.trim().split("\n").reverse().find((l) => l.startsWith("{"));
  if (line === undefined) throw new Error(`Claude Code printed no result: ${stdout.slice(0, 300)}`);
  const body = JSON.parse(line) as { is_error?: boolean; result?: string; stop_reason?: string; usage?: Record<string, number> };
  if (body.is_error === true) throw new Error(`Claude Code: ${body.result ?? "an error with no message"}`);
  return { text: body.result ?? "", stopReason: body.stop_reason, usage: body.usage };
}

export function viaClaudeCode(system: string, brief: string, model: string, maxTokens: number, effort: string | null): Promise<Reply> {
  // With an API key in its environment the CLI bills the key, which is the thing this route exists to stop.
  const { ANTHROPIC_API_KEY: _key, ...env } = process.env;
  return new Promise((resolve, reject) => {
    const child = spawn("claude", claudeArgs(system, model, effort), {
      cwd: tmpdir(),
      env: { ...env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: String(maxTokens) },
      timeout: MODEL_TIMEOUT_MS,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk: Buffer) => (out += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (err += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      try {
        resolve(readResult(out));
      } catch (error) {
        reject(code === 0 ? error : new Error(`Claude Code exited ${code}: ${err.slice(-300) || out.slice(0, 300)}`));
      }
    });
    child.stdin.end(brief);
  });
}
