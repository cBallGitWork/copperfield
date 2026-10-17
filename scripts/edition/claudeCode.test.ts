import { describe, expect, it } from "vitest";
import { claudeArgs, readResult } from "./claudeCode";

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
