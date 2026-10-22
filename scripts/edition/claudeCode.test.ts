import { describe, expect, it } from "vitest";
import { claudeArgs, exitError, readResult } from "./claudeCode";

describe("claudeArgs", () => {
  it("runs bare of tools, settings, MCP and skills, with the voice as the whole system prompt", () => {
    const args = claudeArgs("THE VOICE", "claude-sonnet-5-5", "medium");
    expect(args.slice(0, 3)).toEqual(["-p", "--model", "claude-sonnet-5-5"]);
    expect(args).toEqual(expect.arrayContaining(["--strict-mcp-config", "--disable-slash-commands", "--no-session-persistence"]));
    expect(args[args.indexOf("--tools") + 1]).toBe("");
    expect(args[args.indexOf("--setting-sources") + 1]).toBe("");
    expect(args[args.indexOf("--system-prompt") + 1]).toBe("THE VOICE");
    expect(args.slice(-2)).toEqual(["--effort", "medium"]);
    expect(claudeArgs("v", "m", null)).not.toContain("--effort");
  });
});

describe("readResult", () => {
  it("reads the last JSON line past the CLI's warnings", () => {
    const out = `[claude-code:unrecognized_model] {"model":"x"}\n{"result":"{\\"ok\\":true}","stop_reason":"end_turn","usage":{"output_tokens":9}}\n`;
    expect(readResult(out)).toEqual({ text: '{"ok":true}', stopReason: "end_turn", usage: { output_tokens: 9 } });
  });

  it("throws on an error result and on no result at all", () => {
    expect(() => readResult('{"is_error":true,"result":"Not logged in"}')).toThrow("Not logged in");
    expect(() => readResult("nothing")).toThrow("printed no result");
  });
});

describe("exitError", () => {
  // CI cut the reason off at 300 characters of the JSON, so a refused token read as a blank failure (22 Oct 2026).
  it("names the CLI's own result when it printed one, past a long usage block", () => {
    const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, padding: "x".repeat(400) };
    const out = JSON.stringify({ is_error: true, usage, result: "Invalid API key · Please run /login" });
    expect(exitError(1, "", out).message).toBe("Claude Code exited 1: Invalid API key · Please run /login");
  });

  it("falls back to stderr, then the start of stdout, when there is no result", () => {
    expect(exitError(1, "boom", "").message).toBe("Claude Code exited 1: boom");
    expect(exitError(2, "", "not json").message).toBe("Claude Code exited 2: not json");
  });
});
