import { describe, expect, it, vi } from "vitest";

const replies = [
  { text: "{}", stopReason: "end_turn", usage: { input_tokens: 10, cache_creation_input_tokens: 5, cache_read_input_tokens: 100, output_tokens: 7 } },
  { text: "{}", stopReason: "end_turn", usage: { input_tokens: 1, output_tokens: 2 } },
];
vi.mock("./claudeCode", () => ({ viaClaudeCode: async () => replies.shift() }));
const { helperFailed, spentSince, tokensLine, tokensSpent, writeColumn } = await import("./newsroom");
const { lineEditBrief } = await import("./sendBack");

describe("the firing's token count", () => {
  it("counts every call, cache writes as input and cache reads apart, from a desk's mark", async () => {
    await writeColumn("V", "B");
    const mark = tokensSpent();
    await writeColumn("V", "B", "helper");
    expect(spentSince({ input: 0, cached: 0, output: 0 })).toEqual({ input: 16, cached: 100, output: 9 });
    expect(tokensLine(spentSince(mark))).toBe("1 tokens in, 0 from cache, 2 out");
  });
});

describe("helperFailed", () => {
  it("logs the failed step and hands back the fallback", async () => {
    const said: string[] = [];
    const out = await Promise.reject(new Error("timed out")).catch(helperFailed((line) => said.push(line), "reports", "pun writer", null));
    expect(out).toBeNull();
    expect(said).toEqual(["  reports: the pun writer failed, timed out"]);
  });
});

describe("lineEditBrief", () => {
  it("numbers each sentence with the words it must lose", () => {
    expect(lineEditBrief([{ sentence: "He banked it.", words: ["banked"] }, { sentence: "A roster move.", words: ["roster", "move"] }])).toBe("1. He banked it. [banked]\n2. A roster move. [roster, move]");
  });
});
