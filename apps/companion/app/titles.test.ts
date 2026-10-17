import { describe, expect, it } from "vitest";
import { labelOf, subjectTitle, titled } from "./titles";

describe("titled", () => {
  it("names the subject, then the view", () => {
    expect(titled("Arsenal", "Depth")).toEqual({ title: "Arsenal · Depth" });
  });

  it("drops a part nobody could read", () => {
    expect(titled(null, "Depth", undefined, "")).toEqual({ title: "Depth" });
  });

  it("leaves the league's own title when there is nothing to say", () => {
    expect(titled(null, undefined)).toEqual({});
  });
});

describe("subjectTitle", () => {
  it("reads the subject off the route's params", async () => {
    const metadata = subjectTitle(async ({ code }: { code: string }) => (code === "3" ? "Arsenal" : null), "Stats");
    expect(await metadata({ params: Promise.resolve({ code: "3" }) })).toEqual({ title: "Arsenal · Stats" });
    expect(await metadata({ params: Promise.resolve({ code: "999" }) })).toEqual({ title: "Stats" });
  });
});

describe("labelOf", () => {
  it("says what the strip's tab says", () => {
    const tabs = [
      { key: "squad", label: "Squad" },
      { key: "setPieces", label: "Set Pieces" },
    ] as const;
    expect(labelOf(tabs, "setPieces")).toBe("Set Pieces");
  });
});
