import { describe, expect, it } from "vitest";
import { compareHref, seasonValue } from "./routes";

describe("compareHref", () => {
  it("carries the board's pair as the board always linked it", () => {
    expect(compareHref({ a: "03gu4", b: "04ab1" })).toBe("/players/analysis?a=03gu4&b=04ab1");
  });

  it("keeps the fields in the order given and drops the empty ones", () => {
    expect(compareHref({ b: "04ab1", a: undefined, qa: "" })).toBe("/players/analysis?b=04ab1");
    expect(compareHref({ b: "04ab1", a: "03gu4", qa: "sal" })).toBe("/players/analysis?b=04ab1&a=03gu4&qa=sal");
  });

  it("carries a season label with a dash", () => {
    expect(seasonValue("2024/25")).toBe("2024-25");
  });

  it("carries each side's season", () => {
    expect(compareHref({ a: "061vq", b: "061vq", bs: "2024-25" })).toBe("/players/analysis?a=061vq&b=061vq&bs=2024-25");
    expect(compareHref({ a: "061vq", as: undefined })).toBe("/players/analysis?a=061vq");
  });

  it("is the bare screen with nothing to carry", () => {
    expect(compareHref({})).toBe("/players/analysis");
  });
});
